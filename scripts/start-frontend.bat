@echo off
setlocal

cd /d "%~dp0..\frontend-react"

echo ProdCty frontend inditasa...

if not exist node_modules (
  echo Frontend fuggesek telepitese...
  npm.cmd install
)

npm.cmd run dev -- --host 127.0.0.1 --port 4173

