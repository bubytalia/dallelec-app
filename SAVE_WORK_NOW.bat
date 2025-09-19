@echo off
echo ========================================
echo SALVATAGGIO LAVORO DALLELEC - URGENTE
echo ========================================

cd /d "C:\Users\bubyt\Desktop\gestionalequater\Dallelec_app_new"

echo.
echo 1. Verifica stato Git...
git status

echo.
echo 2. Aggiunta tutti i file...
git add .

echo.
echo 3. Commit con messaggio...
git commit -m "MIGRAZIONE SUPABASE COMPLETATA - Sistema devis 100%% funzionante

- Convertiti tutti i repertoires a Supabase (Clients, Produits, Techniciens, etc.)
- Sistema devis completamente funzionante (DevisList, DevisCreate, DevisProduits)
- Recuperati tutti i prodotti dal backup Firebase
- Corrette modalita prezzi per tutti i devis (scontistica/prezziFissi)
- Popolate zone cantiere automaticamente
- Aggiornate percentuali remises sousfamilles
- Sistema pronto per produzione
- Database: aumhdoiwtichjlvbrnrl.supabase.co"

echo.
echo 4. Push su GitHub...
git push origin fix-produits-devis

echo.
echo 5. Build per deploy...
call npm run build

echo.
echo 6. Deploy su Netlify...
call npx netlify deploy --prod --dir dist

echo.
echo ========================================
echo SALVATAGGIO COMPLETATO!
echo ========================================
pause