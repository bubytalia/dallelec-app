@echo off
echo ========================================
echo DALLELEC - Full Deploy Script
echo Git + Push + Deploy Completo
echo ========================================

:: Controlla se è stato fornito un messaggio di commit
if "%~1"=="" (
    set /p commit_msg="Inserisci messaggio commit: "
) else (
    set commit_msg=%~1
)

echo.
echo STEP 1: Git Add + Commit
echo ========================================
git add .
git commit -m "%commit_msg%"

echo.
echo STEP 2: Push su GitHub
echo ========================================
git push origin fix-produits-devis

echo.
echo STEP 3: Build progetto
echo ========================================
npm run build

echo.
echo STEP 4: Deploy su Netlify
echo ========================================
npx netlify deploy --prod --dir dist

echo.
echo ========================================
echo DEPLOY COMPLETO TERMINATO!
echo ========================================
echo Repository: https://github.com/bubytalia/dallelec-app
echo Branch: fix-produits-devis
echo URL Live: https://dallelec.com
echo ========================================
pause