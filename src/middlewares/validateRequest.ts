import { Request, Response, NextFunction } from "express";

// Tipo para definir regras de validação
type ValidationRules = {
  [key: string]: {
    required?: boolean;
    type?: "string" | "number" | "boolean" | "array" | "object";
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
  };
};

// Middleware de validação genérico
export function validateRequest(rules: ValidationRules) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];

      // Validar campo obrigatório
      if (rule.required && (value === undefined || value === null || value === "")) {
        errors.push(`Campo '${field}' é obrigatório`);
        continue;
      }

      // Se o campo não é obrigatório e está vazio, pular outras validações
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Validar tipo
      if (rule.type) {
        const actualType = Array.isArray(value) ? "array" : typeof value;
        if (actualType !== rule.type) {
          errors.push(`Campo '${field}' deve ser do tipo ${rule.type}`);
          continue;
        }
      }

      // Validar valor mínimo (para números e strings)
      if (rule.min !== undefined) {
        if (typeof value === "number" && value < rule.min) {
          errors.push(`Campo '${field}' deve ser maior ou igual a ${rule.min}`);
        } else if (typeof value === "string" && value.length < rule.min) {
          errors.push(`Campo '${field}' deve ter no mínimo ${rule.min} caracteres`);
        }
      }

      // Validar valor máximo (para números e strings)
      if (rule.max !== undefined) {
        if (typeof value === "number" && value > rule.max) {
          errors.push(`Campo '${field}' deve ser menor ou igual a ${rule.max}`);
        } else if (typeof value === "string" && value.length > rule.max) {
          errors.push(`Campo '${field}' deve ter no máximo ${rule.max} caracteres`);
        }
      }

      // Validar padrão regex
      if (rule.pattern && typeof value === "string") {
        if (!rule.pattern.test(value)) {
          errors.push(`Campo '${field}' está em formato inválido`);
        }
      }

      // Validar enum
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`Campo '${field}' deve ser um dos valores: ${rule.enum.join(", ")}`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: "Erro de validação",
        errors,
      });
      return;
    }

    next();
  };
}

// Exemplo de validação específica para posts
export const validatePost = validateRequest({
  title: {
    required: true,
    type: "string",
    min: 3,
    max: 100,
  },
  content: {
    required: true,
    type: "string",
    min: 10,
  },
  status: {
    required: false,
    enum: ["draft", "published", "archived"],
  },
});
