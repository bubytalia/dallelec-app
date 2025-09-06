@echo off
REM ========================================
REM SETUP SINCRONIZZAZIONE AUTOMATICA
REM Per cartella gestionale su HD esterno
REM ========================================

echo 🔧 Setup sincronizzazione automatica Dallelec...
echo.

REM Crea task per avvio automatico al login
echo 📅 Creazione task Windows...
schtasks /create /tn "DallelecSyncGestionale" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File 'C:\Projects\Dallelec_app\scripts\auto-sync-usb.ps1'" /sc onlogon /ru "%USERNAME%" /f

if %ERRORLEVEL% EQU 0 (
    echo ✅ Task creato: DallelecSyncGestionale
) else (
    echo ❌ Errore creazione task
)

echo.
echo 🎯 CONFIGURAZIONE COMPLETATA!
echo.
echo 📋 COME FUNZIONA:
echo 1. Il monitoraggio si avvia automaticamente al login Windows
echo 2. Quando colleghi l'HD esterno con cartella 'gestionale', parte la sincronizzazione
echo 3. Il progetto viene copiato in: [HD]:\gestionale\Dallelec_app
echo.
echo 🔧 COMANDI UTILI:
echo - Test manuale: sync-to-external.bat
echo - Avvia monitoraggio: powershell -File auto-sync-usb.ps1
echo - Rimuovi task: schtasks /delete /tn "DallelecSyncGestionale" /f
echo.
echo 🔌 Collega ora l'HD esterno per testare!
echo.
pause