@echo off
REM ========================================
REM SINCRONIZZAZIONE DALLELEC SU HD ESTERNO
REM Cartella destinazione: gestionale\Dallelec_app
REM ========================================

echo [%date% %time%] 🚀 Sincronizzazione Dallelec su HD esterno...

REM Configurazione
set SOURCE_DIR=C:\Projects\Dallelec_app
set TARGET_FOLDER=gestionale\Dallelec_app
set DRIVES=D E F G H I J K L M N O P Q R S T U V W X Y Z

REM Cerca drive esterno con cartella gestionale
for %%d in (%DRIVES%) do (
    if exist "%%d:\gestionale" (
        echo [%date% %time%] 📱 HD esterno trovato: %%d:\ (con cartella gestionale)
        
        REM Sincronizza con robocopy
        echo [%date% %time%] 🔄 Sincronizzazione in corso...
        robocopy "%SOURCE_DIR%" "%%d:\%TARGET_FOLDER%" /MIR /XD node_modules dist .git .firebase .netlify /XF *.log *.tmp /R:2 /W:3 /MT:2
        
        if %ERRORLEVEL% LEQ 3 (
            echo [%date% %time%] ✅ Sincronizzazione completata su %%d:\%TARGET_FOLDER%
            
            REM Crea file di stato
            echo Ultima sincronizzazione: %date% %time% > "%%d:\%TARGET_FOLDER%\SYNC_STATUS.txt"
            echo Fonte: %SOURCE_DIR% >> "%%d:\%TARGET_FOLDER%\SYNC_STATUS.txt"
        ) else (
            echo [%date% %time%] ❌ Errore durante la sincronizzazione
        )
        
        goto :found
    )
)

echo [%date% %time%] ⚠️ HD esterno con cartella 'gestionale' non trovato
echo Assicurati che l'HD sia collegato e contenga la cartella 'gestionale'
goto :end

:found
echo [%date% %time%] 🎉 Sincronizzazione completata!

:end
pause