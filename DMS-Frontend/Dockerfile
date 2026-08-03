# syntax=docker/dockerfile:1
#
# DMS-Frontend — Enterprise-grade multi-stage Dockerfile
# Next.js 16 (React 19) running in standalone mode on Node 22 Alpine,
# non-root user, BuildKit cache mounts, healthcheck.
#

ARG NODE_VERSION=22-alpine
ARG APP_PORT=3000
ARG APP_UID=1001
# Build-time public env (baked into the client bundle).
# Override per environment: --build-arg NEXT_PUBLIC_API_URL=https://api.example.com
ARG NEXT_PUBLIC_API_URL=http://localhost:5126

# ---------------------------------------------------------------------------
# Stage 1: deps — install dependencies (cached layer)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./

RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm ci --no-audit --no-fund --prefer-offline

# ---------------------------------------------------------------------------
# Stage 2: builder — compile Next.js in standalone mode
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: runner — minimal production image
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ARG APP_PORT
ARG APP_UID

LABEL org.opencontainers.image.title="DMS Frontend" \
      org.opencontainers.image.description="Don & Sons DMS-ERP Frontend (Next.js 16)" \
      org.opencontainers.image.vendor="Cipher Labz" \
      org.opencontainers.image.source="https://github.com/cipherlabzgit/POS-Don-Son"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=${APP_PORT} \
    HOSTNAME=0.0.0.0 \
    TZ=UTC

RUN apk add --no-cache curl tzdata \
 && addgroup --system --gid ${APP_UID} nodejs \
 && adduser  --system --uid ${APP_UID} --ingroup nodejs nextjs

# Standalone output produces server.js, the minimal node_modules tree
# and a "BUILD_ID"-aware .next folder. Copy assets that standalone does
# NOT include (public/ and .next/static/) explicitly.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE ${APP_PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://localhost:${APP_PORT}/" >/dev/null || exit 1

CMD ["node", "server.js"]
