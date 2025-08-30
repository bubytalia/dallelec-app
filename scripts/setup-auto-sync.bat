@echo off
REM ========================================
REM SETUP SINCRONIZZAZIONE AUTOMATICA DALLELEC
REM ========================================

echo Configurazione sincronizzazione automatica...

REM Crea task scheduler per esecuzione automatica
echo Creazione task Windows per rilevamento USB...

schtasks /create /tn "DallelecAutoBackup" /tr "C:\Projects\Dallelec_app\scripts\auto-backup-external.bat" /sc onlogon /ru "%USERNAME%" /f

if %ERRORLEVEL% EQU 0 (
    echo ✅ Task creato con successo
    echo Il backup si avvierà automaticamente ad ogni login
) else (
    echo ❌ Errore nella creazione del task
)

REM Crea anche trigger per eventi USB (richiede PowerShell)
echo Creazione script PowerShell per rilevamento USB...

echo # Script PowerShell per rilevamento USB > C:\Projects\Dallelec_app\scripts\usb-monitor.ps1
echo Register-WmiEvent -Query "SELECT * FROM Win32_VolumeChangeEvent WHERE EventType = 2" -Action { >> C:\Projects\Dallelec_app\scripts\usb-monitor.ps1
echo     Start-Process -FilePath "C:\Projects\Dallelec_app\scripts\auto-backup-external.bat" -WindowStyle Hidden >> C:\Projects\Dallelec_app\scripts\usb-monitor.ps1
echo } >> C:\Projects\Dallelec_app\scripts\usb-monitor.ps1

echo ✅ Setup completato!
echo.
echo ISTRUZIONI:
echo 1. Il backup si avvia automaticamente ad ogni login
echo 2. Per monitoraggio USB, esegui: powershell -ExecutionPolicy Bypass -File "C:\Projects\Dallelec_app\scripts\usb-monitor.ps1"
echo 3. Per backup manuale, esegui: auto-backup-external.bat
echo.
pause