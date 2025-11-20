# ============================================
# MULTI-STAGE BUILD - Optimizado para Producción
# ============================================

# Stage 1: Build dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo dev para prisma generate)
RUN npm ci --include=dev

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# ============================================
# Stage 2: Production
FROM node:20-alpine

# Información del mantenedor
LABEL maintainer="La Causa Platform Team"
LABEL description="Backend API - Volunteer Intelligence Platform"

# Instalar curl para healthchecks
RUN apk add --no-cache curl

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar archivos necesarios desde builder
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --chown=nodejs:nodejs ./src ./src

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Variables de entorno por defecto (se sobreescriben en runtime)
ENV NODE_ENV=production \
    PORT=3000

# Comando de inicio
CMD ["node", "src/server.js"]



