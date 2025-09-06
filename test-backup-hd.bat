@echo off
echo ========================================
echo TEST BACKUP HD ESTERNO - DALLELEC
echo ========================================

cd /d "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"

echo.
echo Esecuzione backup manuale...
powershell -ExecutionPolicy Bypass -File backup-hd-esterno.ps1

echo.
echo Test completato! Controlla il log: backup-log.txt
echo.
pause