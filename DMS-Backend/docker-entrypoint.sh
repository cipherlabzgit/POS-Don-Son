#!/bin/sh
set -eu
# Compose mounts a named volume on /app/logs; new volumes are root:root 0755, so the
# non-root app user cannot create Serilog files and the process exits before /health exists.
if [ "$(id -u)" -eq 0 ]; then
  mkdir -p /app/logs
  chown -R dms:dms /app/logs
  exec gosu dms dotnet /app/DMS-Backend.dll "$@"
fi
exec dotnet /app/DMS-Backend.dll "$@"
