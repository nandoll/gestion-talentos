# Dockerfile para producción - API
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copia archivos del monorepo
COPY package.json pnpm-lock.yaml .npmrc  ./
COPY tsconfig.base.json ./
COPY nx.json ./

# Instala dependencias completas para build
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copia todo el código fuente
COPY . .

# Genera cliente Prisma y construye la aplicación
RUN pnpm prisma:generate && pnpm api:build

# Stage de producción
FROM node:22-alpine

WORKDIR /usr/src/app
COPY .npmrc ./
# Copia archivos necesarios para instalar dependencias de producción
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Instala solo dependencias de producción
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copia el build y archivos necesarios
COPY --from=builder /usr/src/app/dist/apps/api .
COPY --from=builder /usr/src/app/apps/api/prisma ./prisma

# Genera cliente Prisma en producción usando comando directo
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 3000
CMD ["node", "main.js"]
