# 📊 Material de Apoio - Apresentação Tech Challenge 2

## 🎯 Informações Gerais

**Projeto:** Sistema de Posts Educacionais com JWT e RBAC
**Tecnologias:** Node.js 20, TypeScript 5.9, Express 5, MongoDB 7, Mongoose 9
**Duração:** 15-20 minutos
**Cobertura de Testes:** 35.74% (Meta: 20% ✅)

---

## 📋 Checklist Pré-Apresentação

### ✅ Ambiente

- [ ] Docker instalado e rodando
- [ ] Postman instalado com Collection importada
- [ ] Terminal preparado para demonstração
- [ ] API rodando: `docker-compose up -d`
- [ ] Verificar health: `docker-compose ps`

### ✅ Dados de Teste

- [ ] Admin criado no MongoDB
- [ ] Teacher criado via endpoint admin
- [ ] Posts criados por diferentes autores
- [ ] Tokens JWT válidos salvos

### ✅ Material

- [ ] Slides prontos (10-12 slides)
- [ ] README.md aberto
- [ ] Arquitetura visualizada
- [ ] CI/CD workflow aberto no GitHub

---

## 🏗️ Arquitetura do Sistema

### Camadas (Layered Architecture)

```
┌─────────────────────────────────────────────────┐
│              Cliente (Postman/curl)              │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│              Express Router                      │
│  /auth  |  /admin  |  /posts                    │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│              Middlewares                         │
│  verifyToken → authorize → validate              │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│              Controllers                         │
│  AuthController | AdminController | PostController│
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│              Models (Mongoose)                   │
│  User Schema | Post Schema                      │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│              MongoDB Database                    │
│  Collections: users, posts                      │
└─────────────────────────────────────────────────┘
```

### Fluxo de Autenticação

```
1. Cliente envia: POST /auth/login { email, password }
2. AuthController valida credenciais
3. Gera JWT com payload: { id, email, role }
4. Retorna token válido por 7 dias
5. Cliente usa: Authorization: Bearer {token}
6. verifyToken middleware decodifica e valida
7. Adiciona req.user = { id, email, role }
8. authorize middleware verifica role necessária
9. Controller processa requisição
```

---

## 🎬 Roteiro de Demonstração Detalhado

### **FASE 1: Preparação (30 segundos)**

```bash
# Terminal 1: Iniciar ambiente
cd ~/Documents/Joice/fiap/tech-challenge-2
docker-compose up -d

# Verificar status
docker-compose ps
# Deve mostrar: api (healthy), mongodb (healthy)

# Ver logs em tempo real
docker-compose logs -f api
```

**Pontos a mencionar:**

- Multi-stage Docker build reduz imagem de ~800MB para ~150MB
- Health checks garantem inicialização ordenada (MongoDB → API)
- Volumes persistentes para dados do MongoDB

---

### **FASE 2: Criar Admin Inicial (1 min)**

```bash
# Terminal 2: Acessar MongoDB
docker-compose exec mongodb mongosh tech-challenge-2

# Criar hash bcrypt da senha "admin123"
# Hash pré-calculado: $2a$10$rZ8qH1YJ4kE9vX2wL3mKO.Kp7QzK8xY6N5nM4jL9wE8sC7bA6dF5e

# Inserir admin
db.users.insertOne({
  name: "Admin Principal",
  email: "admin@escola.com",
  password: "$2a$10$rZ8qH1YJ4kE9vX2wL3mKO.Kp7QzK8xY6N5nM4jL9wE8sC7bA6dF5e",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})

# Verificar criação
db.users.find({}, {password: 0}).pretty()

exit
```

**Pontos a mencionar:**

- Senhas SEMPRE com bcrypt (10 rounds)
- Registro fechado: apenas admins criam usuários
- Campo `password` nunca retornado nas APIs

---

### **FASE 3: Demonstração de Autenticação (3 min)**

#### 3.1 Login Admin

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escola.com",
    "password": "admin123"
  }'
```

**Response esperado:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "67...",
    "name": "Admin Principal",
    "email": "admin@escola.com",
    "role": "admin"
  }
}
```

**Mostrar no Postman:**

1. Abrir JWT.io e colar o token
2. Mostrar payload decodificado:

```json
{
  "id": "67...",
  "email": "admin@escola.com",
  "role": "admin",
  "iat": 1737567890,
  "exp": 1738172690
}
```

**Pontos a mencionar:**

- JWT stateless (não precisa consultar banco a cada request)
- Payload contém apenas dados essenciais (id, email, role)
- Expiração de 7 dias (exp - iat)
- Sem informações sensíveis no token

#### 3.2 Verificar Perfil Autenticado

