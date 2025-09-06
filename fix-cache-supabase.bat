@echo off
echo 🚨 PROBLEMA CACHE SUPABASE RILEVATO!
echo Il sistema usa il vecchio URL: ssjzkdunniggfcsodvtx.supabase.co
echo Deve usare il nuovo URL: aumhdoiwtichjlvbrnrl.supabase.co
echo.

echo ⏹️ 1. Fermando tutti i processi Node...
taskkill /f /im node.exe 2>nul

echo 🧹 2. Pulizia cache completa...
if exist dist rmdir /s /q dist
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .vite rmdir /s /q .vite

echo 🔧 3. Verifica file .env...
type .env | findstr VITE_SUPABASE_URL

echo 📦 4. Rebuild completo...
npm run build

echo 🚀 5. Riavvio server dev...
start cmd /k "npm run dev"

echo.
echo ✅ FATTO! Ora:
echo 1. Chiudi COMPLETAMENTE il browser
echo 2. Riapri il browser
echo 3. Vai su localhost:5173
echo 4. Premi Ctrl+Shift+Del per pulire cache browser
echo 5. Ricarica con Ctrl+Shift+R
echo.
pause