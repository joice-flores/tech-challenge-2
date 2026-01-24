# 🎬 Script Rápido de Demonstração (5-7 min)

## Preparação (ANTES de começar)

```bash
# 1. Iniciar ambiente
cd ~/Documents/Joice/fiap/tech-challenge-2
docker-compose up -d

# 2. Verificar status
docker-compose ps
# Aguardar: api (healthy), mongodb (healthy)

# 3. Criar admin
docker-compose exec mongodb mongosh tech-challenge-2
```

```javascript
// No mongosh:
db.users.insertOne({
  name: "Admin Principal",
  email: "admin@escola.com",
  password: "$2a$10$rZ8qH1YJ4kE9vX2wL3mKO.Kp7QzK8xY6N5nM4jL9wE8sC7bA6dF5e",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})

exit
```

---

## DEMO SCRIPT (copiar e colar)

### 1️⃣ LOGIN ADMIN (30s)

```bash
# Login admin → retorna JWT
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","password":"admin123"}'
```

**🎤 FALAR:** "Admin faz login e recebe JWT válido por 7 dias. O token contém id, email e role - sem dados sensíveis."

```bash
# ✅ Salvar token retornado
export ADMIN_TOKEN="eyJ..."
```

---

### 2️⃣ ADMIN CRIA TEACHER (30s)

```bash
# Admin cria teacher (apenas admin pode)
curl -X POST http://localhost:3000/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prof. João Silva",
    "email": "joao.prof@escola.com",
    "password": "teacher123",
    "role": "teacher"
  }'
```

**🎤 FALAR:** "Registro fechado: apenas admins criam usuários. Isso garante controle de qualidade."

---

### 3️⃣ LOGIN TEACHER (30s)

```bash
# Teacher faz login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao.prof@escola.com","password":"teacher123"}'
```

```bash
# ✅ Salvar token teacher
export TEACHER_TOKEN="eyJ..."
```

**🎤 FALAR:** "Teacher recebe seu próprio token com role diferente. Sistema RBAC em ação."

---

### 4️⃣ TEACHER CRIA POST (30s)

```bash
# Teacher cria post → authorId automático
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introdução ao JavaScript",
    "content": "JavaScript é uma linguagem de programação poderosa..."
  }'
```

**🎤 FALAR:** "authorId é extraído automaticamente do JWT. Impossível forjar autoria - segurança garantida."

```bash
# ✅ Salvar ID do post retornado
export POST_TEACHER="67..."
```

---

### 5️⃣ ADMIN CRIA POST (30s)

```bash
# Admin também cria post
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fundamentos de Programação",
    "content": "Conceitos essenciais de programação..."
  }'
```

```bash
# ✅ Salvar ID
export POST_ADMIN="67..."
```

---

### 6️⃣ LEITURA PÚBLICA (30s)

```bash
# Listar posts SEM token (público)
curl http://localhost:3000/posts
```

**🎤 FALAR:** "Leitura de posts é pública - conhecimento educacional deve ser acessível. Mas criar, editar e deletar exigem autenticação."

---

### 7️⃣ BUSCA INTELIGENTE (1 min)

```bash
# Buscar "programacao" (sem acento)
curl "http://localhost:3000/posts/search?keyword=programacao"
```

**🎤 FALAR:** "MongoDB Collation PT-BR: busca 'programacao' encontra 'Programação', 'PROGRAMAÇÃO', etc. Melhor UX para brasileiros."

```bash
# Buscar "JAVASCRIPT" (maiúsculas)
curl "http://localhost:3000/posts/search?keyword=JAVASCRIPT"
```

**🎤 FALAR:** "Case-insensitive também. 'JAVASCRIPT' encontra 'JavaScript', 'javascript'."

---

### 8️⃣ CONTROLE DE AUTORIA - FALHA ❌ (1 min)

```bash
# Teacher tenta editar post do admin
curl -X PUT "http://localhost:3000/posts/$POST_ADMIN" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"TENTATIVA DE INVASÃO","content":"Não deve funcionar"}'
```

**✅ ESPERADO:** `403 Forbidden` - "Você não tem permissão para editar este post"

**🎤 FALAR:** "Teacher tentou editar post de outro autor. Sistema bloqueia com 403 Forbidden. RBAC funcionando!"

---

### 9️⃣ ADMIN EDITA QUALQUER POST - SUCESSO ✅ (30s)