```bash
# Salvar token em variável
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response esperado:**

```json
{
  "success": true,
  "data": {
    "_id": "67...",
    "name": "Admin Principal",
    "email": "admin@escola.com",
    "role": "admin",
    "createdAt": "2026-01-22T...",
    "updatedAt": "2026-01-22T..."
  }
}
```

---

### **FASE 4: Sistema de Roles (RBAC) (4 min)**

#### 4.1 Admin Cria Teacher

```bash
curl -X POST http://localhost:3000/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prof. João Silva",
    "email": "joao.prof@escola.com",
    "password": "teacher123",
    "cpf": "12345678901",
    "role": "teacher"
  }'
```

**Response esperado:**

```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "id": "67...",
    "name": "Prof. João Silva",
    "email": "joao.prof@escola.com",
    "role": "teacher",
    "cpf": "12345678901",
    "createdAt": "2026-01-22T..."
  }
}
```

**Pontos a mencionar:**

- Apenas admin pode criar usuários
- CPF opcional mas validado se fornecido
- Password hasheado antes de salvar (Mongoose pre-save hook)

#### 4.2 Login Teacher

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.prof@escola.com",
    "password": "teacher123"
  }'
```

```bash
# Salvar token teacher
TEACHER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 4.3 Teacher Tenta Criar Usuário ❌

```bash
curl -X POST http://localhost:3000/admin/users \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tentativa Inválida",
    "email": "teste@escola.com",
    "password": "123456",
    "role": "admin"
  }'
```

**Response esperado:**

```json
{
  "success": false,
  "message": "Acesso negado. Permissão insuficiente."
}
```

**Status Code:** `403 Forbidden`

**Pontos a mencionar:**

- Middleware `authorize('admin')` bloqueia acesso
- Hierarquia de roles: admin > teacher
- Segurança em múltiplas camadas (auth + authorization)

---

### **FASE 5: CRUD de Posts (5 min)**

#### 5.1 Teacher Cria Post

```bash
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introdução ao JavaScript",
    "content": "JavaScript é uma linguagem de programação interpretada..."
  }'
```

**Response esperado:**

```json
{
  "success": true,
  "message": "Post criado com sucesso",
  "data": {
    "_id": "67...",
    "title": "Introdução ao JavaScript",
    "content": "JavaScript é uma linguagem...",
    "authorId": {
      "_id": "67...",
      "name": "Prof. João Silva",
      "email": "joao.prof@escola.com"
    },
    "createdAt": "2026-01-22T...",
    "updatedAt": "2026-01-22T..."
  }
}
```

**Pontos a mencionar:**

- `authorId` extraído automaticamente do JWT
- Impossível forjar autoria (segurança)
- Mongoose populate retorna dados completos do autor
- Timestamps automáticos (createdAt, updatedAt)

#### 5.2 Criar Mais Posts (Admin)

```bash
# Admin cria post sobre TypeScript
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "TypeScript Avançado",
    "content": "Aprenda sobre generics, decorators e type inference..."
  }'

# Admin cria post sobre Programação
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fundamentos de Programação",
    "content": "Conceitos essenciais: variáveis, funções, estruturas..."
  }'
```

#### 5.3 Listar Posts (Público - SEM Token)

```bash
curl -X GET http://localhost:3000/posts
```

**Response esperado:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "67...",
      "title": "Introdução ao JavaScript",
      "authorId": {
        "name": "Prof. João Silva",
        "email": "joao.prof@escola.com"
      },
      "createdAt": "2026-01-22T..."
    },
    {
      "_id": "67...",
      "title": "TypeScript Avançado",
      "authorId": {
        "name": "Admin Principal",
        "email": "admin@escola.com"
      },
      "createdAt": "2026-01-22T..."
    }
  ],
  "count": 2
}
```

**Pontos a mencionar:**

- Leitura de posts é PÚBLICA (acessibilidade do conteúdo educacional)
- Escrita/edição/deleção requerem autenticação
- Trade-off: conhecimento aberto vs controle de qualidade

---

### **FASE 6: Busca Inteligente (2 min)**

#### 6.1 Busca com Acentos

```bash
# Buscar "programacao" (sem acento)
curl -X GET "http://localhost:3000/posts/search?keyword=programacao"
```

**Encontra:**

- "Fundamentos de **Programação**" ✅
- "**PROGRAMAÇÃO** Orientada a Objetos" ✅
- "**programação** funcional" ✅

```bash
# Buscar "JAVASCRIPT" (maiúsculas)
curl -X GET "http://localhost:3000/posts/search?keyword=JAVASCRIPT"
```

**Encontra:**

- "Introdução ao **JavaScript**" ✅
- "**javascript** moderno" ✅

