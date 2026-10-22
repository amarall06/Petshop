@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando as dependencias pela primeira vez, aguarde...
  call npm install
)
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000"
npm start
