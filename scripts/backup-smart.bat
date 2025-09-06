@echo off
REM ========================================
REM BACKUP INTELLIGENTE DALLELEC
REM Con esclusioni ottimizzate e compressione
REM ========================================

setlocal enabledelayedexpansion

echo [%date% %time%] 🚀 Avvio Backup Intelligente Dallelec...

REM Configurazione
set SOURCE_DIR=C:\Projects\Dallelec_app
set BACKUP_NAME=Dallelec_Backup_%date:~6,4%_%date:~3,2%_%date:~0,2%
set DRIVES=E F G H I J K L M N O P Q R S T U V W X Y Z

REM Cerca drive esterno
for %%d in (%DRIVES%) do (
    if exist %%d:\ (
        echo [%date% %time%] 📱 Drive esterno trovato: %%d:\
        
        REM Crea cartella con timestamp
        set BACKUP_DIR=%%d:\!BACKUP_NAME!
        if not exist "!BACKUP_DIR!" mkdir "!BACKUP_DIR!"
        
        echo [%date% %time%] 📁 Backup in: !BACKUP_DIR!
        
        REM Backup ottimizzato con robocopy
        echo [%date% %time%] 🔄 Sincronizzazione file essenziali...
        robocopy "%SOURCE_DIR%" "!BACKUP_DIR!" /E /XD node_modules dist .git .firebase .netlify .vscode /XF *.log *.tmp package-lock.json /R:2 /W:3 /MT:4 /LOG:"!BACKUP_DIR!\backup_report.txt"
        
        REM Crea file info backup
        echo Backup Dallelec creato il %date% alle %time% > "!BACKUP_DIR!\BACKUP_INFO.txt"
        echo Dimensione progetto: >> "!BACKUP_DIR!\BACKUP_INFO.txt"
        dir "%SOURCE_DIR%" /s /-c | find "File" >> "!BACKUP_DIR!\BACKUP_INFO.txt"
        
        if !ERRORLEVEL! LEQ 3 (
            echo [%date% %time%] ✅ Backup completato: !BACKUP_DIR!
            echo [%date% %time%] 📊 Report: !BACKUP_DIR!\backup_report.txt
        ) else (
            echo [%date% %time%] ❌ Errore backup su %%d:\
        )
        
        goto :success
    )
)

echo [%date% %time%] ⚠️ Nessun drive esterno disponibile
echo Collega un hard disk esterno e riprova
goto :end

:success
echo [%date% %time%] 🎉 Backup automatico completato con successo!

:end
pause