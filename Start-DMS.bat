@echo off
title Don and Sons DMS Startup
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-docker-and-pos.ps1"
if errorlevel 1 (
    echo.
    echo Startup failed. Press any key to close...
    pause >nul
)
