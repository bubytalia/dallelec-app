@echo off
REM ========================================
REM RIPRISTINO DA BACKUP VERSIONED
REM ========================================

setlocal enabledelayedexpansion

echo 🔄 RIPRISTINO PROGETTO DALLELEC DA BACKUP
echo.

REM Cerca HD esterno
set DRIVES=D E F G H I J K L M N O P Q R S T U V W X Y Z
set FOUND_DRIVE=

for %%d in (%DRIVES%) do (
    if exist "%%d:\gestionale" (
        set FOUND_DRIVE=%%d
        goto :found_drive
    )
)

echo ❌ HD esterno con cartella 'gestionale' non trovato
echo Collega l'HD esterno e riprova
pause
exit /b 1

:found_drive
echo ✅ HD esterno trovato: %FOUND_DRIVE%:\
echo.

REM Lista backup disponibili
echo 📁 BACKUP DISPONIBILI:
echo.
set /a COUNT=0
for /f "delims=" %%i in ('dir /b /ad /o-d "%FOUND_DRIVE%:\gestionale\Dallelec_*" 2^>nul') do (
    set /a COUNT+=1
    echo !COUNT!. %%i
    
    REM Mostra info se esiste
    if exist "%FOUND_DRIVE%:\gestionale\%%i\BACKUP_INFO.txt" (
        for /f "tokens=2*" %%a in ('findstr "Data:" "%FOUND_DRIVE%:\gestionale\%%i\BACKUP_INFO.txt" 2^>nul') do echo    📅 Data: %%b
        for /f "tokens=2*" %%a in ('findstr "Ora:" "%FOUND_DRIVE%:\gestionale\%%i\BACKUP_INFO.txt" 2^>nul') do echo    🕐 Ora: %%b
    )
    echo.
)

if %COUNT% EQU 0 (
    echo ❌ Nessun backup trovato
    pause
    exit /b 1
)

REM Selezione backup
echo 🎯 Seleziona il backup da ripristinare (1-%COUNT%):
set /p CHOICE=Scelta: 

REM Validazione input
if %CHOICE% LSS 1 goto :invalid_choice
if %CHOICE% GTR %COUNT% goto :invalid_choice

REM Trova backup selezionato
set /a CURRENT=0
for /f "delims=" %%i in ('dir /b /ad /o-d "%FOUND_DRIVE%:\gestionale\Dallelec_*" 2^>nul') do (
    set /a CURRENT+=1
    if !CURRENT! EQU %CHOICE% (
        set SELECTED_BACKUP=%%i
        goto :restore_backup
    )
)

:invalid_choice
echo ❌ Scelta non valida
pause
exit /b 1

:restore_backup
echo.
echo ⚠️  ATTENZIONE: Questo sovrascriverà il progetto corrente!
echo 📁 Backup selezionato: %SELECTED_BACKUP%
echo 🎯 Destinazione: C:\Projects\Dallelec_app
echo.
set /p CONFIRM=Confermi il ripristino? (S/N): 

if /i not "%CONFIRM%"=="S" (
    echo ❌ Ripristino annullato
    pause
    exit /b 0
)

echo.
echo 🔄 Ripristino in corso...

REM Backup del progetto corrente (per sicurezza)
set BACKUP_CURRENT=C:\Projects\Dallelec_app_BACKUP_%date:~6,4%_%date:~3,2%_%date:~0,2%_%time:~0,2%_%time:~3,2%
set BACKUP_CURRENT=%BACKUP_CURRENT: =0%
echo 💾 Backup progetto corrente in: %BACKUP_CURRENT%
robocopy "C:\Projects\Dallelec_app" "%BACKUP_CURRENT%" /E /XD node_modules dist .git /R:1 /W:1 /NP >nul

REM Ripristino dal backup selezionato
echo 📥 Ripristino da: %SELECTED_BACKUP%
robocopy "%FOUND_DRIVE%:\gestionale\%SELECTED_BACKUP%" "C:\Projects\Dallelec_app" /MIR /XD node_modules dist .git /R:2 /W:3 /MT:2

if %ERRORLEVEL% LEQ 3 (
    echo.
    echo ✅ RIPRISTINO COMPLETATO CON SUCCESSO!
    echo 📁 Progetto ripristinato da: %SELECTED_BACKUP%
    echo 💾 Backup precedente salvato in: %BACKUP_CURRENT%
) else (
    echo.
    echo ❌ Errore durante il ripristino
)

echo.
pause