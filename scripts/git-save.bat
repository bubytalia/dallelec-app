@echo off
echo ========================================
echo DALLELEC - Git Save Script
echo ========================================

:: Controlla se è stato fornito un messaggio di commit
if "%~1"=="" (
    set /p commit_msg="Inserisci messaggio commit: "
) else (
    set commit_msg=%~1
)

echo.
echo Aggiungendo tutti i file...
git add .

echo.
echo Committando con messaggio: "%commit_msg%"
git commit -m "%commit_msg%"

echo.
echo ========================================
echo Commit completato!
echo ========================================
pause