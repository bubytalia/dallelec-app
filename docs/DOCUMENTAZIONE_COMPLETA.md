# 📋 DOCUMENTAZIONE COMPLETA - GESTIONALE DALLELEC

## 🎯 PANORAMICA PROGETTO

**Nome:** Gestionale Dallelec  
**URL Live:** https://dallelec.com  
**Tipo:** Sistema gestionale aziendale completo  
**Tecnologie:** Vue.js 3, Firebase, Netlify  
**Stato:** ✅ PRODUZIONE ATTIVA  

---

## 🏗️ ARCHITETTURA SISTEMA

### **Frontend**
- **Framework:** Vue.js 3 + Vite
- **Styling:** Bootstrap 5 + CSS personalizzato
- **Routing:** Vue Router
- **Stato:** Composition API
- **Build:** Vite (bundler moderno)

### **Backend**
- **Database:** Firebase Firestore (NoSQL)
- **Autenticazione:** Firebase Auth
- **Storage:** Firebase Storage (per PDF)
- **Hosting:** Netlify (CDN globale)

### **Deploy**
- **Repository:** GitHub (bubytalia/dallelec-app)
- **Branch Produzione:** fix-produits-devis
- **CI/CD:** Netlify (deploy automatico)
- **Dominio:** dallelec.com (DNS configurato)

---

## 👥 SISTEMA UTENTI E RUOLI

### **Ruoli Disponibili**
1. **👨💻 Admin** - Accesso completo
2. **👨💼 Chef de Chantier** - Gestione cantieri e ore
3. **👷 Ouvrier** - Inserimento ore lavoro

### **Autenticazione**
- **Login:** Email + Password
- **Controllo ruoli:** Basato su collections Firebase
- **Sicurezza:** Regole Firestore per accesso dati

---

## 🗄️ STRUTTURA DATABASE FIREBASE

### **Collections Principali**

#### **Anagrafica**
- `admins` - Amministratori sistema
- `chefdechantiers` - Chef de chantier
- `collaborateurs` - Ouvriers/collaboratori
- `clients` - Clienti azienda
- `chantiers` - Cantieri di lavoro
- `interimaires` - Lavoratori interinali

#### **Prodotti e Servizi**
- `produits` - Catalogo prodotti
- `familles` - Famiglie prodotti
- `sousfamilles` - Sottofamiglie prodotti
- `techniciens` - Tecnici specializzati
- `supplements` - Supplementi e extra

#### **Gestione Lavoro**
- `heures_ouvriers` - Ore lavoro ouvriers
- `heures_chef_propres` - Ore proprie chef
- `heures_chef_interim` - Ore interim gestite da chef
- `absences` - Gestione ferie e assenze
- `metrages` - Misurazioni cantieri
- `resoconti_percentuali` - Report avanzamento

#### **Commerciale**
- `devis` - Preventivi
- `factures` - Fatture emesse
- `factures_manuelles` - Fatture manuali
- `paiements` - Modalità pagamento
- `conditions` - Condizioni contrattuali

---

## 🔧 FUNZIONALITÀ PRINCIPALI

### **📊 Dashboard Personalizzate**
- **Admin:** Gestione completa sistema
- **Chef:** Cantieri, ore, métrages, premi
- **Ouvrier:** Inserimento ore, gestione assenze

### **💰 Sistema Fatturazione**
- **Automatica:** Basata su métrages validati
- **Manuale:** Creazione libera fatture
- **PDF:** Generazione automatica documenti
- **Numerazione:** Progressiva automatica

### **⏰ Gestione Ore**
- **Controllo temporale:** Limite 2 giorni per inserimento
- **Override admin:** Autorizzazione per date passate
- **Validazione:** Chef approva ore ouvriers
- **Report:** Mensili per commercialista

### **🏗️ Gestione Cantieri**
- **Anagrafica completa:** Dati, responsabili, modalità
- **Métrages:** Misurazioni dettagliate
- **Resoconti:** Percentuali avanzamento
- **Associazione devis:** Collegamento preventivi

### **🎁 Sistema Premi Chef**
- **Calcolo automatico:** Basato su efficienza
- **Percentuale impresa:** Configurabile per cantiere (default 30%)
- **Premio efficienza:** 26 CHF/ora risparmiata
- **Premio regie:** 5 CHF/ora regie

### **📚 Centro Aiuto**
- **Guide personalizzate:** Per ogni ruolo utente
- **FAQ:** Domande frequenti
- **Accesso integrato:** Da tutti i dashboard

### **📈 Report e Analisi**
- **Report mensile:** Per commercialista
- **Esclusione account:** Test esclusi da report
- **Bilanci finanziari:** Analisi ricavi
- **Statistiche:** Ore, assenze, performance

---

## 🚀 PROCESSO DEPLOY E AGGIORNAMENTI

### **Repository GitHub**
```
Repository: https://github.com/bubytalia/dallelec-app
Branch Produzione: fix-produits-devis
```