**Pontos a mencionar:**

- MongoDB Collation locale: `pt` (português)
- Strength: 1 (ignora acentos e case)
- UX melhor para usuários brasileiros
- Implementação: PostController.ts:200-230

**Código relevante:**

```typescript
const posts = await Post.find({
  $or: [
    { title: { $regex: keyword, $options: "i" } },
    { content: { $regex: keyword, $options: "i" } },
  ],
})
  .collation({ locale: "pt", strength: 1 }) // ← Magia aqui!
  .populate("authorId", "name email");
```

---

### **FASE 7: Controle de Autoria (3 min)**

#### 7.1 Teacher Edita Próprio Post ✅

```bash
# Pegar ID do post do teacher
POST_ID_TEACHER="67..."

curl -X PUT "http://localhost:3000/posts/$POST_ID_TEACHER" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introdução ao JavaScript - ATUALIZADO",
    "content": "Conteúdo atualizado com novos exemplos..."
  }'
```

**Response:** `200 OK` ✅

#### 7.2 Teacher Tenta Editar Post de Outro ❌

```bash
# Pegar ID do post do admin
POST_ID_ADMIN="67..."

curl -X PUT "http://localhost:3000/posts/$POST_ID_ADMIN" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "TENTATIVA DE INVASÃO",
    "content": "Não deveria funcionar..."
  }'
```

**Response esperado:**

```json
{
  "success": false,
  "message": "Você não tem permissão para editar este post"
}
```

**Status Code:** `403 Forbidden` ❌

**Código relevante (PostController.ts:161-165):**

```typescript
// Teacher só pode editar próprios posts
if (req.user.role === "teacher" && post.authorId.toString() !== req.user.id) {
  throw new AppError("Você não tem permissão para editar este post", 403);
}
```

#### 7.3 Admin Edita Qualquer Post ✅

```bash
curl -X PUT "http://localhost:3000/posts/$POST_ID_TEACHER" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "JavaScript - Revisado pela Coordenação",
    "content": "Post revisado e aprovado..."
  }'
```

**Response:** `200 OK` ✅

**Pontos a mencionar:**

- Admin tem privilégios totais (moderação)
- Teacher tem autonomia limitada (próprios posts)
- Validação de autoria no controller
- Segurança em múltiplas camadas

---

## 🧪 Testes Automatizados

### Executar Testes

```bash
# Localmente
yarn test

# Com cobertura detalhada
yarn test:coverage

# Abrir relatório HTML
open coverage/index.html
```

### Resultados Atuais

```
Test Suites: 2 passed, 2 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        4.088s

---------------------|---------|----------|---------|---------|
File                 | % Stmts | % Branch | % Funcs | % Lines |
---------------------|---------|----------|---------|---------|
All files            |   35.74 |    25.94 |   38.29 |   36.19 |
 AuthController.ts   |   79.36 |    57.57 |     100 |   80.32 |
 PostController.ts   |   87.75 |     87.5 |   91.66 |   88.54 |
 User.ts             |    92.3 |      100 |     100 |    92.3 |
 Post.ts             |     100 |      100 |     100 |     100 |
---------------------|---------|----------|---------|---------|
```

### Testes Implementados

**AuthController (11 testes):**

- ✅ Login com credenciais inválidas → 401
- ✅ Login bem-sucedido → 200 + token
- ✅ Obter perfil autenticado → 200
- ✅ Atualizar perfil → 200
- ✅ Email duplicado → 409 Conflict

**PostController (18 testes):**

- ✅ Criar post sem autenticação → 401
- ✅ Criar post com dados inválidos → 400
- ✅ Criar post válido → 201
- ✅ Listar posts (público) → 200
- ✅ Buscar por autor → 200
- ✅ Busca inteligente (acentos) → 200
- ✅ Editar post de outro usuário → 403
- ✅ Admin edita qualquer post → 200
- ✅ Deletar post de outro → 403

**Pontos a mencionar:**

- Meta de 20% de cobertura SUPERADA (35.74%)
- 100% dos testes passando
- MongoDB Memory Server (isolamento)
- CI/CD roda testes automaticamente

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**Arquivo:** `.github/workflows/ci.yml`

**Triggers:**

- Push em `main` ou `develop`
- Pull Requests para `main` ou `develop`

**Jobs (1 job unificado):**

```yaml
ci:
  runs-on: ubuntu-latest
  services:
    mongodb:
      image: mongo:7.0
      # Health check automático

  steps: 1. Checkout código
    2. Setup Node.js 20
    3. Install dependencies (yarn)
    4. Lint (TypeScript check)
    5. Build (tsc)
    6. Test (Jest + MongoDB)
    7. Upload coverage (artifact)
    8. Docker build
    9. Security audit (npm audit)
```

