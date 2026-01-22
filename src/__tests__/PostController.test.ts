import { Request, Response } from 'express';
import { PostController } from '~/controllers/PostController';
import { Post } from '~/models/Post';
import { User } from '~/models/User';

describe('PostController', () => {
  let postController: PostController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let testUser: any;

  beforeEach(async () => {
    postController = new PostController();

    // Cria um usuário de teste para requisições autenticadas
    testUser = await User.create({
      name: 'Test Teacher',
      email: 'teacher@example.com',
      password: 'password123',
      cpf: '12345678901',
      role: 'teacher',
    });

    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        id: testUser._id.toString(),
        email: testUser.email,
        role: testUser.role,
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createPost', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = {
        title: 'Test Post',
        content: 'Test content',
      };

      await postController.createPost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuário não autenticado',
      });
    });

    it('should create a post successfully', async () => {
      mockRequest.body = {
        title: 'Test Post',
        content: 'Test content',
      };

      await postController.createPost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Post',
          content: 'Test content',
          authorId: expect.objectContaining({
            email: 'teacher@example.com',
          }),
        })
      );
    });
  });

  describe('listPosts', () => {
    it('should return empty array when no posts exist', async () => {
      await postController.listPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('should return all posts', async () => {
      // Cria posts de teste
      await Post.create({
        title: 'Post 1',
        content: 'Content 1',
        authorId: testUser._id,
      });
      await Post.create({
        title: 'Post 2',
        content: 'Content 2',
        authorId: testUser._id,
      });

      await postController.listPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Post 1' }),
          expect.objectContaining({ title: 'Post 2' }),
        ])
      );
    });
  });

  describe('getPostById', () => {
    it('should return 404 if post not found', async () => {
      mockRequest.params = { id: '507f1f77bcf86cd799439011' }; // ID válido mas não existente

      await postController.getPostById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Post não encontrado',
      });
    });

    it('should return post by ID', async () => {
      const post = await Post.create({
        title: 'Test Post',
        content: 'Test content',
        authorId: testUser._id,
      });

      mockRequest.params = { id: post._id.toString() };

      await postController.getPostById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Post',
          content: 'Test content',
        })
      );
    });
  });

  describe('updatePost', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: '123' };
      mockRequest.body = { title: 'Updated Title' };

      await postController.updatePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuário não autenticado',
      });
    });

    it('should return 404 if post not found', async () => {
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockRequest.body = { title: 'Updated Title' };

      await postController.updatePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Post não encontrado',
      });
    });

    it('should update post successfully by author', async () => {
      const post = await Post.create({
        title: 'Original Title',
        content: 'Original content',
        authorId: testUser._id,
      });

      mockRequest.params = { id: post._id.toString() };
      mockRequest.body = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      await postController.updatePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          content: 'Updated content',
        })
      );
    });

    it('should return 403 if user is not author or admin', async () => {
      const anotherUser = await User.create({
        name: 'Another Teacher',
        email: 'another@example.com',
        password: 'password123',
        cpf: '98765432101',
        role: 'teacher',
      });

      const post = await Post.create({
        title: 'Test Post',
        content: 'Test content',
        authorId: anotherUser._id, // Criado por outro usuário
      });

      mockRequest.params = { id: post._id.toString() };
      mockRequest.body = { title: 'Updated Title' };

      await postController.updatePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acesso negado. Apenas o autor do post ou admin podem editá-lo.',
      });
    });
  });

  describe('deletePost', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: '123' };

      await postController.deletePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuário não autenticado',
      });
    });

    it('should delete post successfully by author', async () => {
      const post = await Post.create({
        title: 'Test Post',
        content: 'Test content',
        authorId: testUser._id,
      });

      mockRequest.params = { id: post._id.toString() };

      await postController.deletePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Post deletado com sucesso',
      });

      // Verifica se o post foi deletado
      const deletedPost = await Post.findById(post._id);
      expect(deletedPost).toBeNull();
    });

    it('should return 403 if user is not author or admin', async () => {
      const anotherUser = await User.create({
        name: 'Another Teacher',
        email: 'another@example.com',
        password: 'password123',
        cpf: '98765432101',
        role: 'teacher',
      });

      const post = await Post.create({
        title: 'Test Post',
        content: 'Test content',
        authorId: anotherUser._id,
      });

      mockRequest.params = { id: post._id.toString() };

      await postController.deletePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acesso negado. Apenas o autor do post ou admin podem deletá-lo.',
      });
    });
  });

  describe('searchPosts', () => {
    it('should return 400 if keyword is missing', async () => {
      mockRequest.query = {};

      await postController.searchPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Palavra-chave é obrigatória',
      });
    });

    it('should search posts by title', async () => {
      await Post.create({
        title: 'JavaScript Tutorial',
        content: 'Learn JS',
        authorId: testUser._id,
      });
      await Post.create({
        title: 'Python Guide',
        content: 'Learn Python',
        authorId: testUser._id,
      });

      mockRequest.query = { keyword: 'JavaScript' };

      await postController.searchPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall).toHaveLength(1);
      expect(jsonCall[0]).toMatchObject({
        title: 'JavaScript Tutorial',
      });
    });

    it('should search posts with accent-insensitive search', async () => {
      await Post.create({
        title: 'Programação em TypeScript',
        content: 'Aprenda TypeScript',
        authorId: testUser._id,
      });

      mockRequest.query = { keyword: 'programacao' }; // Sem acento

      await postController.searchPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall).toHaveLength(1);
      expect(jsonCall[0]).toMatchObject({
        title: 'Programação em TypeScript',
      });
    });

    it('should search posts by author name', async () => {
      const author = await User.create({
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
        cpf: '11111111111',
        role: 'teacher',
      });

      await Post.create({
        title: 'Post by João',
        content: 'Content',
        authorId: author._id,
      });

      mockRequest.query = { keyword: 'joão' };

      await postController.searchPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.length).toBeGreaterThan(0);
    });

    it('should search posts by ID', async () => {
      const post = await Post.create({
        title: 'Test Post',
        content: 'Test content',
        authorId: testUser._id,
      });

      mockRequest.query = { keyword: post._id.toString() };

      await postController.searchPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall).toHaveLength(1);
      expect(jsonCall[0]._id.toString()).toBe(post._id.toString());
    });
  });

  describe('listPostsByAuthor', () => {
    it('should return posts by specific author', async () => {
      const author1 = await User.create({
        name: 'Author 1',
        email: 'author1@example.com',
        password: 'password123',
        cpf: '11111111111',
        role: 'teacher',
      });

      const author2 = await User.create({
        name: 'Author 2',
        email: 'author2@example.com',
        password: 'password123',
        cpf: '22222222222',
        role: 'teacher',
      });

      await Post.create({
        title: 'Post by Author 1',
        content: 'Content 1',
        authorId: author1._id,
      });
      await Post.create({
        title: 'Another post by Author 1',
        content: 'Content 2',
        authorId: author1._id,
      });
      await Post.create({
        title: 'Post by Author 2',
        content: 'Content 3',
        authorId: author2._id,
      });

      mockRequest.params = { authorId: author1._id.toString() };

      await postController.listPostsByAuthor(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall).toHaveLength(2);
      expect(jsonCall.every((post: any) =>
        post.authorId._id.toString() === author1._id.toString()
      )).toBe(true);
    });
  });
});
