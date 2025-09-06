@echo off
echo ========================================
echo BACKUP COMPLETO DALLELEC - FUNZIONANTE
echo ========================================

set TIMESTAMP=%date:~6,4%-%date:~3,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

set BACKUP_DIR=C:\BACKUP_DALLELEC_COMPLETO_%TIMESTAMP%
set SOURCE_DIR=C:\dev\Dallelec_app_new

echo Creazione backup completo in: %BACKUP_DIR%
mkdir "%BACKUP_DIR%"

echo.
echo [1/4] Copia file progetto...
xcopy "%SOURCE_DIR%" "%BACKUP_DIR%" /E /I /H /Y /EXCLUDE:backup-exclude.txt

echo.
echo [2/4] Verifica node_modules...
if exist "%SOURCE_DIR%\node_modules" (
    echo ✅ node_modules presente
) else (
    echo ❌ node_modules mancante - installazione...
    cd /d "%SOURCE_DIR%"
    npm install
)

echo.
echo [3/4] Copia node_modules...
xcopy "%SOURCE_DIR%\node_modules" "%BACKUP_DIR%\node_modules" /E /I /H /Y

echo.
echo [4/4] Creazione README backup...
echo BACKUP COMPLETO DALLELEC - %TIMESTAMP% > "%BACKUP_DIR%\README_BACKUP.txt"
echo. >> "%BACKUP_DIR%\README_BACKUP.txt"
echo ISTRUZIONI RIPRISTINO: >> "%BACKUP_DIR%\README_BACKUP.txt"
echo 1. Copiare cartella in C:\dev\ >> "%BACKUP_DIR%\README_BACKUP.txt"
echo 2. cd nella cartella >> "%BACKUP_DIR%\README_BACKUP.txt"
echo 3. npm run dev (per sviluppo) >> "%BACKUP_DIR%\README_BACKUP.txt"
echo 4. npm run build (per produzione) >> "%BACKUP_DIR%\README_BACKUP.txt"
echo. >> "%BACKUP_DIR%\README_BACKUP.txt"
echo CONFIGURAZIONI: >> "%BACKUP_DIR%\README_BACKUP.txt"
echo - Firebase: configurato in src/firebase.js >> "%BACKUP_DIR%\README_BACKUP.txt"
echo - Supabase: configurato in src/supabase.js >> "%BACKUP_DIR%\README_BACKUP.txt"
echo - Variabili ambiente: .env >> "%BACKUP_DIR%\README_BACKUP.txt"

echo.
echo ✅ BACKUP COMPLETO CREATO: %BACKUP_DIR%
echo.
echo Il backup include:
echo - Tutto il codice sorgente
echo - node_modules completi
echo - Configurazioni .env
echo - Documentazione
echo.
echo Il progetto è immediatamente eseguibile!
echo.
pause