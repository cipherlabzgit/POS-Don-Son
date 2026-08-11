@echo off
title Build POS Docker from scratch
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-pos-docker-from-scratch.ps1"
if errorlevel 1 (
  echo.
  echo Build failed. Press any key to close...
  pause >nul
)
