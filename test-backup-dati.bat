@echo off
echo ========================================
echo TEST BACKUP DATI SUPABASE - DALLELEC
echo ========================================

cd /d "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"

echo.
echo Esecuzione backup dati manuale...
powershell -ExecutionPolicy Bypass -File backup-dati-supabase.ps1

echo.
echo Test completato! Controlla:
echo - Log: backup-dati-log.txt
echo - Locale: c:\Users\TestQ\Desktop\DallelecBackups\
echo - OneDrive: c:\Users\TestQ\OneDrive\DallelecBackups\
echo.
pause