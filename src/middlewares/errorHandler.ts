import { Request, Response, NextFunction } from "express";

// Classe customizada para erros da aplicação
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de tratamento de erros global
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  console.error("Erro capturado:", error);

  // Se for um erro customizado da aplicação
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  // Erros do Mongoose (validação, cast, etc)
  if (error.name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: "Erro de validação",
      error: error.message,
    });
    return;
  }

  if (error.name === "CastError") {
    res.status(400).json({
      success: false,
      message: "ID inválido",
    });
    return;
  }

  // Erro de chave duplicada no MongoDB
  if (
    error.name === "MongoServerError" &&
    "code" in error &&
    error.code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: "Registro duplicado",
    });
    return;
  }

  // Erro genérico do servidor
  res.status(500).json({
    success: false,
    message: "Erro interno do servidor",
  });
}
