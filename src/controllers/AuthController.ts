import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "~/models/User";
import { AppError } from "~/middlewares/errorHandler";

export class AuthController {
  // Login de usuário
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validação básica
      if (!email || !password) {
        throw new AppError("Email e senha são obrigatórios", 400);
      }

      // Buscar usuário com senha (select: false é ignorado aqui)
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        throw new AppError("Credenciais inválidas", 401);
      }

      // Verificar senha
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw new AppError("Credenciais inválidas", 401);
      }

      // Gerar token JWT
      const token = this.generateToken(user);

      res.status(200).json({
        success: true,
        message: "Login realizado com sucesso",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            cpf: user.cpf,
          },
          token,
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
        message: "Erro ao fazer login",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  // Buscar usuário autenticado (requer middleware de autenticação)
  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        throw new AppError("Usuário não encontrado", 404);
      }

      res.status(200).json({
        success: true,
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
        message: "Erro ao buscar dados do usuário",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  // Atualizar dados do usuário autenticado
  async update(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const { name, email, password, cpf } = req.body;

      // Buscar usuário atual
      const user = await User.findById(req.user.id);

      if (!user) {
        throw new AppError("Usuário não encontrado", 404);
      }

      // Verificar se email já existe (se estiver mudando)
      if (email && email !== user.email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          throw new AppError("Email já está em uso", 409);
        }
        user.email = email;
      }

      // Verificar se CPF já existe (se estiver mudando)
      if (cpf && cpf !== user.cpf) {
        const existingCpf = await User.findOne({ cpf });
        if (existingCpf) {
          throw new AppError("CPF já está em uso", 409);
        }
        user.cpf = cpf;
      }

      // Atualizar campos permitidos
      if (name) user.name = name;
      if (password) user.password = password; // Será hasheado pelo pre-save hook

      await user.save();

      res.status(200).json({
        success: true,
        message: "Usuário atualizado com sucesso",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          cpf: user.cpf,
          updatedAt: user.updatedAt,
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

      if (error instanceof Error && error.name === "ValidationError") {
        res.status(400).json({
          success: false,
          message: "Dados inválidos",
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Erro ao atualizar usuário",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  // Método privado para gerar token JWT
  private generateToken(user: IUser): string {
    const secret = process.env.JWT_SECRET || "seu-secret-super-seguro";

    return jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: "7d" },
    );
  }
}