### **Comandi Git Essenziali**
```bash
# Salvare modifiche
git add .
git commit -m "Descrizione modifiche"
git push origin fix-produits-devis

# Vedere stato
git status
git log --oneline

# Creare nuovo branch
git checkout -b nome-nuovo-branch
```

### **Deploy Automatico Netlify**
1. **Push su GitHub** → Trigger automatico
2. **Build Process:** `npm run build`
3. **Deploy:** Automatico su dallelec.com
4. **Tempo:** 2-3 minuti
5. **Notifica:** Email conferma deploy

### **Configurazione Netlify**
- **Site ID:** neon-cactus-5f0217
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Branch:** fix-produits-devis

---

## 🔐 CONFIGURAZIONI CRITICHE

### **Firebase Config**
File: `src/firebase.js`
```javascript
// Configurazione Firebase (già configurata)
// Non modificare senza backup
```

### **DNS Configurazione**
- **Dominio:** dallelec.com (Namecheap)
- **DNS:** Namecheap BasicDNS
- **Record A:** 75.2.60.5 (Netlify)
- **CNAME app:** neon-cactus-5f0217.netlify.app

### **Variabili Ambiente**
- **Firebase:** Configurazione in firebase.js
- **Netlify:** Variabili ambiente nel dashboard

---

## 🛠️ MANUTENZIONE E TROUBLESHOOTING

### **Problemi Comuni**

#### **Build Fallisce**
```bash
# Controllare dipendenze
npm install
npm run build

# Verificare errori console
npm run dev
```

#### **Database Non Risponde**
1. Verificare regole Firestore
2. Controllare autenticazione utenti
3. Verificare connessione internet

#### **Deploy Non Funziona**
1. Controllare Netlify dashboard
2. Verificare build logs
3. Controllare configurazione DNS

### **Backup e Sicurezza**
- **Codice:** Salvato su GitHub
- **Database:** Firebase backup automatico
- **Configurazioni:** Documentate in questo file

---

## 📱 UTILIZZO QUOTIDIANO

### **Per Ouvriers**
1. Login con credenziali aziendali
2. Inserire ore giornalmente (max 2 giorni indietro)
3. Gestire richieste assenze
4. Consultare centro aiuto se necessario

### **Per Chef de Chantier**
1. Inserire ore proprie e interim
2. Validare ore ouvriers
3. Creare métrages e resoconti
4. Monitorare premi efficienza

### **Per Admin**
1. Gestire anagrafica completa
2. Creare e gestire fatture
3. Monitorare report mensili
4. Configurare sistema

---

## 🔄 AGGIORNAMENTI FUTURI

### **Come Aggiungere Funzionalità**
1. **Sviluppo locale:** `npm run dev`
2. **Test:** Verificare funzionamento
3. **Commit:** `git add . && git commit -m "Descrizione"`
4. **Deploy:** `git push origin fix-produits-devis`
5. **Verifica:** Controllare dallelec.com

### **Struttura File Importante**
```
src/
├── components/     # Componenti riutilizzabili
├── views/         # Pagine principali
├── router/        # Configurazione routing
├── firebase.js    # Configurazione database
└── main.js       # Entry point applicazione
```

---

## 📞 SUPPORTO E CONTATTI

### **Informazioni Tecniche**
- **Hosting:** Netlify (gratuito fino 100GB/mese)
- **Database:** Firebase (piano gratuito)
- **Dominio:** Namecheap (rinnovo annuale)
- **Repository:** GitHub (gratuito)

### **Credenziali Importanti**
- **GitHub:** Account bubytalia
- **Netlify:** Collegato a GitHub
- **Firebase:** Progetto dallelec-app
- **Namecheap:** Dominio dallelec.com

### **In Caso di Emergenza**
1. **Sito down:** Controllare Netlify status
2. **Database problemi:** Verificare Firebase console
3. **DNS problemi:** Controllare Namecheap DNS
4. **Codice perso:** Recuperare da GitHub

---

## ✅ CHECKLIST MANUTENZIONE

### **Settimanale**
- [ ] Verificare funzionamento sito
- [ ] Controllare report errori
- [ ] Backup locale codice

### **Mensile**
- [ ] Verificare spazio Netlify
- [ ] Controllare usage Firebase
- [ ] Aggiornare documentazione

### **Annuale**
- [ ] Rinnovare dominio dallelec.com
- [ ] Aggiornare dipendenze npm
- [ ] Revisione sicurezza

---

## 🎯 CONCLUSIONI

Il **Gestionale Dallelec** è un sistema completo e professionale che gestisce tutti gli aspetti operativi dell'azienda. È stato progettato per essere:

- **🔒 Sicuro:** Autenticazione e controlli accesso
- **📱 Responsive:** Funziona su tutti i dispositivi  
- **⚡ Veloce:** CDN globale e tecnologie moderne
- **🔄 Automatico:** Deploy e backup automatici
- **📈 Scalabile:** Può crescere con l'azienda

**Il sistema è pronto per l'uso in produzione e può essere mantenuto seguendo questa documentazione.**

---

*Documentazione creata: Dicembre 2024*  
*Versione: 1.0*  
*Stato: ✅ COMPLETA*