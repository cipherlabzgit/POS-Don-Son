# syntax=docker/dockerfile:1
#
# Don & Sons DMS-POS — browser POS (Vite + React), served by nginx.
# Build from repo root or DMS-POS with:
#   docker build --build-arg VITE_API_URL=http://123.231.10.22:5126 -t dms-pos:latest .
#
# IMPORTANT: VITE_API_URL is baked into the JS at build time.
# It must be the public API URL browsers can reach (not localhost on client PCs).

ARG NODE_VERSION=22-alpine
ARG NGINX_VERSION=stable-alpine
ARG APP_PORT=5174
ARG VITE_API_URL=http://123.231.10.22:5126

# ---------------------------------------------------------------------------
# 1) Install dependencies
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------------------------------------------------------------------------
# 2) Build static web app (no Electron)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
ARG VITE_API_URL
ENV NODE_ENV=production \
    VITE_API_URL=${VITE_API_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN echo "Building POS with VITE_API_URL=${VITE_API_URL}" \
 && npm run vite:build \
 && test -f dist/index.html

# ---------------------------------------------------------------------------
# 3) Serve with nginx
# ---------------------------------------------------------------------------
FROM nginx:${NGINX_VERSION} AS runner
ARG APP_PORT=5174
ENV TZ=UTC
RUN apk add --no-cache curl tzdata \
 && rm -f /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

RUN printf 'server {\n\
    listen %s;\n\
    listen [::]:%s;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location ~* \\.(?:js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
        access_log off;\n\
    }\n\
    gzip on;\n\
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;\n\
}\n' "${APP_PORT}" "${APP_PORT}" > /etc/nginx/conf.d/pos.conf

EXPOSE ${APP_PORT}
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -fsS "http://127.0.0.1:${APP_PORT}/" >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
