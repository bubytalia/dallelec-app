@echo off
echo ========================================
echo SETUP BACKUP DATI SUPABASE AUTOMATICO
echo ========================================

cd /d "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"

echo.
echo Creazione attivita' pianificata settimanale...

schtasks /create /tn "DallelecBackupDati" /tr "powershell.exe -ExecutionPolicy Bypass -File \"c:\Users\TestQ\Desktop\gestionale\Dallelec_app\backup-dati-supabase.ps1\"" /sc weekly /d SUN /st 02:00 /ru "%USERNAME%" /f

echo.
echo Attivita' creata! Il backup dati si eseguira':
echo - Ogni DOMENICA alle 02:00
echo - Doppia copia: locale + OneDrive
echo - Mantiene 4 settimane di storico
echo.
echo Per testare manualmente:
echo powershell -ExecutionPolicy Bypass -File backup-dati-supabase.ps1
echo.
pause