### Demonstração

```bash
# Ver últimos workflows
gh run list --limit 5

# Ver detalhes do último run
gh run view

# Trigger manual
gh workflow run ci.yml
```

**Mostrar no GitHub:**

1. Abrir Actions tab
2. Mostrar workflow rodando/completo
3. Destacar logs de cada step
4. Mostrar artifact de cobertura

**Pontos a mencionar:**

- Pipeline completo em 1 job (otimização)
- MongoDB como service container
- Artifacts de cobertura (7 dias retenção)
- Security audit contínuo

---

## 🐳 Docker Production-Ready

### Multi-Stage Build

**Dockerfile:**

```dockerfile
# Stage 1: Builder (descarta após build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Stage 2: Production (imagem final)
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN yarn install --production --frozen-lockfile
USER nodejs
EXPOSE 3000
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
```

**Benefícios:**

- Imagem final: ~150MB (vs ~800MB single-stage)
- Sem devDependencies em produção
- Non-root user (segurança)
- Cache de layers otimizado

### Health Checks

**API Health Check:**

```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:3000/posts"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**MongoDB Health Check:**

```yaml
healthcheck:
  test: echo 'db.runCommand("ping").ok' | mongosh --quiet
  interval: 10s
  timeout: 5s
  retries: 5
```

**Pontos a mencionar:**

- Orquestração com `depends_on` + `condition: service_healthy`
- API só inicia após MongoDB estar healthy
- Restart automático em caso de falha

---

## 📊 Métricas e KPIs

### Técnicas

| Métrica                   | Valor  | Status |
| ------------------------- | ------ | ------ |
| Cobertura de testes       | 35.74% | ✅     |
| Testes passando           | 29/29  | ✅     |
| Linhas de código (src)    | ~1200  | -      |
| Tamanho imagem Docker     | ~150MB | ✅     |
| Tempo build CI/CD         | ~3min  | ✅     |
| Node.js version           | 20.x   | ✅     |
| Vulnerabilidades críticas | 0      | ✅     |

### Funcionalidades

| Feature                 | Status | Destaque                    |
| ----------------------- | ------ | --------------------------- |
| Autenticação JWT        | ✅     | 7 dias validade             |
| Sistema de Roles (RBAC) | ✅     | admin, teacher              |
| Registro fechado        | ✅     | Admin-only                  |
| CRUD completo Posts     | ✅     | Com populate de autor       |
| Busca inteligente       | ✅     | Collation PT-BR             |
| Leitura pública         | ✅     | Sem autenticação            |
| Controle de autoria     | ✅     | Teacher edita só seus posts |
| Docker multi-stage      | ✅     | 80% menor                   |
| CI/CD GitHub Actions    | ✅     | Lint, Test, Build, Docker   |
| Health checks           | ✅     | API + MongoDB               |
| Testes automatizados    | ✅     | Jest + Supertest            |
| Segurança (bcrypt)      | ✅     | 10 rounds                   |

---

## 💡 Decisões Técnicas Fundamentadas

### 1. Node.js 20+ (Obrigatório)

**Decisão:** Mongoose 9.x requer Node.js >= 16.20.1
**Escolha:** Node.js 20 LTS (mais recente estável)

**Trade-offs:**

- ✅ Performance superior (V8 engine otimizado)
- ✅ Features modernas (fetch nativo, test runner)
- ✅ Suporte de longo prazo (LTS até 2026)
- ⚠️ Requer atualização em ambientes antigos

**Justificativa:** Compatibilidade com Mongoose 9 + melhor performance + features modernas

---

### 2. TypeScript em vez de JavaScript

**Trade-offs:**

- ✅ Type safety (erros em tempo de compilação)
- ✅ IntelliSense e autocomplete
- ✅ Refatoração segura
- ✅ Documentação implícita via tipos
- ⚠️ Build step adicional
- ⚠️ Curva de aprendizado

**Justificativa:** Manutenibilidade e qualidade de código superam o overhead de build

---

### 3. MongoDB + Collation PT-BR

**Decisão:** Busca inteligente ignorando acentos

**Alternativas consideradas:**

1. **Normalização de strings:** Remover acentos antes de salvar
   - ❌ Perde informação original
   - ❌ Dificulta edição

2. **Regex puro:** `/$keyword/i`
   - ❌ Não ignora acentos
   - ❌ "programacao" não encontra "Programação"

3. **MongoDB Collation:** `{ locale: 'pt', strength: 1 }`
   - ✅ Mantém dados originais
   - ✅ Busca inteligente automática
   - ✅ Suporte nativo do MongoDB

**Justificativa:** Collation oferece melhor UX sem perda de dados

---

### 4. JWT Stateless vs Session-Based

**Trade-offs:**

**JWT Stateless:**

- ✅ Escalabilidade horizontal (sem shared state)
- ✅ Mobile-friendly (sem cookies)
- ✅ Microservices-ready
- ⚠️ Revogação complexa (precisa Redis)
- ⚠️ Payload size maior que session ID

**Session-Based:**

- ✅ Revogação trivial (delete session)
- ✅ Payload mínimo (só ID)
- ⚠️ Requer Redis/Memcached para escalar
- ⚠️ Dependência de cookies (CORS complexo)

**Escolha:** JWT stateless

**Justificativa:** Escalabilidade + simplicidade para MVP educacional

---

### 5. authorId Automático (JWT) vs Manual

**Decisão:** Extrair authorId do token JWT

**Alternativa rejeitada:** Cliente envia authorId no body

```json
{
  "title": "Post",
  "authorId": "outro-usuario-id" // ← RISCO!
}
```

**Problemas:**

- ❌ Usuário pode forjar autoria
- ❌ Segurança depende de validação manual
- ❌ Inconsistência entre token e dados

**Solução implementada:**

```typescript
// PostController.ts:35
const authorId = req.user.id; // ← Do JWT, não do body
```

**Justificativa:** Segurança > Flexibilidade

---

### 6. Registro Fechado (Admin-Only)

**Trade-offs:**

**Registro aberto:**

- ✅ Onboarding rápido
- ⚠️ Spam e conteúdo baixa qualidade
- ⚠️ Sem controle de quem é teacher

**Registro fechado (escolhido):**

- ✅ Controle de qualidade
- ✅ Validação de credenciais educacionais
- ✅ Evita spam
- ⚠️ Requer processo manual inicial

**Justificativa:** Plataforma educacional precisa de curadoria

---

### 7. Leitura Pública de Posts

**Decisão:** GET /posts sem autenticação

**Trade-offs:**

- ✅ Conhecimento aberto e acessível
- ✅ SEO-friendly (bots podem indexar)
- ✅ Compartilhamento fácil (sem login)
- ⚠️ Conteúdo visível para todos

**Justificativa:** Missão educacional > restrição de acesso

---

### 8. Docker Multi-Stage Build

**Single-stage (descartado):**

```dockerfile
FROM node:20
COPY . .
RUN yarn install  # ← Inclui devDependencies
RUN yarn build
CMD ["yarn", "start"]
# Resultado: ~800MB
```

**Multi-stage (escolhido):**

```dockerfile
# Stage 1: Build
FROM node:20 AS builder
RUN yarn build

