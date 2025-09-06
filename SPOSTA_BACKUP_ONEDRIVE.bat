@echo off
title Sposta Backup su OneDrive - Dallelec
color 0A

echo.
echo ========================================
echo   SPOSTA BACKUP SU ONEDRIVE - DALLELEC
echo ========================================
echo.

set DOWNLOAD_PATH=%USERPROFILE%\Downloads
set ONEDRIVE_PATH=%USERPROFILE%\OneDrive\Backup_Dallelec_Dati

echo Ricerca file backup in Downloads...
echo.

if not exist "%ONEDRIVE_PATH%" (
    echo Creazione cartella OneDrive...
    mkdir "%ONEDRIVE_PATH%"
)

for %%f in ("%DOWNLOAD_PATH%\dallelec-backup-*.json") do (
    if exist "%%f" (
        echo Spostando: %%~nxf
        move "%%f" "%ONEDRIVE_PATH%\"
        if exist "%ONEDRIVE_PATH%\%%~nxf" (
            echo ✓ Spostato con successo!
        ) else (
            echo ❌ Errore nello spostamento
        )
    )
)

echo.
echo Operazione completata!
echo File salvati in: %ONEDRIVE_PATH%
echo.
pause