@echo off
REM ========================================
REM BACKUP DATI RAPIDO - FUNZIONA SUBITO
REM ========================================

echo 💾 Backup dati Dallelec (versione rapida)...

cd /d "C:\Projects\Dallelec_app"

REM Esegui backup diretto
node scripts/backup-dati-diretto.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ BACKUP DATI COMPLETATO!
    echo 📁 Controlla la cartella backup-dati-[timestamp]
    echo 📄 Leggi BACKUP_INFO.txt per i dettagli
) else (
    echo.
    echo ❌ Errore durante il backup dati
)

echo.
pause