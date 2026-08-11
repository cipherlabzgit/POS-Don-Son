@echo off
title Don and Sons DMS Startup (Local PostgreSQL)
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local-and-pos.ps1"
if errorlevel 1 (
    echo.
    echo Startup failed. Press any key to close...
    pause >nul
)
