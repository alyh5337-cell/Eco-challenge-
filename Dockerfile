# ==========================================
# Google Cloud Run Production Dockerfile
# Lean Multi-Stage Build (<100MB runner image)
# ==========================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Install all dependencies (needed for compiling frontend & server bundle)
FROM base AS build-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2. Rebuild application bundle
FROM base AS builder
WORKDIR /app
COPY --from=build-deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# 3. Lean production dependencies only (omits devDependencies)
FROM base AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 4. Ultra-lightweight Production runner for Google Cloud Run
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Cloud Run injects $PORT (default 3000)
# HOSTNAME must be 0.0.0.0 for Cloud Run health checks
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only production dependencies and build artifacts
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js

USER nextjs

EXPOSE 3000

# Start production server with dynamic $PORT binding
CMD ["node", "server.js"]
