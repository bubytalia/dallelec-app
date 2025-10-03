# 🚀 GUIDA RAPIDA CHAT - SISTEMA DALLELEC

## ⚠️ INFORMAZIONI CRITICHE

### **Deploy e Git**
- **Branch OBBLIGATORIO**: `fix-produits-devis` 
- **Repository**: https://github.com/bubytalia/dallelec-app
- **URL Live**: https://dallelec.com
- **Deploy**: Automatico su push GitHub

### **Database**
- **Supabase**: https://aumhdoiwtichjlvbrnrl.supabase.co
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA`

---

## 🔧 PROCEDURA STANDARD MODIFICHE

### **1. Verifica Branch**
```bash
git branch  # Deve essere su fix-produits-devis
```

### **2. Test Locale**
```bash
npm run dev  # Testare sempre prima
```

### **3. Deploy (SOLO se test OK)**
```bash
git add .
git commit -m "Descrizione breve"
git push origin fix-produits-devis
```

---

## 📁 FILE PRINCIPALI

### **PDF Devis**
- `src/components/DevisPdf.vue` - PDF preventivi détaillé
- `src/components/DevisCorpsPdf.vue` - PDF preventivi à corps

### **Sistema Devis**
- `src/views/devis/DevisCreate.vue` - Creazione
- `src/views/devis/DevisList.vue` - Lista
- `src/views/devis/DevisConditions.vue` - Condizioni

### **Fatturazione**
- `src/views/AdminFacturation.vue` - Sistema fatturazione

---

## 🎯 SISTEMA COMPLETATO

### **Moduli Funzionanti 100%**
- ✅ Sistema Devis (détaillé + à corps)
- ✅ Gestione Cantieri
- ✅ Sistema Métrages
- ✅ Fatturazione con PDF doppi
- ✅ Gestione Ore
- ✅ Repertoires anagrafici

### **Login Test**
- **Admin**: admin@dallelec.com
- **Password**: Qualsiasi (sistema temporaneo)

---

## ⚠️ REGOLE ASSOLUTE

### **MAI FARE**
- Push su branch `master`
- Modificare `.env` senza backup
- Deploy senza test locale
- Toccare credenziali Supabase

### **SEMPRE FARE**
- Verificare branch `fix-produits-devis`
- Test locale con `npm run dev`
- Commit singolo per modifica
- Messaggio commit chiaro

---

## 🛠️ TROUBLESHOOTING RAPIDO

### **PDF non funziona online**
```bash
npm run build
git add . && git commit -m "Fix build" && git push origin fix-produits-devis
```

### **Errori database**
- Verificare credenziali Supabase in `.env`
- Controllare connessione internet

### **Deploy non funziona**
- Verificare branch: `git branch`
- Controllare Netlify dashboard

---

**SISTEMA IN PRODUZIONE: https://dallelec.com**  
**Status**: ✅ COMPLETATO E OPERATIVO