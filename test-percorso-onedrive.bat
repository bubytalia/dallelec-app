@echo off
echo 🔍 TEST PERCORSO ONEDRIVE
echo.

echo Controllo percorsi possibili OneDrive:
echo.

if exist "c:\Users\TestQ\OneDrive" (
    echo ✅ c:\Users\TestQ\OneDrive - ESISTE
    dir "c:\Users\TestQ\OneDrive" /AD
) else (
    echo ❌ c:\Users\TestQ\OneDrive - NON ESISTE
)

echo.

if exist "%USERPROFILE%\OneDrive" (
    echo ✅ %USERPROFILE%\OneDrive - ESISTE
    echo Percorso completo: %USERPROFILE%\OneDrive
    dir "%USERPROFILE%\OneDrive" /AD
) else (
    echo ❌ %USERPROFILE%\OneDrive - NON ESISTE
)

echo.

if exist "c:\Users\TestQ\OneDrive\Backup_Dallelec_Dati" (
    echo ✅ Cartella backup ESISTE
    dir "c:\Users\TestQ\OneDrive\Backup_Dallelec_Dati"
) else (
    echo ❌ Cartella backup NON ESISTE
    echo Creo la cartella...
    mkdir "c:\Users\TestQ\OneDrive\Backup_Dallelec_Dati"
)

echo.
pause