# Stage 2: Production
FROM node:20-alpine
COPY --from=builder /app/dist ./dist
RUN yarn install --production  # ← Só production deps
# Resultado: ~150MB (81% menor)
```

**Benefícios:**

- ✅ 81% menor (800MB → 150MB)
- ✅ Sem devDependencies em produção
- ✅ Startup mais rápido
- ✅ Superfície de ataque reduzida

---

## 🚨 Desafios Enfrentados e Soluções

### 1. Mongoose 9 + Node.js Incompatibilidade

**Problema:**

```bash
Error: Mongoose 9.x requires Node.js >= 16.20.1
Current: Node.js 14.x
```

**Solução:**

1. Upgrade Node.js para 20 LTS
2. Atualizar Dockerfile: `FROM node:20-alpine`
3. CI/CD: `node-version: '20'`

**Aprendizado:** Verificar requisitos de dependências antes de iniciar

---

### 2. Path Aliases em Produção

**Problema:**

```typescript
import { User } from "~/models/User";
// ❌ Erro em produção: Cannot find module '~/models/User'
```

**Tentativas:**

1. **tsconfig-paths/register** (funciona em dev):

```json
"compilerOptions": {
  "paths": { "~/*": ["./src/*"] }
}
```

2. **module-alias** (funciona em produção):

```json
"_moduleAliases": {
  "~": "dist"
}
```

```typescript
// server.ts
import "module-alias/register"; // ← Antes de outros imports
```

**Solução final:** Usar ambos (tsconfig-paths em dev, module-alias em prod)

**Aprendizado:** Testar build de produção localmente antes de deploy

---

### 3. Busca com Acentos

**Problema:**

```javascript
// Usuário busca: "programacao"
// Posts no banco: "Programação", "PROGRAMAÇÃO"
// Resultado: [] (nada encontrado)
```

**Tentativa 1:** Regex case-insensitive

```typescript
{ title: { $regex: keyword, $options: 'i' } }
// ❌ Ainda não encontra acentos
```

**Solução:** MongoDB Collation

```typescript
Post.find({ ... })
  .collation({ locale: 'pt', strength: 1 })
