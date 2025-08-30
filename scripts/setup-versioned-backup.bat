@echo off
REM ========================================
REM SETUP BACKUP VERSIONED AUTOMATICO
REM ========================================

echo 🔧 Setup backup versioned automatico...
echo.

REM Rimuovi task precedente se esiste
schtasks /delete /tn "DallelecSyncGestionale" /f >nul 2>&1

REM Crea nuovo task per backup versioned
echo 📅 Creazione task Windows per backup versioned...
schtasks /create /tn "DallelecBackupVersioned" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File 'C:\Projects\Dallelec_app\scripts\auto-sync-versioned.ps1'" /sc onlogon /ru "%USERNAME%" /f

if %ERRORLEVEL% EQU 0 (
    echo ✅ Task creato: DallelecBackupVersioned
) else (
    echo ❌ Errore creazione task
)

echo.
echo 🎯 CONFIGURAZIONE BACKUP VERSIONED COMPLETATA!
echo.
echo 📋 COME FUNZIONA:
echo 1. Ogni volta che colleghi l'HD, crea un nuovo backup con timestamp
echo 2. Formato nome: Dallelec_2025-08-30_19-45
echo 3. Mantiene automaticamente gli ultimi 10 backup
echo 4. Ogni backup ha file BACKUP_INFO.txt con dettagli
echo.
echo 📁 STRUTTURA HD ESTERNO:
echo D:\gestionale\
echo   ├── Dallelec_2025-08-30_19-45\
echo   ├── Dallelec_2025-08-30_15-30\
echo   ├── Dallelec_2025-08-29_10-15\
echo   └── ...
echo.
echo 🔧 COMANDI UTILI:
echo - Backup manuale: sync-versioned-backup.bat
echo - Avvia monitoraggio: powershell -File auto-sync-versioned.ps1
echo - Rimuovi task: schtasks /delete /tn "DallelecBackupVersioned" /f
echo.
echo 🔌 Collega l'HD per testare il backup versioned!
echo.
pause