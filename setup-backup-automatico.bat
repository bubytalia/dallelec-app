@echo off
echo ========================================
echo SETUP BACKUP AUTOMATICO HD ESTERNO
echo ========================================

cd /d "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"

echo.
echo Creazione attivita' pianificata per rilevamento HD...

schtasks /create /tn "DallelecBackupHD" /tr "powershell.exe -ExecutionPolicy Bypass -File \"c:\Users\TestQ\Desktop\gestionale\Dallelec_app\backup-hd-esterno.ps1\"" /sc onlogon /ru "%USERNAME%" /f

echo.
echo Attivita' creata! Il backup si attivera' automaticamente quando:
echo - Fai login su Windows
echo - Colleghi un HD esterno
echo.
echo Per testare manualmente:
echo powershell -ExecutionPolicy Bypass -File backup-hd-esterno.ps1
echo.
pause