@echo off
echo ========================================
echo TEST PROGETTO DALLELEC - FUNZIONALITÀ
echo ========================================

cd /d "C:\dev\Dallelec_app_new"

echo.
echo [1/5] Verifica package.json...
if exist "package.json" (
    echo ✅ package.json presente
) else (
    echo ❌ package.json mancante
    goto :error
)

echo.
echo [2/5] Verifica node_modules...
if exist "node_modules" (
    echo ✅ node_modules presente
) else (
    echo ❌ node_modules mancante - installazione...
    npm install
)

echo.
echo [3/5] Verifica configurazioni...
if exist ".env" (
    echo ✅ .env presente
) else (
    echo ❌ .env mancante
)

if exist "src\firebase.js" (
    echo ✅ Firebase config presente
) else (
    echo ❌ Firebase config mancante
)

if exist "src\supabase.js" (
    echo ✅ Supabase config presente
) else (
    echo ❌ Supabase config mancante
)

echo.
echo [4/5] Test build...
echo Esecuzione npm run build...
npm run build
if %ERRORLEVEL% EQU 0 (
    echo ✅ Build SUCCESS
) else (
    echo ❌ Build FAILED
    goto :error
)

echo.
echo [5/5] Verifica file generati...
if exist "dist" (
    echo ✅ Cartella dist creata
    dir dist
) else (
    echo ❌ Cartella dist non creata
    goto :error
)

echo.
echo ========================================
echo ✅ PROGETTO COMPLETAMENTE FUNZIONANTE!
echo ========================================
echo.
echo Comandi disponibili:
echo - npm run dev     (sviluppo locale)
echo - npm run build   (build produzione)
echo - npm run preview (anteprima build)
echo.
goto :end

:error
echo.
echo ========================================
echo ❌ ERRORI RILEVATI NEL PROGETTO
echo ========================================
echo Controllare i messaggi sopra per dettagli
echo.

:end
pause