@echo off
chcp 65001 >nul
title Image Gallery Desktop

echo ============================================
echo   Image Gallery - Desktop Launcher
echo ============================================
echo.
echo   [1] Electron (development)
echo   [2] Browser only (dev server)
echo   [3] Tauri 2.0 (development)
echo   [4] Exit
echo.
set /p choice="Choose an option (1-4): "

if "%choice%"=="1" goto electron
if "%choice%"=="2" goto browser
if "%choice%"=="3" goto tauri
if "%choice%"=="4" goto end

:electron
echo.
echo Starting Electron desktop app...
cd /d "%~dp0"
pnpm --filter @gallery/desktop start
goto end

:browser
echo.
echo Starting dev server at http://localhost:5173 ...
cd /d "%~dp0"
pnpm --filter @gallery/desktop dev
goto end

:tauri
echo.
echo Starting Tauri 2.0 desktop app...
cd /d "%~dp0"
pnpm --filter @gallery/desktop tauri:dev
goto end

:end
pause
