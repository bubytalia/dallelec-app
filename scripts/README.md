# DALLELEC - Script di Automazione

## 📁 Script Disponibili

### 1. `git-save.bat` - Salvataggio Git
Fa commit di tutte le modifiche locali.

**Uso:**
```bash
# Con messaggio interattivo
scripts\git-save.bat

# Con messaggio diretto
scripts\git-save.bat "Fix bug login"
```

### 2. `git-push.bat` - Push su GitHub
Pusha le modifiche sul repository GitHub (branch: fix-produits-devis).

**Uso:**
```bash
scripts\git-push.bat
```

### 3. `deploy.bat` - Deploy su Netlify
Builda il progetto e deploya su Netlify.

**Uso:**
```bash
scripts\deploy.bat
```

### 4. `full-deploy.bat` - Deploy Completo
Fa tutto in sequenza: git commit + push + build + deploy.

**Uso:**
```bash
# Con messaggio interattivo
scripts\full-deploy.bat

# Con messaggio diretto
scripts\full-deploy.bat "Aggiornamento sistema ore"
```

## 🔧 Configurazione

### Repository GitHub
- **URL**: https://github.com/bubytalia/dallelec-app
- **Branch**: fix-produits-devis

### Hosting Netlify
- **URL**: https://dallelec.com
- **Site ID**: neon-cactus-5f0217

### Database
- **Supabase**: ssjzkdunniggfcsodvtx.supabase.co
- **Firebase Auth**: dallelec-gestion-58a49

## 🚀 Flusso di Lavoro Consigliato

1. **Sviluppo**: Modifica i file del progetto
2. **Test**: Testa localmente con `npm run dev`
3. **Deploy**: Usa `scripts\full-deploy.bat "Descrizione modifiche"`

## ⚠️ Note Importanti

- Assicurati di essere sempre sul branch `fix-produits-devis`
- Gli script richiedono Git, Node.js e Netlify CLI installati
- Il deploy automatico di Netlify è configurato sul branch fix-produits-devis