// ✅ "programacao" encontra "Programação"
```

**Aprendizado:** MongoDB tem features avançadas de i18n built-in

---

### 4. authorId: String vs ObjectId

**Problema inicial:**

```typescript
// Post Schema v1
authorId: {
  type: String;
}
// ❌ Não pode usar populate
```

**Migração:**

```typescript
// Post Schema v2
authorId: {
  type: Schema.Types.ObjectId,
  ref: 'User'
}

// Agora funciona:
Post.findById(id).populate('authorId', 'name email')
```

**Aprendizado:** Planejar schema considerando relacionamentos futuros

---

### 5. Docker Health Checks e Ordem de Inicialização

**Problema:**

```bash
API iniciou antes do MongoDB estar pronto
→ MongoNetworkError: failed to connect to server
```

**Solução:**

```yaml
# docker-compose.yml
services:
  mongodb:
    healthcheck:
      test: echo 'db.ping()' | mongosh --quiet

  api:
    depends_on:
      mongodb:
        condition: service_healthy # ← Aguarda healthy
```

**Aprendizado:** Health checks são essenciais em orquestração de containers

---

### 6. CI/CD: MongoDB em GitHub Actions

**Problema:** Testes precisam de MongoDB real

**Tentativa 1:** Instalar MongoDB no runner

```yaml
- name: Install MongoDB
  run: sudo apt-get install mongodb
# ❌ Lento, versão antiga
```

**Solução:** Service container

```yaml
services:
  mongodb:
    image: mongo:7.0
    ports: [27017:27017]
    options: >-
      --health-cmd "mongosh --eval 'db.ping()'"
```

**Benefícios:**

- ✅ Versão exata (7.0)
- ✅ Isolamento
- ✅ Paralelização de jobs futura

---

### 7. Segurança: Admin Não Pode se Deletar

**Problema:**

```bash
# Admin deleta própria conta
DELETE /admin/users/{admin-id}
→ 200 OK
# ❌ Admin ficou sem acesso!
```

**Solução:**

```typescript
// AdminController.ts:137
if (req.user && user._id.toString() === req.user.id) {
  throw new AppError("Você não pode deletar sua própria conta", 403);
}
```

**Aprendizado:** Validar casos extremos que parecem óbvios

---

## 🎓 Conceitos Acadêmicos Aplicados

### 1. SOLID Principles

**Single Responsibility (S):**

- Cada controller tem uma responsabilidade:
  - `AuthController` → autenticação
  - `AdminController` → gestão de usuários
  - `PostController` → gestão de posts

**Open/Closed (O):**

- Middlewares são extensíveis:

```typescript
authorize("admin"); // Pode adicionar mais roles
authorize("admin", "teacher", "moderator");
```

**Dependency Inversion (D):**

- Controllers dependem de abstrações (Mongoose Models), não de implementações diretas

---

### 2. Clean Architecture (Layered)

**Camadas bem definidas:**

```
Presentation (routes)
  → Business Logic (controllers)
    → Data Access (models)
      → Database (MongoDB)
```

**Separação de concerns:**

- Middlewares: cross-cutting concerns (auth, logging, validation)
- Controllers: lógica de negócio
- Models: persistência e validação de dados

---

### 3. Design Patterns

**Factory Pattern:**

```typescript
// User.ts - Password hashing factory
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});
```

**Middleware Pattern:**

```typescript
// Express middleware chain
app.use(express.json());
app.use("/posts", verifyToken, authorize("teacher"), postRoutes);
```

**Repository Pattern (implícito via Mongoose):**

```typescript
User.findById(id); // Repository abstraction
Post.create(data);
```

---

### 4. OWASP Top 10 Mitigations

| Vulnerabilidade          | Mitigação Implementada                       |
| ------------------------ | -------------------------------------------- |
| A01: Broken Access Ctrl  | RBAC (authorize middleware)                  |
| A02: Cryptographic Fails | bcrypt (10 rounds), JWT secret               |
| A03: Injection           | Mongoose sanitization, parameterized queries |
| A04: Insecure Design     | Registro fechado, authorId automático        |
| A05: Security Misconfig  | Non-root Docker user, env vars               |
| A07: Auth Failures       | JWT expiration (7d), password strength       |
| A08: Data Integrity      | Mongoose schema validation                   |

---

## 🎤 Perguntas Frequentes e Respostas

### P: Por que MongoDB e não PostgreSQL?

**R:** Trade-offs considerados:

**MongoDB (escolhido):**

- ✅ Flexibilidade de schema (posts podem ter campos variáveis no futuro)
- ✅ Collation PT-BR nativa (busca com acentos)
- ✅ Mongoose 9 oferece validação robusta
- ✅ JSON-like (alinhado com JavaScript)
- ⚠️ Sem transações ACID completas (não crítico para posts educacionais)

**PostgreSQL:**

- ✅ ACID completo
- ✅ Relações complexas
- ⚠️ Schema rígido (migrations complexas)
- ⚠️ Collation PT-BR mais verbosa

**Justificativa:** Flexibilidade e busca inteligente > ACID para MVP educacional

---

### P: Por que JWT e não OAuth2?

**R:**

**JWT (escolhido):**

- ✅ Simplicidade (sem servidor de autorização)
- ✅ Stateless (escala horizontal)
- ✅ Suficiente para autenticação interna
- ⚠️ Revogação complexa

**OAuth2:**

- ✅ Padrão para third-party auth
- ✅ Revogação nativa
- ⚠️ Complexidade (Auth Server, Resource Server)
- ⚠️ Overkill para sistema interno

**Contexto:** Sistema fechado (não é API pública), então JWT é adequado.

**Evolução futura:** Se precisar de "Login com Google", adicionar OAuth2.

---

### P: Como revogar token JWT se necessário?

**R:** JWT stateless não permite revogação direta. Soluções:

**1. Redis Blacklist (recomendado):**

```typescript
// Logout
await redis.set(`blacklist:${token}`, "1", "EX", 604800); // 7 dias

