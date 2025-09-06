@echo off
echo ========================================
echo DALLELEC - Setup Netlify Environment
echo ========================================

echo Configurando variabili ambiente su Netlify...

:: Supabase
netlify env:set VITE_SUPABASE_URL "https://ssjzkdunniggfcsodvtx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0"

:: Firebase
netlify env:set VITE_FIREBASE_API_KEY "AIzaSyDQvJ8K9X2nF5mH3pL7qR4sT6uV8wY0zA1"
netlify env:set VITE_FIREBASE_AUTH_DOMAIN "dallelec-gestion-58a49.firebaseapp.com"
netlify env:set VITE_FIREBASE_PROJECT_ID "dallelec-gestion-58a49"
netlify env:set VITE_FIREBASE_STORAGE_BUCKET "dallelec-gestion-58a49.appspot.com"
netlify env:set VITE_FIREBASE_MESSAGING_SENDER_ID "987654321098"
netlify env:set VITE_FIREBASE_APP_ID "1:987654321098:web:abc123def456ghi789"
netlify env:set VITE_FIREBASE_MEASUREMENT_ID "G-ABCD123456"

echo.
echo ========================================
echo Variabili ambiente configurate!
echo Ora fai un nuovo deploy per applicarle
echo ========================================
pause