@echo off
setlocal

cd /d "%~dp0..\backend"

echo ProdCty backend inditasa...

if not exist node_modules (
  echo Backend fuggesek telepitese...
  npm.cmd install
)

npm.cmd start

