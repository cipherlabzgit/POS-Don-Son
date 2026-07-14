@echo off
echo ====================================
echo Dark Mode Automatic Fix
echo ====================================
echo.
echo This will update all pages to support dark mode.
echo.
pause

cd /d "%~dp0"

echo.
echo Running PowerShell script...
echo.

powershell -ExecutionPolicy Bypass -File ".\scripts\Fix-DarkMode.ps1"

echo.
echo ====================================
echo Done!
echo ====================================
echo.
echo Your app should now support dark mode.
echo Refresh your browser to see the changes.
echo.
pause
