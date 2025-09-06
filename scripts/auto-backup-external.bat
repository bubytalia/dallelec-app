@echo off
REM ========================================
REM DALLELEC - AUTO BACKUP SU HARD DISK ESTERNO
REM ========================================

echo [%date% %time%] Avvio backup automatico Dallelec...

REM Definisci percorsi
set SOURCE_DIR=C:\Projects\Dallelec_app
set BACKUP_BASE=Dallelec_Backup

REM Lista possibili lettere drive esterni (da E: a Z:)
set DRIVES=E F G H I J K L M N O P Q R S T U V W X Y Z

REM Cerca hard disk esterno disponibile
for %%d in (%DRIVES%) do (
    if exist %%d:\ (
        echo [%date% %time%] Trovato drive esterno: %%d:\
        
        REM Crea cartella backup se non esiste
        if not exist "%%d:\%BACKUP_BASE%" mkdir "%%d:\%BACKUP_BASE%"
        
        REM Esegui sincronizzazione con robocopy
        echo [%date% %time%] Sincronizzazione in corso...
        robocopy "%SOURCE_DIR%" "%%d:\%BACKUP_BASE%" /MIR /XD node_modules dist .git /XF *.log *.tmp /R:3 /W:5 /LOG:"%%d:\%BACKUP_BASE%\backup_log.txt"
        
        if %ERRORLEVEL% LEQ 3 (
            echo [%date% %time%] ✅ Backup completato con successo su %%d:\%BACKUP_BASE%
            echo [%date% %time%] Log salvato in: %%d:\%BACKUP_BASE%\backup_log.txt
        ) else (
            echo [%date% %time%] ❌ Errore durante il backup su %%d:\
        )
        
        REM Esci dopo il primo drive trovato
        goto :found
    )
)

echo [%date% %time%] ⚠️ Nessun hard disk esterno trovato
goto :end

:found
echo [%date% %time%] Backup automatico completato

:end
pause