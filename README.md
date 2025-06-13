# Gestion de Talentos

Sistema completo de gestión de candidatos construido con tecnologías modernas y arquitectura escalable. Permite crear, editar, eliminar y buscar candidatos, además de importar datos masivos desde archivos Excel.

## Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Desarrollo Local](#-desarrollo-local)
- [Producción](#-producción)
- [API Documentation](#-api-documentation)
- [Scripts Disponibles](#-scripts-disponibles)
- [Solución de Problemas](#-solución-de-problemas)

## Características

- **CRUD Completo de Candidatos**: Crear, leer, actualizar y eliminar candidatos
- **Búsqueda y Filtros**: Por nombre, seniority y disponibilidad
- **Paginación**: Manejo eficiente de grandes volúmenes de datos
- **Importación Excel**: Carga masiva de candidatos desde archivos .xlsx
- **Validación de Datos**: Validación exhaustiva en frontend y backend
- **Diseño Responsivo**: Interfaz adaptable a diferentes dispositivos
- **Documentación API**: Swagger/OpenAPI integrado
- **Hot Reload**: En desarrollo para frontend y backend
- **Containerización**: Docker para todos los ambientes

## Arquitectura

### Monorepo con NX

El proyecto utiliza NX como herramienta de build para gestionar el monorepo, permitiendo:

- Builds incrementales
- Dependencias compartidas
- Comandos unificados
- Mejor organización del código

### Componentes Principales

```
Cliente Angular -> NestJS API <-> PostgreSQL
```

## Tecnologías

### Frontend

- **Angular 20**: Framework SPA
- **Angular Material**: Componentes UI
- **RxJS**: Programación reactiva
- **TypeScript**: Tipado estático

### Backend

- **NestJS 11**: Framework Node.js
- **Prisma ORM**: Gestión de base de datos
- **PostgreSQL 15**: Base de datos relacional
- **Swagger**: Documentación API
- **Class Validator**: Validación de DTOs

### DevOps

- **Docker**: Containerización
- **Docker Compose**: Orquestación local
- **NX**: Build system y monorepo
- **pnpm**: Gestor de paquetes

## Requisitos Previos

### Para Desarrollo Local

- Node.js 22+
- pnpm 10+
- Docker y Docker Compose
- Git

### Para Producción

- Docker y Docker Compose
- Dominio configurado (opcional)
- Certificado SSL (recomendado)

## Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/nandoll/gestion-talentos.git
cd gestion-talentos
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env.db`:

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=talentdb
```

Crear archivo `.env.dev`:

```env
NODE_ENV=development
DATABASE_URL=postgresql://admin:mysecretpassword@db:5432/talentdb?schema=public
PORT=3000
FRONTEND_URL=http://localhost:4200
```

## Desarrollo Local

### Opción 1: Con Docker Compose (Recomendado)

```bash
# Iniciar todos los servicios
docker compose -f docker-compose.dev.yml up -d

# Ver logs
docker compose -f docker-compose.dev.yml logs -f

# Detener servicios
docker compose -f docker-compose.dev.yml down
```

**URLs de Desarrollo:**

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs
- PostgreSQL: localhost:5432

### Opción 2: Sin Docker

```bash
# Terminal 1: Base de datos (requiere PostgreSQL instalado)
# Configurar PostgreSQL localmente

# Terminal 2: Backend
pnpm api:serve:dev

# Terminal 3: Frontend
pnpm client:serve
```

### Características del Entorno de Desarrollo

- **Hot Reload** automático en frontend y backend
- **Volúmenes Docker** para persistencia de datos
- **Logs en tiempo real** para debugging
- **Proxy configurado** para comunicación frontend-backend
- **Source maps** habilitados

## Producción

### Despliegue con Docker Compose

```bash
# Construir y ejecutar
docker compose up -d --build

# Verificar estado
docker compose ps

# Ver logs
docker compose logs -f
```

**URLs de Producción:**

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000/api

### Despliegue en la Nube

#### Frontend (Vercel)

1. Instalar Vercel CLI: `npm i -g vercel`
2. Configurar `vercel.json` con tu API URL
3. Configurar variables de entorno:

   - `API_URL`

4. Ejecutar: `vercel --prod`

#### Backend (Digital Ocean App Platform)

1. Crear App en Digital Ocean
2. Configurar variables de entorno:
   - `DATABASE_URL`
   - `FRONTEND_URL`
   - `NODE_ENV=production`
3. Conectar repositorio GitHub
4. Deploy automático en push

### Configuración de Producción

El archivo `vercel.json` maneja el proxy del frontend:
En el panel de vercel configurar la `API_URL` con la ruta al endpoint del API

```json
{
  "buildCommand": "npm run client:build",
  "outputDirectory": "dist/apps/client/browser",
  "framework": "angular",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/proxy"
    }
  ]
}
```

## API Documentation

La documentación completa de la API está disponible en Swagger:

- **Desarrollo**: http://localhost:3000/api/docs

### Endpoints Principales

```
GET    /api/candidates          # Listar candidatos (paginado)
GET    /api/candidates/:id      # Obtener candidato por ID
POST   /api/candidates          # Crear candidato
PATCH  /api/candidates/:id      # Actualizar candidato
DELETE /api/candidates/:id      # Eliminar candidato
POST   /api/candidates/upload   # Importar desde Excel
```

## Scripts Disponibles

### Desarrollo

```bash
pnpm api:serve       # Iniciar backend
pnpm client:serve    # Iniciar frontend
pnpm serve           # Iniciar ambos
```

### Build

```bash
pnpm api:build       # Build backend
pnpm client:build    # Build frontend
pnpm build           # Build todo
```

### Base de Datos

```bash
pnpm prisma:generate # Generar cliente Prisma
pnpm db:migrate      # Crear migración
pnpm db:deploy       # Aplicar migraciones
pnpm db:reset        # Reset DB (¡cuidado!)
pnpm db:studio       # GUI para la DB
```

### Calidad

```bash
pnpm lint            # Ejecutar linters
pnpm test            # Ejecutar tests
```

## Solución de Problemas

### Error: Cannot find module '@prisma/client'

```bash
pnpm prisma:generate
```

### Error: Database connection failed

- Verificar que PostgreSQL esté ejecutándose
- Verificar DATABASE_URL en las variables de entorno
- Verificar conectividad de red en Docker
