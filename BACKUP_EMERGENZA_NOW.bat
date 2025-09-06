@echo off
echo 🚨 BACKUP EMERGENZA SUPABASE - ESEGUI SUBITO!
echo.
echo Questo script salva tutti i dati prima di qualsiasi problema
echo.

set BACKUP_DIR=C:\Users\TestQ\Desktop\BACKUP_EMERGENZA_%date:~-4,4%_%date:~-10,2%_%date:~-7,2%_%time:~0,2%_%time:~3,2%
mkdir "%BACKUP_DIR%"

echo 📊 Creando backup in: %BACKUP_DIR%
echo.

echo ⚠️ IMPORTANTE: Vai su Supabase Dashboard
echo 1. SQL Editor
echo 2. Copia e incolla questo comando:
echo.
echo SELECT * FROM clients;
echo SELECT * FROM chantiers;
echo SELECT * FROM devis;
echo SELECT * FROM produits;
echo SELECT * FROM supplements;
echo SELECT * FROM heures_ouvriers;
echo SELECT * FROM heures_chef_propres;
echo SELECT * FROM heures_chef_interim;
echo.
echo 3. Salva i risultati in file CSV
echo 4. Metti i CSV in: %BACKUP_DIR%
echo.

echo 💾 Copiando anche file progetto...
xcopy "C:\Users\TestQ\Desktop\gestionale\Dallelec_app\src" "%BACKUP_DIR%\src\" /E /I /Y
xcopy "C:\Users\TestQ\Desktop\gestionale\Dallelec_app\*.md" "%BACKUP_DIR%\" /Y
xcopy "C:\Users\TestQ\Desktop\gestionale\Dallelec_app\*.json" "%BACKUP_DIR%\" /Y

echo.
echo ✅ BACKUP COMPLETATO!
echo I tuoi dati sono al sicuro in: %BACKUP_DIR%
echo.
pause