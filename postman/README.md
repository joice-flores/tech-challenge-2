# 📮 Postman Collection - Tech Challenge 2

Collection completa da API com autenticação JWT, gestão de usuários e CRUD de Posts.

## ⚠️ Sistema de Roles

- **teacher** (padrão) - Cria e gerencia próprios posts
- **admin** - Acesso total (usuários e posts)

Todos os usuários são criados como `teacher` por padrão. O primeiro admin deve ser criado manualmente no MongoDB (ver Passo 3).

## 📥 Importar no Postman

1. **Collection**: Import > `Tech-Challenge-2.postman_collection.json`
2. **Environment**: Import > `Local.postman_environment.json` > Selecione "Local"

**Variáveis** (salvas automaticamente pelos scripts):
- `base_url`: http://localhost:3000
- `jwt_token`: Token JWT
- `user_id`: ID do usuário
- `post_id`: ID do post

## 📁 Estrutura (32 endpoints)

**Authentication** (11): Register, Login, Me (GET/PUT), testes de erro
**Admin** (11): CRUD de usuários, promoção de roles, fluxo completo 🔐
**Posts** (6): GET (público), POST/PUT/DELETE (teacher/admin) 🔐
**Testes de Autoria** (4): Validação de permissões de edição/deleção 🔐

## 🚀 Início Rápido

**1. Inicie a API:** `yarn start` ou `docker-compose up -d`

**2. Registre e faça login:**
- Use **Authentication > Registrar Usuário** (token salvo automaticamente)
- Teste **Authentication > Meus Dados (Me)** para confirmar

**3. Crie o primeiro admin** (obrigatório):
```bash
# Registre via Postman, depois no MongoDB:
mongosh tech-challenge-2
db.users.updateOne({ email: "admin@escola.com" }, { $set: { role: "admin" } })
exit
# Faça login novamente para obter token admin
```

**4. Promova usuários** (apenas admin):
- Use **Admin > Fluxo Completo: Criar Teacher** (4 passos automáticos)
- Ou **Admin > Promover Usuário para Teacher** (manual)

**5. Crie posts** (teacher/admin):
- **Posts > Criar Post** (ID salvo automaticamente em `{{post_id}}`)

## 🤖 Scripts Automáticos

A collection salva automaticamente:
- **jwt_token** e **user_id** após register/login
- **post_id** após criar post

Não é necessário copiar/colar IDs manualmente!

## 🧪 Testes Recomendados

**Autenticação:** Register → Me → Login → Me
**Erros:** Email duplicado (409), senha incorreta (401), token inválido (401)
**CRUD Posts:** Criar → Buscar → Atualizar → Deletar
**Autoria:** Teacher edita próprio post (200✅), teacher edita post de outro (403❌), admin edita qualquer post (200✅)

## 💡 Dicas

- **Ver variáveis:** Clique no olho 👁️ (canto superior direito)
- **Forçar novo login:** Delete `jwt_token` manualmente e faça login
- **Debug:** View > Show Postman Console
- **Testes customizados:** Use a aba Tests dos requests

## 📊 Principais Endpoints

| Endpoint | Auth | Descrição |
|----------|------|-----------|
| `POST /auth/register` | ❌ | Registrar |
| `POST /auth/login` | ❌ | Login |
| `GET /auth/me` | JWT | Dados do usuário |
| `PUT /auth/me` | JWT | Atualizar dados |
| `GET /admin/users` | Admin | Listar usuários |
| `PUT /admin/users/:id/role` | Admin | Alterar role |
| `GET /posts` | ❌ | Listar posts |
| `POST /posts` | Teacher/Admin | Criar post |
| `PUT /posts/:id` | Autor/Admin | Atualizar post |
| `DELETE /posts/:id` | Autor/Admin | Deletar post |

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| "Could not get response" | API não está rodando → `yarn start` ou `docker-compose up -d` |
| "jwt_token is not defined" | Faça login → verifique console/variáveis (👁️) |
| 401 - Token inválido | Token expirou (7 dias) → faça login novamente |
| 403 - Acesso negado | Role incorreta → verifique permissões (teacher/admin) |
| 409 - Email duplicado | Email existe → use outro ou faça login |
| Headers não aparecem | Environment não selecionado → selecione "Local" |
| Token não usado | Variável errada → use `{{jwt_token}}` exatamente |

## 📚 Recursos

**Documentação:** README.md, DOCKER.md, TESTES.md, DOCUMENTACAO-TECNICA.md (raiz do projeto)
**Links:** [Postman Docs](https://learning.postman.com/) | [Variáveis](https://learning.postman.com/docs/sending-requests/variables/) | [Scripts](https://learning.postman.com/docs/writing-scripts/test-scripts/)

## ❓ FAQ

- **Logout?** Delete `jwt_token` ou faça login novamente
- **Token expira?** Sim, após 7 dias
- **Testar como admin?** Crie primeiro admin no MongoDB (ver Passo 3)
- **Por que criar admin no MongoDB?** Segurança - primeiro admin deve ser manual
- **Teacher vê posts de outros?** Sim (leitura pública), mas só edita próprios

---

**Tech Challenge 2 - FIAP** | 32 endpoints | Scripts automáticos ✅
