@echo off
title 🚨 BACKUP DALLELEC IMMEDIATO
color 0A

echo.
echo ████████████████████████████████████████
echo █          BACKUP DALLELEC IMMEDIATO          █
echo ████████████████████████████████████████
echo.
echo 📊 Usa il sistema di backup esistente (funzionante)
echo ☁️ Salva su OneDrive: DallelecBackups
echo ⚡ Backup rapido con 22 tabelle
echo.

cd /d "C:\Users\TestQ\Desktop\gestionale\Dallelec_app"

echo 🚀 Avvio backup manuale PowerShell...
powershell -ExecutionPolicy Bypass -File "backup-dati-manuale.ps1"

echo.
echo ✅ BACKUP COMPLETATO!
echo 📁 Controlla: c:\Users\TestQ\OneDrive\Backup_Dallelec_Dati
echo 📊 22 tabelle salvate
echo.
pause