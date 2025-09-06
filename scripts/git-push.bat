@echo off
echo ========================================
echo DALLELEC - Git Push Script
echo ========================================

echo Verificando branch corrente...
git branch --show-current

echo.
echo Pushando su origin fix-produits-devis...
git push origin fix-produits-devis

echo.
echo ========================================
echo Push completato su GitHub!
echo Repository: https://github.com/bubytalia/dallelec-app
echo Branch: fix-produits-devis
echo ========================================
pause