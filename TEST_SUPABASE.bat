@echo off
title Test Connessione Supabase - Dallelec
color 0E

echo.
echo ========================================
echo    TEST CONNESSIONE SUPABASE - DALLELEC
echo ========================================
echo.
echo Questo script testa la connessione a
echo Supabase e mostra i dati reali.
echo.

cd /d "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"

powershell.exe -ExecutionPolicy Bypass -File "test-supabase-connection.ps1"

pause