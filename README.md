# 🎓 Tech Challenge 2 - Plataforma Educacional

API RESTful com Node.js, TypeScript, Express e MongoDB para posts educacionais com autenticação JWT e controle de acesso baseado em roles.

## 🎯 Sobre

Sistema de API para conteúdo educacional com dois tipos de usuários:

- **Teachers** - criam/editam/deletam próprios posts
- **Admins** - acesso total (usuários e todos posts)

**Características:**
✅ Registro fechado (apenas admins criam usuários) | ✅ JWT (7 dias) | ✅ Roles: teacher/admin | ✅ Posts: autor automático via authorId | ✅ Busca inteligente (ignora acentos/maiúsculas) | ✅ Leitura pública | ✅ Controle de autoria

## ✨ Funcionalidades

**Autenticação:** Login email/senha, JWT, bcrypt, edição perfil, atualização senha

**Roles:** teacher (gerencia próprios posts), admin (acesso total)

**Posts:** CRUD completo | Leitura pública | Criação (teacher/admin) | Edição/Deleção (autor/admin) | authorId automático | Dados autor populados | Busca por ID/autor/título/conteúdo | Busca inteligente (ignora acentos/maiúsculas)

**Admin:** Criação usuários (teachers/admins) | Listar/buscar/deletar usuários (exceto si mesmo)

**Middlewares:** JWT, autorização roles, validação, erros global

## 🚀 Tecnologias

**Backend:** Node.js 20+ (req. Mongoose 9.x) | TypeScript 5.9 | Express 5 | MongoDB 7 | Mongoose 9

**Auth/Security:** jsonwebtoken | bcryptjs | dotenv

**Dev:** ts-node | nodemon | module-alias (~paths) | Jest | Supertest

## 📦 Instalação

**Pré-requisitos:** Node.js 20+ | MongoDB 5+ | Yarn/npm

```bash
# 1. Clone e instale
git clone <url>
cd tech-challenge-2
yarn install

# 2. Configure .env
cp .env.example .env
# Edite: MONGO_URL, JWT_SECRET, PORT

# 3. Inicie MongoDB
mongod  # ou: brew services start mongodb-community

# 4. Crie primeiro admin no MongoDB
mongosh tech-challenge-2
db.users.insertOne({
  name: "Admin", email: "admin@escola.com",
  password: "$2a$10$hash-bcrypt-aqui", role: "admin",
  createdAt: new Date(), updatedAt: new Date()
})
exit

# 5. Inicie servidor
yarn dev  # http://localhost:3000
```

## ⚙️ Variáveis de Ambiente

| Variável   | Descrição   | Padrão                                     |
| ---------- | ----------- | ------------------------------------------ |
| MONGO_URL  | URL MongoDB | mongodb://localhost:27017/tech-challenge-2 |
| JWT_SECRET | Secret JWT  | Obrigatório                                |
| PORT       | Porta       | 3000                                       |

## 🐳 Docker

**Arquitetura:** Multi-stage build | Imagem ~150MB | Non-root user | Health checks | Volumes persistentes

```bash
# Iniciar
docker-compose up -d                 # Produção
docker-compose -f docker-compose.dev.yml up -d  # Dev (hot reload)

# Monitorar
docker-compose logs -f api           # Logs
docker-compose ps                    # Status

# Criar admin
docker-compose exec mongodb mongosh tech-challenge-2
db.users.insertOne({name:"Admin",email:"admin@escola.com",password:"$2a$10$hash",role:"admin",createdAt:new Date(),updatedAt:new Date()})

# Backup/Restore
docker run --rm -v tech-challenge-2_mongodb_data:/data \
  -v $(pwd)/backup:/backup alpine \
  tar czf /backup/backup-$(date +%Y%m%d).tar.gz /data

# Parar
docker-compose down                  # Parar containers
docker-compose down -v               # Parar + remover volumes (APAGA DADOS!)
```

**Troubleshooting:**

- API não conecta MongoDB: `docker-compose logs mongodb`
- Porta ocupada: `lsof -i :3000` ou mude porta no docker-compose.yml
- Rebuild completo: `docker-compose down && docker-compose build --no-cache && docker-compose up -d`

## 🔄 CI/CD

**GitHub Actions (ci.yml):** Lint (TypeScript check) | Build | Testes (MongoDB) | Docker build | Security audit (npm audit)

**Triggers:** Push/PR em `main` e `develop`

```bash
# Ver status
gh workflow view ci.yml
gh run list --limit 10

# Trigger manual
gh workflow run ci.yml
```

## 🎮 Uso

### Login como Admin

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","password":"admin123"}'
```

### Criar Teacher

```bash
curl -X POST http://localhost:3000/admin/users \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Prof João","email":"prof@escola.com","password":"senha123","role":"teacher"}'
```

### Criar Post (como teacher/admin)

```bash
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"JavaScript","content":"Introdução ao JavaScript..."}'
```

### Listar Posts (público)

```bash
curl http://localhost:3000/posts
```

### Buscar Posts (ignora acentos)

```bash
curl "http://localhost:3000/posts/search?keyword=programacao"
# Encontra: "Programação", "programacao", "PROGRAMAÇÃO"
```

## 📖 Documentação da API

**Base:** `http://localhost:3000`
**Auth:** `Authorization: Bearer {jwt-token}` (válido 7 dias)

