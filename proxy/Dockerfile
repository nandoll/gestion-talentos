FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copia archivos del monorepo
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY nx.json ./

# Instala dependencias para build
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copia todo el código fuente
COPY . .

# Construye el cliente Angular
RUN pnpm client:build

FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY proxy/nginx.conf /etc/nginx/conf.d
COPY --from=builder /usr/src/app/dist/apps/client/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
