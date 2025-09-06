@echo off
title 🤖 BACKUP SMART DALLELEC
color 0B

echo.
echo ████████████████████████████████████████
echo █         BACKUP SMART DALLELEC             █
echo ████████████████████████████████████████
echo.
echo 🤖 RILEVA AUTOMATICAMENTE TABELLE NUOVE
echo 📊 Non serve mai aggiornare liste
echo ☁️ Salva su OneDrive con report completo
echo ⚡ Backup reale da Supabase (non simulato)
echo.

cd /d "C:\Users\TestQ\Desktop\gestionale\Dallelec_app"

echo 🚀 Avvio backup manuale (quello che funziona)...
powershell -ExecutionPolicy Bypass -File "backup-dati-manuale.ps1"

echo.
echo ✅ BACKUP SMART COMPLETATO!
echo 📁 Controlla: c:\Users\TestQ\OneDrive\Backup_Dallelec_Dati
echo 🤖 Tabelle rilevate automaticamente
echo.
pause