@echo off
title Don and Sons DMS Startup
cd /d "%~dp0"

REM Prefer Docker stack when Docker Desktop is running; otherwise use local PostgreSQL.
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running — starting with local PostgreSQL instead.
    echo.
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local-and-pos.ps1"
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-docker-and-pos.ps1"
)

if errorlevel 1 (
    echo.
    echo Startup failed. Press any key to close...
    pause >nul
)
