@echo off
setlocal

set "ROOT=%~dp0"
set "FRONTEND_URL=http://127.0.0.1:4173"

if not exist "%ROOT%backend\.env" (
  if exist "%ROOT%.env.example" (
    copy "%ROOT%.env.example" "%ROOT%backend\.env" >nul
  )
)

echo ProdCty inditasa folyamatban...
echo Backend:  http://localhost:3000
echo Frontend: %FRONTEND_URL%
echo.

start "ProdCty Backend" "%ROOT%scripts\start-backend.bat"
start "ProdCty Frontend" "%ROOT%scripts\start-frontend.bat"

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\wait-and-open-frontend.ps1" -Url "%FRONTEND_URL%"

echo.
echo Ha a MongoDB nem fut, inditsd el a MongoDB szolgaltatast vagy a MongoDB Compass melle telepitett szervert.
pause
