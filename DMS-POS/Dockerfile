# syntax=docker/dockerfile:1
#
# DMS-POS — Enterprise-grade multi-stage Dockerfile
# Vite 8 + React 19 (web-only build), served by nginx Alpine.
#
# The Electron wrapper is a desktop distribution artefact and is NOT included
# here. This image exposes the POS web UI so cashier terminals can reach it
# via any modern browser — no Electron install required on the client machine.
#
# Build-time variable (baked into the JS bundle):
#   VITE_API_URL  — public URL of the DMS-Backend API
#                   (must be reachable by the BROWSER, not the container)
# ---------------------------------------------------------------------------

ARG NODE_VERSION=22-alpine
ARG NGINX_VERSION=1.27-alpine
ARG APP_PORT=5174
ARG APP_UID=1002
# Build-time public env — override per environment:
#   --build-arg VITE_API_URL=https://api.donandson.com
ARG VITE_API_URL=http://localhost:5126

# ---------------------------------------------------------------------------
# Stage 1: deps — install all dependencies (cached layer)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# libc6-compat is needed by some native Node addons on Alpine
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./

# BuildKit cache mount keeps ~/.npm across builds → fast rebuilds
RUN --mount=type=cache,id=pos-npm,target=/root/.npm \
    npm ci --no-audit --no-fund --prefer-offline

# ---------------------------------------------------------------------------
# Stage 2: builder — compile the Vite/React web bundle
# (electron-builder is intentionally skipped — web-only target)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

ARG VITE_API_URL
# Vite bakes VITE_* vars into the bundle at build time
ENV NODE_ENV=production \
    VITE_API_URL=${VITE_API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# vite:build = "tsc -b && vite build" (see package.json)
# This produces a static site in ./dist/ — no Electron involved.
RUN npm run vite:build

# ---------------------------------------------------------------------------
# Stage 3: runner — serve the static bundle with nginx (tiny ~8 MB image)
# ---------------------------------------------------------------------------
FROM nginx:${NGINX_VERSION} AS runner

ARG APP_PORT
ARG APP_UID

LABEL org.opencontainers.image.title="DMS POS" \
      org.opencontainers.image.description="Don & Sons DMS-POS Web UI (Vite + React 19, served by nginx)" \
      org.opencontainers.image.vendor="Cipher Labz" \
      org.opencontainers.image.source="https://github.com/cipher-labz/donandsons-dms"

ENV TZ=UTC

# Install curl (healthcheck) and tzdata
RUN apk add --no-cache curl tzdata

# ---------------------------------------------------------------------------
# nginx config — SPA-friendly: all unknown routes → index.html
# Enables gzip, sets caching headers for hashed assets.
# ---------------------------------------------------------------------------
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Write the nginx server block inline so the image is self-contained
RUN printf 'server {\n\
    listen %s;\n\
    listen [::]:%s;\n\
    server_name  _;\n\
    root         /usr/share/nginx/html;\n\
    index        index.html;\n\
\n\
    # SPA fallback\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    # Immutable hashed assets (Vite uses content-hash filenames)\n\
    location ~* \\.(?:js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
        access_log off;\n\
    }\n\
\n\
    # Compression\n\
    gzip            on;\n\
    gzip_types      text/plain text/css application/javascript application/json image/svg+xml;\n\
    gzip_min_length 1024;\n\
\n\
    # Security headers\n\
    add_header X-Frame-Options       "SAMEORIGIN";\n\
    add_header X-Content-Type-Options "nosniff";\n\
    add_header Referrer-Policy       "strict-origin-when-cross-origin";\n\
}\n' "${APP_PORT}" "${APP_PORT}" > /etc/nginx/conf.d/pos.conf

EXPOSE ${APP_PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS "http://localhost:${APP_PORT}/" >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
