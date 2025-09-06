@echo off
title Backup Samsung T5 - Dallelec
echo.
echo ========================================
echo    BACKUP SAMSUNG T5 - DALLELEC
echo ========================================
echo.
echo Controllo Samsung T5...

powershell.exe -ExecutionPolicy Bypass -File "c:\Users\TestQ\Desktop\gestionale\Dallelec_app\backup-su-collegamento-hd.ps1"

echo.
echo Backup completato!
echo Controlla D:\backup_sistema\ per vedere i backup
echo.
pause