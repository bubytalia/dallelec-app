@echo off
title Backup Immediato OneDrive - Dallelec
color 0A

echo.
echo ========================================
echo   BACKUP IMMEDIATO ONEDRIVE - DALLELEC
echo ========================================
echo.
echo Questo script esegue il backup completo
echo e salva DIRETTAMENTE su OneDrive.
echo.
echo Premi un tasto per continuare...
pause >nul

cd /d "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"

echo.
echo Esecuzione backup...
powershell.exe -ExecutionPolicy Bypass -File "backup-dati-supabase.ps1"

echo.
echo ✓ Backup salvato su OneDrive!
echo 📂 Percorso: OneDrive\Backup_Dallelec_Dati\
echo.
pause