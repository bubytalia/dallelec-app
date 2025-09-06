@echo off
REM ========================================
REM BACKUP VERSIONED DALLELEC
REM Mantiene multiple versioni con timestamp
REM ========================================

setlocal enabledelayedexpansion

echo [%date% %time%] 🚀 Backup versioned Dallelec...

REM Crea timestamp leggibile: YYYY-MM-DD_HH-MM
for /f "tokens=1-3 delims=/." %%a in ("%date%") do set mydate=%%c-%%b-%%a
for /f "tokens=1-2 delims=:." %%a in ("%time%") do set mytime=%%a-%%b
set TIMESTAMP=%mydate%_%mytime: =0%

REM Configurazione
set SOURCE_DIR=C:\Projects\Dallelec_app
set BACKUP_NAME=Dallelec_%TIMESTAMP%
set DRIVES=D E F G H I J K L M N O P Q R S T U V W X Y Z

echo [%date% %time%] 📅 Creazione backup: %BACKUP_NAME%

REM Cerca drive esterno con cartella gestionale
for %%d in (%DRIVES%) do (
    if exist "%%d:\gestionale" (
        echo [%date% %time%] 📱 HD esterno trovato: %%d:\
        
        REM Crea cartella backup con timestamp
        set BACKUP_DIR=%%d:\gestionale\%BACKUP_NAME%
        mkdir "!BACKUP_DIR!" 2>nul
        
        echo [%date% %time%] 📁 Backup in: !BACKUP_DIR!
        
        REM Sincronizza con robocopy
        robocopy "%SOURCE_DIR%" "!BACKUP_DIR!" /E /XD node_modules dist .git .firebase .netlify /XF *.log *.tmp /R:2 /W:3 /MT:2 /NP
        
        if !ERRORLEVEL! LEQ 3 (
            REM Crea file info con dettagli leggibili
            echo ========================================= > "!BACKUP_DIR!\BACKUP_INFO.txt"
            echo BACKUP DALLELEC >> "!BACKUP_DIR!\BACKUP_INFO.txt"
            echo ========================================= >> "!BACKUP_DIR!\BACKUP_INFO.txt"
            echo Data: %date% >> "!BACKUP_DIR!\BACKUP_INFO.txt"
            echo Ora: %time% >> "!BACKUP_DIR!\BACKUP_INFO.txt"
            echo Fonte: %SOURCE_DIR% >> "!BACKUP_DIR!\BACKUP_INFO.txt"
            echo Destinazione: !BACKUP_DIR! >> "!BACKUP_DIR!\BACKUP_INFO.txt"
            echo ========================================= >> "!BACKUP_DIR!\BACKUP_INFO.txt"
            
            echo [%date% %time%] ✅ Backup completato: !BACKUP_DIR!
            echo [%date% %time%] 📄 Info salvate in: BACKUP_INFO.txt
            
            REM Pulizia backup vecchi (mantieni ultimi 10)
            call :cleanup_old_backups "%%d:\gestionale"
        ) else (
            echo [%date% %time%] ❌ Errore durante il backup
        )
        
        goto :found
    )
)

echo [%date% %time%] ⚠️ HD esterno con cartella 'gestionale' non trovato
goto :end

:cleanup_old_backups
echo [%date% %time%] 🧹 Pulizia backup vecchi (mantengo ultimi 10)...
pushd %1
for /f "skip=10 delims=" %%i in ('dir /b /ad /o-d Dallelec_* 2^>nul') do (
    echo [%date% %time%] 🗑️ Rimuovo backup vecchio: %%i
    rmdir /s /q "%%i" 2>nul
)
popd
goto :eof

:found
echo [%date% %time%] 🎉 Backup versioned completato!

:end
pause