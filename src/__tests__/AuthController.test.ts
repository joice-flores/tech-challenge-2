import { Request, Response } from 'express';
import { AuthController } from '~/controllers/AuthController';
import { User } from '~/models/User';

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    authController = new AuthController();
    mockRequest = {
      body: {},
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('login', () => {
    it('should return 400 if email or password is missing', async () => {
      mockRequest.body = { email: '', password: '' };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email e senha são obrigatórios',
      });
    });

    it('should return 401 if user not found', async () => {
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciais inválidas',
      });
    });

    it('should return 200 and token on successful login', async () => {
      // Cria um usuário de teste
      const testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'teacher',
      });

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login realizado com sucesso',
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'test@example.com',
              role: 'teacher',
            }),
            token: expect.any(String),
          }),
        })
      );
    });

    it('should return 401 on invalid password', async () => {
      // Cria um usuário de teste
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'teacher',
      });

      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciais inválidas',
      });
    });
  });

  describe('me', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await authController.me(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuário não autenticado',
      });
    });

    it('should return 404 if user not found', async () => {
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011', // ID válido mas não existente
        email: 'test@example.com',
        role: 'teacher',
      };

      await authController.me(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuário não encontrado',
      });
    });

    it('should return user data on success', async () => {
      // Cria um usuário de teste
      const testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'teacher',
      });

      mockRequest.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: testUser.role,
      };

      await authController.me(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: testUser._id,
          name: 'Test User',
          email: 'test@example.com',
          role: 'teacher',
          cpf: '12345678901',
        }),
      });
    });
  });

  describe('update', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = { name: 'New Name' };

      await authController.update(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuário não autenticado',
      });
    });

    it('should update user data successfully', async () => {
      // Cria um usuário de teste
      const testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'teacher',
      });

      mockRequest.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: testUser.role,
      };
      mockRequest.body = { name: 'Updated Name' };

      await authController.update(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Usuário atualizado com sucesso',
          data: expect.objectContaining({
            name: 'Updated Name',
          }),
        })
      );
    });

    it('should return 409 if email already exists', async () => {
      // Cria dois usuários
      const user1 = await User.create({
        name: 'User 1',
        email: 'user1@example.com',
        password: 'password123',
        cpf: '11111111111',
        role: 'teacher',
      });

      await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        password: 'password123',
        cpf: '22222222222',
        role: 'teacher',
      });

      mockRequest.user = {
        id: user1._id.toString(),
        email: user1.email,
        role: user1.role,
      };
      mockRequest.body = { email: 'user2@example.com' }; // Try to use existing email

      await authController.update(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email já está em uso',
      });
    });
  });
});
