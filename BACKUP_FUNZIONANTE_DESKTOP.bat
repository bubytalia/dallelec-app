@echo off
title 🚨 BACKUP DALLELEC FUNZIONANTE
color 0A

echo.
echo ████████████████████████████████████████
echo █       BACKUP DALLELEC FUNZIONANTE         █
echo ████████████████████████████████████████
echo.
echo 📊 Usa il backup manuale che già funziona
echo ☁️ Salva su OneDrive: Backup_Dallelec_Dati
echo ⚡ 22 tabelle complete
echo.

cd /d "C:\Users\TestQ\Desktop\gestionale\Dallelec_app"

echo 🚀 Avvio backup manuale (quello che funziona)...
powershell -ExecutionPolicy Bypass -File "backup-dati-manuale.ps1"

echo.
echo ✅ BACKUP COMPLETATO!
echo 📁 Controlla: c:\Users\TestQ\OneDrive\Backup_Dallelec_Dati
echo 📊 File JSON con dati reali
echo.
pause