@echo off
echo 🔄 Pulizia cache e riavvio server...

echo ⏹️ Fermando eventuali server in esecuzione...
taskkill /f /im node.exe 2>nul

echo 🧹 Pulizia cache npm...
npm run build

echo 🚀 Riavvio server dev...
start cmd /k "npm run dev"

echo ✅ Fatto! Ora ricarica il browser con Ctrl+Shift+R
pause