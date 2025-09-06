@echo off
title BACKUP DATI SUPABASE REALI
color 0A

echo BACKUP DATI SUPABASE REALI
echo ===========================

set TIMESTAMP=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo Timestamp: %TIMESTAMP%
echo.

cd /d "C:\Users\TestQ\Desktop\gestionale\Dallelec_app"

echo Avvio backup dati reali da Supabase...
node backup-dati-reali.js

echo.
echo BACKUP COMPLETATO!
echo Controlla: c:\Users\TestQ\OneDrive\BACKUP_SUPABASE_%TIMESTAMP%
echo.
pause