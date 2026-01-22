# Dockerfile unificado para Tech Challenge 2 - API Educacional
# Suporta desenvolvimento (hot reload) e produção (otimizado)

# ================================
# Stage: Base
# ================================
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json yarn.lock ./

# ================================
# Stage: Development
# ================================
FROM base AS development
ENV NODE_ENV=development

# Instala todas as dependências (incluindo devDependencies)
RUN yarn install --frozen-lockfile

# Copia código fonte
COPY . .

EXPOSE 3000
CMD ["yarn", "dev"]

# ================================
# Stage: Builder
# ================================
FROM base AS builder

# Instala dependências para build
RUN yarn install --frozen-lockfile

# Copia código fonte
COPY . .

# Build da aplicação TypeScript
RUN yarn build

# ================================
# Stage: Production
# ================================
FROM node:20-alpine AS production
WORKDIR /app

# Copia arquivos de dependências
COPY package.json yarn.lock ./

# Instala apenas dependências de produção
RUN yarn install --frozen-lockfile --production

# Copia build do stage builder
COPY --from=builder /app/dist ./dist
COPY tsconfig.json ./

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000
CMD ["node", "dist/server.js"]
