# 📖 API Documentation - Tech Challenge 2

**Base URL:** `http://localhost:3000`

## 🎯 Visão Geral

API RESTful para posts educacionais com autenticação JWT e controle de acesso baseado em roles (teacher/admin).

**Características:**

- JWT (válido 7 dias) via `Authorization: Bearer {token}`
- Apenas admins criam contas
- Posts: leitura pública, escrita restrita (teacher/admin)
- Teacher: edita/deleta apenas próprios posts
- Admin: acesso total (usuários e posts)

**Respostas:**

````json
// Sucesso
{"success": true, "message": "...", "data": {}}

// Erro
{"success": false, "message": "..."}

## 📚 Endpoints

### Authentication

**POST /auth/login** - Autenticar usuário
```json
Body: {"email": "user@escola.com", "password": "senha123"}
Response: {"success": true, "data": {"user": {...}, "token": "..."}}
````

**GET /auth/me** 🔐 - Dados do usuário autenticado

```json
Response: {"success": true, "data": {"id": "...", "name": "...", "email": "...", "role": "teacher"}}
```

**PUT /auth/me** 🔐 - Atualizar perfil (campos opcionais: name, email, password, cpf)

```json
Body: {"name": "Novo Nome", "email": "novo@email.com"}
Validations: name (3+ chars), email (válido, único), password (6+ chars), cpf (11 dígitos, único)
```

### Admin 🔐 (role: admin)

**POST /admin/users** - Criar usuário

```json
Body: {"name": "Prof João", "email": "prof@escola.com", "password": "senha123", "cpf": "12345678901", "role": "teacher"}
Validations: name (3+ chars), email (válido, único), password (6+ chars), cpf (11 dígitos, único, opcional), role (teacher/admin)
```

**GET /admin/users** - Listar usuários

```json
Response: {"success": true, "data": [...], "count": N}
```

**GET /admin/users/:id** - Buscar usuário por ID

**PUT /admin/users/:id/role** - Atualizar role do usuário

```json
Body: {"role": "teacher"} ou {"role": "admin"}
```

**DELETE /admin/users/:id** - Deletar usuário (não pode deletar a si mesmo)

### Posts

**GET /posts** - Listar todos (público, retorna dados do author via populate)

**GET /posts/:id** - Buscar por ID (público)

**GET /posts/author/:authorId** - Posts por autor (público, usa ID do teacher)

**GET /posts/search?keyword=...** - Busca inteligente (público)

- Busca em: ID do post, título, conteúdo, nome do autor
- Ignora maiúsculas/minúsculas e acentos (josé = jose, programação = programacao)
- Locale PT-BR, suporta ObjectId do MongoDB

**POST /posts** 🔐 (teacher/admin) - Criar post

```json
Body: {"title": "Título", "content": "Conteúdo mínimo 10 chars"}
Validations: title (3+ chars), content (10+ chars)
Author: definido automaticamente como usuário logado
```

**PUT /posts/:id** 🔐 (author/admin) - Atualizar post

```json
Body: {"title": "Novo", "content": "Novo"} (campos opcionais)
Teachers: apenas próprios posts | Admins: qualquer post
```

**DELETE /posts/:id** 🔐 (author/admin) - Deletar post

```
Teachers: apenas próprios posts | Admins: qualquer post
```

## 📊 Status Codes & Erros

| Code | Descrição    | Exemplo                                                     |
| ---- | ------------ | ----------------------------------------------------------- |
| 200  | OK           | Sucesso                                                     |
| 201  | Created      | Recurso criado                                              |
| 400  | Bad Request  | Validação ("Campo 'title' deve ter no mínimo 3 caracteres") |
| 401  | Unauthorized | "Token não fornecido" / "Token inválido" / "Token expirado" |
| 403  | Forbidden    | "Acesso negado. Permissão insuficiente."                    |
| 404  | Not Found    | "Post não encontrado"                                       |
| 409  | Conflict     | "Este email já está em uso" / "Este CPF já está cadastrado" |
| 500  | Server Error | Erro interno                                                |

## 🔧 Variáveis de Ambiente

```env
MONGO_URL=mongodb://localhost:27017/tech-challenge-2
JWT_SECRET=seu-secret-super-seguro
PORT=3000
```

## 🚀 Início Rápido

```bash
# 1. Instalar e configurar
yarn install && cp .env.example .env

# 2. Criar primeiro admin no MongoDB
mongosh tech-challenge-2
db.users.insertOne({
  name: "Admin", email: "admin@escola.com",
  password: "$2a$10$hash-bcrypt-aqui", role: "admin",
  createdAt: new Date(), updatedAt: new Date()
})

# 3. Iniciar
yarn dev  # ou: docker-compose up -d

# 4. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","password":"admin123"}'
```

## 📝 Notas

- **Registro fechado**: Apenas admins criam usuários
- **Primeiro admin**: Criado manualmente no MongoDB
- **Roles**: teacher, admin
- **Posts públicos**: Leitura pública, escrita autenticada
- **authorId**: Definido automaticamente, populado com dados do teacher (name, email, role)
- **Busca inteligente**: Ignora maiúsculas/acentos, locale PT-BR, suporta ObjectId
- **Segurança**: Bcrypt (10 rounds), JWT (7 dias), validação email/CPF únicos
- **Timestamps**: createdAt/updatedAt automáticos

## 📋 Modelo Post

```typescript
{
  _id: ObjectId,
  title: string,      // 3+ chars
  content: string,    // 10+ chars
  authorId: ObjectId, // Ref User (populado com name, email, role)
  createdAt: Date,
  updatedAt: Date
}
```

---

**Tech Challenge 2 - FIAP** | v3.0 | 2026-01-22
