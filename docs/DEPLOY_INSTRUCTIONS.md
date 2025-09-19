# 🚀 ISTRUZIONI DEPLOY DALLELEC

## ⚠️ SITUAZIONE ATTUALE
- **Sistema**: Completamente funzionante su Supabase
- **Database**: aumhdoiwtichjlvbrnrl.supabase.co
- **Devis**: Tutti convertiti e funzionanti
- **Repertoires**: Tutti convertiti e funzionanti

## 🎯 STEP IMMEDIATI

### 1️⃣ AUTENTICAZIONE SUPABASE
```bash
# Dashboard: https://supabase.com/dashboard/project/aumhdoiwtichjlvbrnrl/auth/settings
# - Disabilitare "Enable email confirmations"
# - Creare utenti: admin@dallelec.com, chef@dallelec.com, ouvrier@dallelec.com
```

### 2️⃣ SALVATAGGIO GIT
```bash
cd c:\Users\TestQ\Desktop\gestionale\Dallelec_app

# Verifica stato
git status

# Aggiungi tutti i file modificati
git add .

# Commit con messaggio descrittivo
git commit -m "MIGRAZIONE SUPABASE COMPLETATA - Sistema devis funzionante

- Convertiti tutti i repertoires a Supabase
- Sistema devis completamente funzionante (DevisList, DevisCreate, DevisProduits)
- Recuperati tutti i prodotti dal backup Firebase
- Corrette modalità prezzi per tutti i devis
- Popolate zone cantiere automaticamente
- Aggiornate percentuali remises sousfamilles
- Sistema pronto per produzione"

# Push su GitHub
git push origin fix-produits-devis
```

### 3️⃣ DEPLOY NETLIFY
```bash
# Build produzione
npm run build

# Deploy su Netlify
npx netlify deploy --prod --dir dist
```

## 📊 CONFIGURAZIONE ATTUALE

### **HOSTING**
- **URL**: https://dallelec.com
- **Netlify Site**: neon-cactus-5f0217
- **Branch**: fix-produits-devis

### **DATABASE**
- **Tipo**: Supabase PostgreSQL
- **URL**: https://aumhdoiwtichjlvbrnrl.supabase.co
- **Status**: Completamente migrato da Firebase

### **REPOSITORY**
- **GitHub**: https://github.com/bubytalia/dallelec-app
- **Branch principale**: fix-produits-devis

## ✅ VERIFICA POST-DEPLOY
1. Testare login con utenti Supabase
2. Verificare caricamento devis
3. Testare repertoires
4. Controllare funzionalità complete

## 🔄 BACKUP SICUREZZA
- Esportare dati Supabase prima del deploy
- Mantenere backup locale del database