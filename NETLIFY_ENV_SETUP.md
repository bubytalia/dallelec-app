# 🔧 CONFIGURAZIONE VARIABILI AMBIENTE NETLIFY

## ⚠️ IMPORTANTE - CONFIGURAZIONE OBBLIGATORIA

Per far funzionare il sistema in produzione, devi configurare le seguenti variabili nel dashboard Netlify:

### 📍 DOVE CONFIGURARE
1. Vai su https://app.netlify.com
2. Seleziona il sito "dallelec.com" 
3. Site settings → Environment variables
4. Add variable per ognuna delle seguenti:

### 🔑 VARIABILI SUPABASE (OBBLIGATORIE)
```
VITE_SUPABASE_URL=https://aumhdoiwtichjlvbrnrl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA
```

### 🔥 VARIABILI FIREBASE (COMPATIBILITÀ)
```
VITE_FIREBASE_API_KEY=AIzaSyD97Bgyg0SwVPF9rZS4BCSWKP20LxXfaqM
VITE_FIREBASE_AUTH_DOMAIN=dallelec-gestion-58a49.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dallelec-gestion-58a49
VITE_FIREBASE_STORAGE_BUCKET=dallelec-gestion-58a49.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=801397923579
VITE_FIREBASE_APP_ID=1:801397923579:web:b07860aadfeef5c1579a5e
VITE_FIREBASE_MEASUREMENT_ID=G-G3CLCT2ERB
```

### ✅ DOPO LA CONFIGURAZIONE
1. Trigger new deploy su Netlify
2. Verificare che il sito funzioni correttamente
3. Testare login e funzionalità principali

### 🚨 SICUREZZA
- ✅ Credenziali rimosse dal repository
- ✅ File .env protetto da .gitignore  
- ✅ Variabili configurate solo su Netlify
- ✅ Sistema sicuro per produzione