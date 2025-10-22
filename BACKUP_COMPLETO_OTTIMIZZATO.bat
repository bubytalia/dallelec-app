@echo off
echo ========================================
echo   BACKUP COMPLETO DALLELEC OTTIMIZZATO
echo ========================================
echo.

:: Vai alla cartella del progetto
cd /d "C:\Users\bubyt\Desktop\gestionalequater\Dallelec_app_new"

echo 🔧 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js non trovato! Installare Node.js prima di continuare.
    pause
    exit /b 1
)

echo ✅ Node.js disponibile
echo.

echo 🚀 Avviando backup completo ottimizzato...
echo.

node utils\backup-completo-semplice.cjs

echo.
echo 🎯 Backup completato!
echo 📁 Controlla: D:\backup\
echo.
pause