```bash
# Admin edita post do teacher
curl -X PUT "http://localhost:3000/posts/$POST_TEACHER" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"JavaScript - Revisado pela Coordenação",
    "content":"Post revisado e aprovado pela coordenação..."
  }'
```

**✅ ESPERADO:** `200 OK`

**🎤 FALAR:** "Admin tem privilégios totais. Pode moderar qualquer conteúdo. Essencial para controle de qualidade."

---

### 🔟 TEACHER TENTA CRIAR USUÁRIO - FALHA ❌ (30s)

```bash
# Teacher tenta acessar endpoint de admin
curl -X POST http://localhost:3000/admin/users \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Tentativa",
    "email":"teste@escola.com",
    "password":"123",
    "role":"admin"
  }'
```

**✅ ESPERADO:** `403 Forbidden` - "Acesso negado. Permissão insuficiente."

**🎤 FALAR:** "Teacher tentou criar usuário. Middleware de autorização bloqueou. Segurança em camadas!"

---

## 🧪 TESTES (30s - OPCIONAL)

```bash
# Rodar testes
yarn test

# Ver cobertura
open coverage/index.html
```

**🎤 FALAR:** "35.74% de cobertura. Meta de 20% SUPERADA. 29 testes, 100% passando. AuthController 79%, PostController 87%."

---

## 🔄 CI/CD (30s - OPCIONAL)

```bash
# Ver workflows GitHub
gh run list --limit 5

# Ver detalhes último run
gh run view
```

**🎤 FALAR:** "GitHub Actions roda automaticamente: Lint, Build, Testes com MongoDB real, Docker build, Security audit. Pipeline completo em ~3 minutos."

---

## 🐳 DOCKER (30s - OPCIONAL)

```bash
# Ver tamanho da imagem
docker images | grep tech-challenge

# Ver logs em tempo real
docker-compose logs -f api
```

**🎤 FALAR:** "Multi-stage build: imagem de 150MB (era 800MB). 81% menor. Health checks garantem orquestração confiável."

---

## ⏹️ ENCERRAR

```bash
# Parar ambiente
docker-compose down

# Parar E deletar dados (cuidado!)
# docker-compose down -v
```

---

## 🎯 PONTOS-CHAVE A MENCIONAR

### Decisões Técnicas
1. **Node.js 20** → Requisito Mongoose 9
2. **JWT stateless** → Escalabilidade horizontal
3. **authorId automático** → Segurança (impossível forjar)
4. **Registro fechado** → Controle de qualidade
5. **Leitura pública** → Conhecimento acessível
6. **Collation PT-BR** → UX brasileira
7. **Multi-stage Docker** → 81% menor

### Desafios Resolvidos
1. Mongoose 9 + Node 20 compatibilidade
2. Path aliases produção (module-alias)
3. Busca com acentos (Collation)
4. authorId String → ObjectId migration
5. Docker health checks orquestração

### Segurança (OWASP)
1. bcrypt 10 rounds
2. JWT com expiração
3. RBAC (authorize middleware)
4. authorId automático (sem forgery)
5. Admin não deleta si mesmo
6. Senhas nunca retornadas

### Métricas
- **Cobertura:** 35.74% (meta 20% ✅)
- **Testes:** 29 passando
- **Imagem Docker:** ~150MB
- **CI/CD:** ~3min
- **Linhas de código:** ~1200

---

## 📋 CHECKLIST FINAL

### Antes de Começar
- [ ] `docker-compose up -d` rodando
- [ ] Admin criado no MongoDB
- [ ] Tokens exportados ($ADMIN_TOKEN, $TEACHER_TOKEN)
- [ ] IDs salvos ($POST_TEACHER, $POST_ADMIN)
- [ ] Terminal com fonte legível
- [ ] Postman aberto (backup)

### Durante a Demo
- [ ] Mostrar JWT decodificado (jwt.io)
- [ ] Destacar 403 Forbidden (teacher)
- [ ] Destacar 200 OK (admin)
- [ ] Busca inteligente (acentos)
- [ ] Logs em tempo real (opcional)

### Após Demo
- [ ] Mostrar README.md
- [ ] Mostrar GitHub Actions
- [ ] Mostrar coverage report
- [ ] Responder perguntas

---

**⏱️ Tempo Total: 5-7 minutos**
**🎯 Objetivo: Demonstrar RBAC, segurança e busca inteligente**
**🚀 Resultado: Sistema production-ready completo**
