@echo off
title Test Backup Supabase - Dallelec
color 0B

echo.
echo ========================================
echo      TEST BACKUP SUPABASE - DALLELEC
echo ========================================
echo.
echo Questo script testa il backup Supabase
echo con un nome personalizzato.
echo.

set /p backup_name="Inserisci nome backup (opzionale): "

if "%backup_name%"=="" (
    powershell.exe -ExecutionPolicy Bypass -File "backup-supabase-completo.ps1" -OpenFolder
) else (
    powershell.exe -ExecutionPolicy Bypass -File "backup-supabase-completo.ps1" -BackupName "%backup_name%" -OpenFolder
)

echo.
echo Test completato!
pause