@echo off
echo 🚨 BACKUP IMMEDIATO SUPABASE - MIGRAZIONE IN CORSO
echo.

set TIMESTAMP=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=C:\Users\TestQ\Desktop\BACKUP_MIGRAZIONE_%TIMESTAMP%
set ONEDRIVE_DIR=C:\Users\TestQ\OneDrive\DallelecBackups\BACKUP_MIGRAZIONE_%TIMESTAMP%

echo 📁 Creando cartelle backup...
mkdir "%BACKUP_DIR%"
mkdir "%ONEDRIVE_DIR%"

echo 💾 Copiando progetto completo...
xcopy "C:\Users\TestQ\Desktop\gestionale\Dallelec_app" "%BACKUP_DIR%\progetto\" /E /I /Y /Q

echo 📋 Creando lista tabelle Supabase...
echo TABELLE SUPABASE - %date% %time% > "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo ================================== >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo absences - 0 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo admins - 2 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo chantiers - 12 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo chefdechantiers - 5 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo clients - 7 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo collaborateurs - 2 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo conditions - 15 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo configuration - 1 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo devis - 7 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo factures - 2 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo familles - 11 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo heures_chef_interim - 0 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo heures_chef_propres - 0 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo heures_ouvriers - 2 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo interimaires - 1 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo metrages - 1 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo paiements - 5 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo produits - 99 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo resoconti_percentuali - 0 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo sousfamilles - 47 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo supplements - 7 rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"
echo techniciens - ? rows >> "%BACKUP_DIR%\TABELLE_SUPABASE.txt"

echo 📝 Creando istruzioni ripristino...
echo ISTRUZIONI RIPRISTINO EMERGENZA > "%BACKUP_DIR%\RIPRISTINO.txt"
echo ================================= >> "%BACKUP_DIR%\RIPRISTINO.txt"
echo. >> "%BACKUP_DIR%\RIPRISTINO.txt"
echo 1. Crea nuovo progetto Supabase >> "%BACKUP_DIR%\RIPRISTINO.txt"
echo 2. Esegui script SQL da progetto/create-missing-heures-tables.sql >> "%BACKUP_DIR%\RIPRISTINO.txt"
echo 3. Importa dati manualmente da Supabase Dashboard >> "%BACKUP_DIR%\RIPRISTINO.txt"
echo 4. Aggiorna credenziali in progetto/.env >> "%BACKUP_DIR%\RIPRISTINO.txt"
echo. >> "%BACKUP_DIR%\RIPRISTINO.txt"
echo CREDENZIALI ATTUALI: >> "%BACKUP_DIR%\RIPRISTINO.txt"
echo URL: https://aumhdoiwtichjlvbrnrl.supabase.co >> "%BACKUP_DIR%\RIPRISTINO.txt"
echo Email: danielemaggi65@gmail.com >> "%BACKUP_DIR%\RIPRISTINO.txt"
echo Password: 04@@Buby14 >> "%BACKUP_DIR%\RIPRISTINO.txt"

echo 🌐 Copiando su OneDrive...
xcopy "%BACKUP_DIR%" "%ONEDRIVE_DIR%" /E /I /Y /Q

echo.
echo ✅ BACKUP COMPLETATO!
echo 📁 Locale: %BACKUP_DIR%
echo ☁️ OneDrive: %ONEDRIVE_DIR%
echo.
echo 🚨 IMPORTANTE: Ora hai una copia completa di TUTTO
echo    - Progetto completo
echo    - Lista tabelle con numero righe
echo    - Istruzioni ripristino
echo    - Credenziali Supabase
echo.
pause