// verifyToken middleware
const isBlacklisted = await redis.exists(`blacklist:${token}`);
if (isBlacklisted) throw new AppError("Token revogado", 401);
```

**2. Refresh Token Pattern:**

```typescript
// Access token: 15min (curto)
// Refresh token: 7 dias (armazenado no banco)
// Revogar refresh token = revoga acesso
```

**3. Timestamp de revogação no User:**

```typescript
user.tokenValidAfter = new Date(); // Invalida tokens antigos

// verifyToken
if (decoded.iat < user.tokenValidAfter) {
  throw new AppError("Token expirado", 401);
}
```

**Implementado atualmente:** Expiração de 7 dias (suficiente para MVP)

---

### P: E se precisar escalar para milhões de usuários?

**R:** Arquitetura já preparada:

**Escalabilidade Horizontal (JWT stateless):**

```
Load Balancer
   ↓
[API] [API] [API]  ← Múltiplas instâncias (stateless)
   ↓
MongoDB Replica Set
```

**Otimizações futuras:**

1. **Cache (Redis):**
   - Cache de posts populares
   - Session blacklist
   - Rate limiting

2. **CDN:**
   - Servir posts estáticos via CDN
   - Reduz carga no backend

3. **Sharding (MongoDB):**
   - Particionar por authorId ou região

4. **Microservices:**
   - Auth Service (separado)
   - Post Service
   - User Service

**Decisão atual:** Monolito simples (suficiente até ~100k usuários)

---

### P: Por que não GraphQL?

**R:** Trade-offs:

**GraphQL:**

- ✅ Cliente pede exatamente o que precisa
- ✅ Single endpoint
- ⚠️ Complexidade (schema, resolvers)
- ⚠️ Caching complexo
- ⚠️ Curva de aprendizado

**REST (escolhido):**

- ✅ Simplicidade
- ✅ Caching HTTP padrão
- ✅ Ferramentas maduras (Postman, Swagger)
- ⚠️ Over-fetching (cliente recebe campos não usados)

**Contexto:** API com poucos endpoints, clientes controlados → REST é suficiente

---

### P: Como garantir que teachers não criem conteúdo impróprio?

**R:** Múltiplas camadas de controle:

**1. Controle de Acesso (implementado):**

- Apenas admins criam teachers (registro fechado)
- Admin pode editar/deletar qualquer post

**2. Moderação (futuro):**

```typescript
// Post Schema
status: {
  type: String,
  enum: ['draft', 'pending', 'approved'],
  default: 'pending'
}

