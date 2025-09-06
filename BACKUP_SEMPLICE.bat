@echo off
title BACKUP DALLELEC SEMPLICE
color 0A

echo BACKUP DALLELEC SEMPLICE
echo ========================

set TIMESTAMP=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo Timestamp: %TIMESTAMP%

echo.
echo Creando cartelle...
mkdir "c:\Users\TestQ\Desktop\BACKUP_%TIMESTAMP%" 2>nul
mkdir "c:\Users\TestQ\OneDrive\BACKUP_%TIMESTAMP%" 2>nul

echo.
echo Copiando progetto...
xcopy "c:\Users\TestQ\Desktop\gestionale\Dallelec_app" "c:\Users\TestQ\Desktop\BACKUP_%TIMESTAMP%\progetto\" /E /I /Y /Q

echo.
echo Copiando su OneDrive...
xcopy "c:\Users\TestQ\Desktop\BACKUP_%TIMESTAMP%" "c:\Users\TestQ\OneDrive\BACKUP_%TIMESTAMP%" /E /I /Y /Q

echo.
echo COMPLETATO!
echo Desktop: c:\Users\TestQ\Desktop\BACKUP_%TIMESTAMP%
echo OneDrive: c:\Users\TestQ\OneDrive\BACKUP_%TIMESTAMP%
echo.
pause