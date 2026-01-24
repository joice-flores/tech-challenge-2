# Middlewares

## 📁 Arquivos

**validateRequest.ts** - Validação de dados (campos obrigatórios, tipos, min/max, regex, enum)

```typescript
validateRequest({
  name: { required: true, type: "string", min: 3 },
  price: { type: "number", min: 0 },
});
```

**errorHandler.ts** - Tratamento centralizado de erros

```typescript
throw new AppError("Não encontrado", 404); // AppError customizado
// Trata: Mongoose errors, MongoDB duplicação, rotas não encontradas
```

**auth.ts** - Autenticação e autorização

```typescript
authenticate; // API Key (x-api-key)
verifyToken; // Bearer Token
authorize("admin", "moderator"); // Roles
```

## 🔄 Ordem de Execução

```typescript
app.use(express.json()); // 1. Parsing (sempre primeiro)
app.use("/posts", postRoutes); // 3. Rotas
app.use(notFound); // 4. 404
app.use(errorHandler); // 5. Erros (sempre último)
```

## 🎯 Boas Práticas

- Middlewares globais no app.ts, específicos nas rotas
- errorHandler sempre por último
- Use `next(error)` em rotas assíncronas
- Reutilize ao invés de duplicar

## 📝 Custom Middleware

```typescript
import { Request, Response, NextFunction } from "express";

export function meuMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Lógica aqui
  next(); // Ou res.status(400).json({error: "..."})
}
```
