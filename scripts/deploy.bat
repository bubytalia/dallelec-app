@echo off
echo ========================================
echo DALLELEC - Deploy Script
echo ========================================

echo Building progetto...
npm run build

echo.
echo Deployando su Netlify...
npx netlify deploy --prod --dir dist

echo.
echo ========================================
echo Deploy completato!
echo URL: https://dallelec.com
echo Netlify Site: neon-cactus-5f0217
echo ========================================
pause