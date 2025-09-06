@echo off
title Backup Completo Supabase - Dallelec
color 0A

echo.
echo ========================================
echo    BACKUP COMPLETO SUPABASE - DALLELEC
echo ========================================
echo.
echo Questo script esegue il backup completo
echo di tutte le tabelle Supabase e salva
echo i dati su OneDrive.
echo.
echo Premi un tasto per continuare...
pause >nul

cd /d "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"

powershell.exe -ExecutionPolicy Bypass -File "backup-supabase-completo.ps1" -OpenFolder

echo.
echo Backup completato!
echo I file sono stati salvati su OneDrive.
echo.
pause