@echo off
title Test Percorso OneDrive - Dallelec
color 0A

echo.
echo ========================================
echo    TEST PERCORSO ONEDRIVE - DALLELEC
echo ========================================
echo.

set ONEDRIVE_PATH=c:\Users\TestQ\OneDrive\Backup_Dallelec_Dati

echo Percorso OneDrive configurato:
echo %ONEDRIVE_PATH%
echo.

if exist "%ONEDRIVE_PATH%" (
    echo ✓ Cartella OneDrive TROVATA
    echo.
    echo Contenuto cartella:
    dir "%ONEDRIVE_PATH%" /b
) else (
    echo ❌ Cartella OneDrive NON TROVATA
    echo Creazione cartella...
    mkdir "%ONEDRIVE_PATH%"
    if exist "%ONEDRIVE_PATH%" (
        echo ✓ Cartella creata con successo
    ) else (
        echo ❌ Errore nella creazione della cartella
    )
)

echo.
echo Test file di prova...
echo Test backup > "%ONEDRIVE_PATH%\test-backup.txt"

if exist "%ONEDRIVE_PATH%\test-backup.txt" (
    echo ✓ Scrittura su OneDrive FUNZIONA
    del "%ONEDRIVE_PATH%\test-backup.txt"
) else (
    echo ❌ Scrittura su OneDrive FALLITA
)

echo.
pause