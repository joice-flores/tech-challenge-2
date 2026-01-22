import { Request, Response } from "express";
import mongoose from "mongoose";
import { Post } from "~/models/Post";
import { User } from "~/models/User";
import { AppError } from "~/middlewares/errorHandler";

export class PostController {
  // Criar novo post
  async createPost(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const { title, content } = req.body;
      const newPost = new Post({
        title,
        content,
        authorId: req.user.id, // Salva o ID do usuário que criou
      });
      const savedPost = await newPost.save();
      const populatedPost = await Post.findById(savedPost._id).populate(
        "authorId",
        "name email role",
      );
      res.status(201).json(populatedPost);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      res.status(500).json({ error: "Erro ao criar post" });
    }
  }
  // Listar todos os posts
  async listPosts(req: Request, res: Response): Promise<void> {
    try {
      const posts = await Post.find().populate("authorId", "name email role");
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar posts" });
    }
  }
  // Lista todos os posts de um autor específico
  async listPostsByAuthor(req: Request, res: Response): Promise<void> {
    try {
      const { authorId } = req.params;
      const posts = await Post.find({ authorId }).populate(
        "authorId",
        "name email role",
      );
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar posts do autor" });
    }
  }
  // Buscar post por ID
  async getPostById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const post = await Post.findById(id).populate(
        "authorId",
        "name email role",
      );
      if (!post) {
        res.status(404).json({ error: "Post não encontrado" });
        return;
      }
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar post" });
    }
  }
  // Atualizar post por ID
  async updatePost(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const { id } = req.params;
      const { title, content } = req.body;

      // Buscar o post primeiro para verificar autoria
      const post = await Post.findById(id);
      if (!post) {
        res.status(404).json({ error: "Post não encontrado" });
        return;
      }

      // Verificar se o usuário é o autor ou admin
      const isAuthor = post.authorId.toString() === req.user.id;
      const isAdmin = req.user.role === "admin";

      if (!isAuthor && !isAdmin) {
        throw new AppError(
          "Acesso negado. Apenas o autor do post ou admin podem editá-lo.",
          403,
        );
      }

      // Atualizar o post
      const updatedPost = await Post.findByIdAndUpdate(
        id,
        { title, content, updatedAt: new Date() },
        { new: true },
      ).populate("authorId", "name email role");

      res.status(200).json(updatedPost);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      res.status(500).json({ error: "Erro ao atualizar post" });
    }
  }
  // Deletar post por ID
  async deletePost(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const { id } = req.params;

      // Buscar o post primeiro para verificar autoria
      const post = await Post.findById(id);
      if (!post) {
        res.status(404).json({ error: "Post não encontrado" });
        return;
      }

      // Verificar se o usuário é o autor ou admin
      const isAuthor = post.authorId.toString() === req.user.id;
      const isAdmin = req.user.role === "admin";

      if (!isAuthor && !isAdmin) {
        throw new AppError(
          "Acesso negado. Apenas o autor do post ou admin podem deletá-lo.",
          403,
        );
      }

      // Deletar o post
      await Post.findByIdAndDelete(id);
      res.status(200).json({ message: "Post deletado com sucesso" });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      res.status(500).json({ error: "Erro ao deletar post" });
    }
  }
  //Buscar posts por palavra-chave
  async searchPosts(req: Request, res: Response): Promise<void> {
    try {
      const { keyword } = req.query;

      if (!keyword || typeof keyword !== "string") {
        res.status(400).json({ error: "Palavra-chave é obrigatória" });
        return;
      }

      // Função para remover acentos
      const removeAccents = (str: string): string => {
        return str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      };

      const normalizedKeyword = removeAccents(keyword);

      // Buscar usuários (teachers) que correspondem ao keyword (sem acento)
      const allUsers = await User.find().select("_id name");
      const matchingUsers = allUsers.filter((user: any) =>
        removeAccents(user.name).includes(normalizedKeyword),
      );
      const userIds = matchingUsers.map((user: any) => user._id);

      // Buscar posts
      const allPosts = await Post.find().populate(
        "authorId",
        "name email role",
      );

      // Filtrar posts manualmente para ignorar acentos
      const filteredPosts = allPosts.filter((post: any) => {
        // Buscar por ID
        if (
          mongoose.Types.ObjectId.isValid(keyword) &&
          post._id.toString() === keyword
        ) {
          return true;
        }

        // Buscar no título
        if (removeAccents(post.title).includes(normalizedKeyword)) {
          return true;
        }

        // Buscar no conteúdo
        if (removeAccents(post.content).includes(normalizedKeyword)) {
          return true;
        }

        // Buscar por autor
        if (userIds.some((id) => id.toString() === post.authorId._id.toString())) {
          return true;
        }

        return false;
      });

      res.status(200).json(filteredPosts);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar posts" });
    }
  }
}
