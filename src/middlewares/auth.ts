import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "~/models/User";
import { AppError } from "~/middlewares/errorHandler";

// Extender o tipo Request para incluir propriedades customizadas
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Middleware de autenticação
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      throw new AppError("API Key não fornecida", 401);
    }

    // Validação real da API Key
    const validApiKey = process.env.API_KEY || "seu-api-key-secreto";

    if (apiKey !== validApiKey) {
      throw new AppError("API Key inválida", 401);
    }

    // Adiciona informações do usuário ao request
    req.user = {
      id: "user-123",
      email: "user@example.com",
      role: "admin",
    };

    next();
  } catch (error) {
    next(error);
  }
}

// Middleware de autorização por role
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError("Acesso negado. Permissão insuficiente.", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Middleware de verificação de Token
export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Token não fornecido", 401);
    }

    const token = authHeader.substring(7);

    if (!token || token === "") {
      throw new AppError("Token inválido", 401);
    }

    // Verificar JWT
    const secret = process.env.JWT_SECRET || "seu-secret-super-seguro";

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
    };

    // Verificar se usuário ainda existe
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError("Usuário não encontrado", 401);
    }

    // Adicionar dados do usuário ao request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError("Token inválido", 401));
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError("Token expirado", 401));
      return;
    }
    next(error);
  }
}