### Endpoints Principais

| Método    | Endpoint                  | Auth          | Descrição                     |
| --------- | ------------------------- | ------------- | ----------------------------- |
| POST      | /auth/login               | ❌            | Login (retorna token)         |
| GET       | /auth/me                  | JWT           | Dados usuário autenticado     |
| PUT       | /auth/me                  | JWT           | Atualizar perfil              |
| **Admin** |                           |               |                               |
| POST      | /admin/users              | Admin         | Criar usuário (teacher/admin) |
| GET       | /admin/users              | Admin         | Listar usuários               |
| GET       | /admin/users/:id          | Admin         | Buscar usuário                |
| PUT       | /admin/users/:id/role     | Admin         | Atualizar role                |
| DELETE    | /admin/users/:id          | Admin         | Deletar usuário               |
| **Posts** |                           |               |                               |
| GET       | /posts                    | ❌            | Listar todos (público)        |
| GET       | /posts/:id                | ❌            | Buscar por ID (público)       |
| GET       | /posts/author/:authorId   | ❌            | Posts por autor (público)     |
| GET       | /posts/search?keyword=... | ❌            | Busca inteligente (público)   |
| POST      | /posts                    | Teacher/Admin | Criar post                    |
| PUT       | /posts/:id                | Autor/Admin   | Atualizar post                |
| DELETE    | /posts/:id                | Autor/Admin   | Deletar post                  |

**Exemplos completos:** [postman/API-Documentation.md](./postman/API-Documentation.md)
**Collection Postman:** [postman/](./postman/)

## 🏗️ Arquitetura

**Layered Architecture:**

```
Client → Express (routes) → Middlewares (auth, validation) → Controllers → Models (Mongoose) → MongoDB
```

**Decisões técnicas:**

- **Registro fechado (admin-only):** Segurança e controle de qualidade
- **authorId automático (JWT):** Segurança, não pode forjar autoria
- **Busca com Collation PT-BR:** Ignora acentos (josé=jose), UX melhor
- **Leitura pública de posts:** Acessibilidade de conteúdo educacional
- **JWT stateless (7 dias):** Escalabilidade, mobile-friendly
- **Multi-stage Docker:** Imagem 80% menor (~150MB)

## 📁 Estrutura

```
src/
├── configs/database.ts          # MongoDB
├── controllers/                 # Lógica (Auth, Admin, Post)
├── middlewares/                 # auth, errorHandler, validate
├── models/                      # User, Post (Mongoose schemas)
├── routes/                      # authRoutes, adminRoutes, postRoutes
├── app.ts                       # Express config
└── server.ts                    # Entry point
```

## 👥 Sistema de Roles

### Permissões

| Funcionalidade                | Teacher    | Admin      |
| ----------------------------- | ---------- | ---------- |
| Ver posts                     | ✅ Público | ✅ Público |
| Criar posts                   | ✅         | ✅         |
| Editar próprios posts         | ✅         | ✅         |
| Editar posts de outros        | ❌         | ✅         |
| Deletar próprios posts        | ✅         | ✅         |
| Deletar posts de outros       | ❌         | ✅         |
| Ver/editar próprio perfil     | ✅         | ✅         |
| Criar/listar/deletar usuários | ❌         | ✅         |

**Alterar role:**

```bash
mongosh tech-challenge-2
db.users.updateOne(
  {email: "prof@escola.com"},
  {$set: {role: "admin"}}
)
```

## 🔒 Segurança

✅ Senhas: bcrypt (10 rounds), nunca em texto plano, nunca retornadas
✅ JWT: secret configurável, 7 dias validade, verificação em rotas protegidas
✅ Validação: email/CPF únicos, formato validado, inputs sanitizados
✅ Controle acesso: roles, isolamento recursos, admins não deletam si mesmos, teachers só editam próprios posts
✅ Registro fechado: apenas admins criam usuários

**Produção:** Use HTTPS | JWT secret forte | Variáveis ambiente seguras | Rate limiting | CORS configurado | Logs centralizados

## 🧪 Testing

**Cobertura:** 35.74% (Meta: 20% ✅) | 29 testes | 100% passando

```bash
yarn test              # Executar testes
yarn test:coverage     # Com cobertura
yarn test:watch        # Modo watch
open coverage/index.html  # Ver relatório HTML
```

**Detalhes:** [TESTES.md](./TESTES.md)

## 📊 Status Codes

| Code | Descrição    | Exemplo                |
| ---- | ------------ | ---------------------- |
| 200  | OK           | Sucesso                |
| 201  | Created      | Recurso criado         |
| 400  | Bad Request  | Validação falhou       |
| 401  | Unauthorized | Token inválido/ausente |
| 403  | Forbidden    | Sem permissão          |
| 404  | Not Found    | Recurso não encontrado |
| 409  | Conflict     | Email/CPF duplicado    |
| 500  | Server Error | Erro interno           |

## 📚 Documentação Adicional

- [postman/README.md](./postman/README.md) - Guia da Postman Collection
- [postman/API-Documentation.md](./postman/API-Documentation.md) - Documentação completa API

## 📝 Licença

Este projeto é parte do Tech Challenge 2 - FIAP.

## 👨‍💻 Autor

Desenvolvido para Tech Challenge 2 - FIAP

---

**Tech Challenge 2 - FIAP** | 2026-01-22