// Teacher cria → status: pending
// Admin aprova → status: approved
// Público vê apenas approved
```

**Implementado:** Admin tem controle total (pode editar/deletar)

---

### P: Por que 7 dias de validade do JWT?

**R:** Trade-off entre UX e segurança:

**Curto (15min):**

- ✅ Segurança alta (janela pequena de ataque)
- ⚠️ UX ruim (re-login frequente)

**Longo (7 dias - escolhido):**

- ✅ UX boa (re-login semanal)
- ✅ Balanceado para plataforma educacional
- ⚠️ Token roubado = 7 dias de acesso

**Muito longo (30 dias):**

- ⚠️ Risco de segurança alto

**Contexto:** Plataforma educacional (não é banking), 7 dias é razoável.

**Melhoria futura:** Refresh token (access token 15min, refresh 7 dias)

---

## 📸 Screenshots Essenciais

### 1. Arquitetura (Diagrama)

_Preparar slide com o diagrama de camadas mostrado anteriormente_

### 2. Postman Collection

_Screenshot da Collection organizada por pastas_

### 3. JWT Decodificado (jwt.io)

_Mostrar payload com id, email, role_

### 4. Cobertura de Testes (HTML Report)

_Screenshot do relatório de cobertura 35.74%_

### 5. GitHub Actions (Workflow Success)

_Captura do workflow CI passando com todas as etapas verdes_

### 6. Docker Images

```bash
docker images | grep tech-challenge
# Mostrar tamanho ~150MB
```

### 7. Logs em Tempo Real

```bash
docker-compose logs -f api
# Mostrar logs estruturados de requisições*
```

---

## ✅ Checklist Final

### Antes da Apresentação

- [ ] Docker rodando (containers healthy)
- [ ] Admin criado no MongoDB
- [ ] Teacher criado via API
- [ ] 3-5 posts criados (diferentes autores)
- [ ] Tokens válidos salvos em variáveis
- [ ] Postman Collection importada e testada
- [ ] Terminal limpo e fonte legível
- [ ] GitHub Actions com último run verde
- [ ] Slides prontos (10-12 slides)

### Durante a Demo

- [ ] Mostrar arquitetura (diagrama)
- [ ] Login admin → mostrar JWT decodificado
- [ ] Criar teacher (admin)
- [ ] Login teacher → novo token
- [ ] Teacher cria post → authorId automático
- [ ] Leitura pública (sem token)
- [ ] Busca inteligente (acentos)
- [ ] Teacher tenta editar post de outro → 403
- [ ] Admin edita qualquer post → 200
- [ ] Mostrar testes passando
- [ ] Mostrar CI/CD workflow

### Após a Apresentação

- [ ] Disponibilizar Collection Postman
- [ ] Compartilhar repositório GitHub
- [ ] README.md atualizado
- [ ] Documentação completa no repo

---

## 🎯 Mensagens-Chave (Elevator Pitch)

**30 segundos:**
"Construímos uma API RESTful completa para plataforma educacional com autenticação JWT, controle de acesso baseado em roles, busca inteligente que ignora acentos, e deploy production-ready com Docker. Tudo testado, documentado e com CI/CD automatizado."

**1 minuto:**
"O sistema resolve o problema de controle de qualidade em plataformas educacionais através de registro fechado (apenas admins criam usuários) e controle de autoria (teachers editam só seus posts, admins têm acesso total). Implementamos busca inteligente com MongoDB Collation PT-BR que ignora acentos, oferecendo melhor UX para usuários brasileiros. A arquitetura em camadas com TypeScript garante manutenibilidade, enquanto Docker multi-stage reduz a imagem em 80%. Com 35% de cobertura de testes (superando a meta de 20%) e CI/CD completo no GitHub Actions, o sistema está pronto para produção."

**2 minutos (técnico):**
"Adotamos Node.js 20 para compatibilidade com Mongoose 9, que oferece validação robusta e features modernas. A decisão de usar JWT stateless permite escalabilidade horizontal sem shared state, essencial para crescimento futuro. Implementamos segurança em múltiplas camadas: bcrypt para senhas, authorId extraído do JWT (impossível forjar autoria), e RBAC com middlewares de autorização. A busca com Collation PT-BR mantém os dados originais enquanto oferece busca inteligente, um trade-off superior a normalização de strings. Docker multi-stage elimina devDependencies da imagem final, reduzindo de 800MB para 150MB. Health checks garantem orquestração confiável de containers. O CI/CD executa lint, build, testes com MongoDB real via service container, build Docker e security audit - tudo em um job unificado para otimização. Superamos a meta de cobertura (35.74% vs 20%) com 29 testes automatizados cobrindo autenticação, autorização, CRUD e casos extremos."

---

## 📚 Referências Técnicas

### Documentação Oficial

- [Mongoose 9 Docs](https://mongoosejs.com/docs/guide.html)
- [Express 5 Migration](https://expressjs.com/en/guide/migrating-5.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [MongoDB Collation](https://docs.mongodb.com/manual/reference/collation/)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)

### Padrões e Boas Práticas

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [12 Factor App](https://12factor.net/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [REST API Design](https://restfulapi.net/)

### Ferramentas

- [Jest Testing Framework](https://jestjs.io/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Compose](https://docs.docker.com/compose/)
- [Postman](https://www.postman.com/)

---

**Desenvolvido para Tech Challenge 2 - FIAP | 2026**
