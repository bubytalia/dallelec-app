@echo off
REM Backup automatico Dallelec - Avvio silenzioso
powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "c:\Users\TestQ\Desktop\gestionale\Dallelec_app\backup-hd-esterno.ps1" > nul 2>&1