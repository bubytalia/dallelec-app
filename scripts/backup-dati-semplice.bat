@echo off
REM ========================================
REM BACKUP DATI SEMPLICE - ESECUZIONE RAPIDA
REM ========================================

echo 💾 Backup dati Dallelec in corso...

cd /d "C:\Projects\Dallelec_app"

REM Esegui backup Node.js
node scripts/backup-dati-completo.js

if %ERRORLEVEL% EQU 0 (
    echo ✅ Backup dati completato con successo!
    echo 📁 Controlla la cartella backup-dati-[timestamp]
) else (
    echo ❌ Errore durante il backup dati
)

pause