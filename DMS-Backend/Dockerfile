# syntax=docker/dockerfile:1
#
# DMS-Backend — Enterprise-grade multi-stage Dockerfile
# ASP.NET Core 10 Web API on Debian slim; app process runs as non-root `dms`.
# Entrypoint starts as root only to chown /app/logs (Compose named volumes are root-owned).
#

ARG DOTNET_VERSION=10.0
ARG APP_PORT=8080
ARG APP_UID=1001

# ---------------------------------------------------------------------------
# Stage 1: restore — cache NuGet packages (only invalidated when csproj changes)
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION}-noble AS restore
WORKDIR /src

ENV DOTNET_NOLOGO=true \
    DOTNET_CLI_TELEMETRY_OPTOUT=true \
    NUGET_XMLDOC_MODE=skip

COPY ["DMS-Backend.csproj", "./"]

RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet restore "DMS-Backend.csproj" \
        --runtime linux-x64 \
        --verbosity minimal

# ---------------------------------------------------------------------------
# Stage 2: build & publish — produce framework-dependent, trimmed output
# ---------------------------------------------------------------------------
FROM restore AS build
WORKDIR /src

COPY . .

RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet publish "DMS-Backend.csproj" \
        --configuration Release \
        --runtime linux-x64 \
        --no-restore \
        --no-self-contained \
        --output /app/publish \
        /p:UseAppHost=false \
        /p:PublishReadyToRun=false \
        /p:GenerateDocumentationFile=false

# ---------------------------------------------------------------------------
# Stage 3: runtime — minimal ASP.NET image, non-root, with healthcheck
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION}-noble AS runtime

ARG APP_PORT
ARG APP_UID

LABEL org.opencontainers.image.title="DMS Backend" \
      org.opencontainers.image.description="Don & Sons DMS-ERP Backend (ASP.NET Core 10)" \
      org.opencontainers.image.vendor="Cipher Labz" \
      org.opencontainers.image.source="https://github.com/cipher-labz/donandsons-dms"

ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:${APP_PORT} \
    ASPNETCORE_HTTP_PORTS=${APP_PORT} \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_USE_POLLING_FILE_WATCHER=false \
    DOTNET_NOLOGO=true \
    DOTNET_CLI_TELEMETRY_OPTOUT=true \
    DOTNET_GCHeapHardLimitPercent=75 \
    DOTNET_TieredPGO=1 \
    TZ=UTC

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates tzdata gosu \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid ${APP_UID} dms \
 && useradd  --system --uid ${APP_UID} --gid dms \
              --create-home --home-dir /home/dms \
              --shell /usr/sbin/nologin dms \
 && mkdir -p /app/logs \
 && chown -R dms:dms /app /home/dms

COPY --from=build --chown=dms:dms /app/publish ./
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh \
 && chmod 0755 /app/docker-entrypoint.sh && chown root:root /app/docker-entrypoint.sh

VOLUME ["/app/logs"]
EXPOSE ${APP_PORT}

# Root only for entrypoint chown on mounted log volume; app runs as dms via gosu.
USER root

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -fsS "http://localhost:${APP_PORT}/health" >/dev/null || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
