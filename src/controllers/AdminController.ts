import { Request, Response } from "express";
import { User } from "~/models/User";
import { AppError } from "~/middlewares/errorHandler";

export class AdminController {
  // Criar novo usuário (apenas admin)
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, cpf, role } = req.body;

      // Validações
      if (!name || !email || !password || !role) {
        throw new AppError("Nome, email, senha e role são obrigatórios", 400);
      }

      // Validar role
      if (!["teacher", "admin"].includes(role)) {
        throw new AppError("Role inválida. Use: teacher ou admin", 400);
      }

      // Verificar se email já existe
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        throw new AppError("Este email já está em uso", 400);
      }

      // Verificar se CPF já existe (se fornecido)
      if (cpf) {
        const cpfExists = await User.findOne({ cpf });
        if (cpfExists) {
          throw new AppError("Este CPF já está cadastrado", 400);
        }
      }

      // Criar usuário
      const user = await User.create({
        name,
        email,
        password,
        cpf,
        role,
      });

      res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          cpf: user.cpf,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Erro ao criar usuário",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  // Listar todos os usuários (apenas admin)
  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.find().select("-password");

      res.status(200).json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro ao listar usuários",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  // Buscar usuário por ID (apenas admin)
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select("-password");

      if (!user) {
        throw new AppError("Usuário não encontrado", 404);
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Erro ao buscar usuário",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  // Deletar usuário (apenas admin)
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Buscar usuário
      const user = await User.findById(id);

      if (!user) {
        throw new AppError("Usuário não encontrado", 404);
      }

      // Prevenir que admin delete a si mesmo
      if (req.user && user._id.toString() === req.user.id) {
        throw new AppError("Você não pode deletar sua própria conta", 403);
      }

      await user.deleteOne();

      res.status(200).json({
        success: true,
        message: "Usuário deletado com sucesso",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Erro ao deletar usuário",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
}
