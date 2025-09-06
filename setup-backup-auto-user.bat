@echo off
echo ========================================
echo SETUP BACKUP AUTOMATICO HD ESTERNO
echo (Versione utente - senza admin)
echo ========================================

cd /d "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"

echo.
echo Creazione attivita' pianificata per rilevamento HD...

REM Crea attività che si avvia al login dell'utente
schtasks /create /tn "DallelecBackupHD" /tr "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File \"c:\Users\TestQ\Desktop\gestionale\Dallelec_app\backup-hd-esterno.ps1\"" /sc onlogon /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Attivita' creata con successo!
    echo.
    echo Il backup si attivera' automaticamente quando:
    echo - Fai login su Windows
    echo - L'HD Samsung T5 è collegato
    echo.
    echo Per testare manualmente:
    echo powershell -ExecutionPolicy Bypass -File backup-hd-esterno.ps1
    echo.
) else (
    echo.
    echo ❌ Errore nella creazione dell'attivita'
    echo Prova a eseguire come amministratore
    echo.
)

pause