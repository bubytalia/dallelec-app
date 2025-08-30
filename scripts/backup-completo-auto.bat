@echo off
REM ========================================
REM BACKUP AUTOMATICO COMPLETO
REM Rileva e salva TUTTE le tabelle automaticamente
REM ========================================

echo 🔍 Backup automatico completo Dallelec...
echo ⚡ Rilevamento automatico di tutte le tabelle del database

cd /d "C:\Projects\Dallelec_app"

REM Esegui backup automatico
node scripts/backup-dati-automatico.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ BACKUP AUTOMATICO COMPLETATO!
    echo 🎯 TUTTE le tabelle del database sono state salvate
    echo 📁 Controlla la cartella backup-dati-[timestamp]
    echo 📄 Leggi BACKUP_INFO.txt per i dettagli completi
    echo.
    echo 💡 VANTAGGI:
    echo    - Rileva automaticamente nuove tabelle
    echo    - Non serve aggiornare script
    echo    - Backup sempre completo al 100%%
) else (
    echo.
    echo ❌ Errore durante il backup automatico
)

echo.
pause