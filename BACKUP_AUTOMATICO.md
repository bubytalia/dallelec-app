# 💾 SISTEMA BACKUP AUTOMATICO DALLELEC

## 🎯 CONFIGURAZIONE COMPLETATA

### **Cartella Destinazione**
- **HD Esterno**: `[Lettera]:\gestionale\Dallelec_app`
- **Rilevamento**: Automatico quando colleghi l'HD
- **Sincronizzazione**: Completa con esclusioni intelligenti

## 🚀 SCRIPT CREATI

### **1. sync-to-external.bat** 
- **Funzione**: Sincronizzazione manuale immediata
- **Uso**: Doppio click per backup istantaneo
- **Destinazione**: Cerca automaticamente HD con cartella "gestionale"

### **2. auto-sync-usb.ps1**
- **Funzione**: Monitoraggio automatico inserimento USB
- **Comportamento**: Rileva HD e avvia sincronizzazione automatica
- **Esecuzione**: In background, sempre attivo

### **3. setup-auto-sync-gestionale.bat**
- **Funzione**: Configurazione iniziale sistema
- **Crea**: Task Windows per avvio automatico
- **Risultato**: Sistema completamente automatizzato

## ⚙️ INSTALLAZIONE

### **Passo 1: Setup Iniziale**
```cmd
cd C:\Projects\Dallelec_app\scripts
setup-auto-sync-gestionale.bat
```

### **Passo 2: Test Manuale**
```cmd
sync-to-external.bat
```

## 🔄 FUNZIONAMENTO AUTOMATICO

### **Scenario Tipico**
1. **Accendi PC** → Monitoraggio USB si avvia automaticamente
2. **Colleghi HD esterno** → Sistema rileva cartella "gestionale"
3. **Sincronizzazione automatica** → Progetto copiato/aggiornato
4. **Notifica completamento** → Backup sicuro su HD esterno

### **Esclusioni Intelligenti**
- ❌ `node_modules` (troppo grande, si rigenera)
- ❌ `dist` (build temporanea)
- ❌ `.git` (versioning, non necessario per backup)
- ❌ `.firebase`, `.netlify` (cache deploy)
- ❌ `*.log`, `*.tmp` (file temporanei)

## 📊 VANTAGGI SICUREZZA

### **Backup Ridondante**
- ✅ **Locale**: `C:\Projects\Dallelec_app`
- ✅ **HD Esterno**: `[HD]:\gestionale\Dallelec_app`
- ✅ **Git Repository**: GitHub (codice)

### **Protezione Dati**
- 🛡️ **Perdita HD principale**: Recupero da HD esterno
- 🛡️ **Corruzione file**: Versioni multiple disponibili
- 🛡️ **Errori accidentali**: Backup automatici frequenti

### **Sincronizzazione Intelligente**
- ⚡ **Solo file modificati**: Velocità ottimizzata
- 📁 **Struttura preservata**: Organizzazione mantenuta
- 🕐 **Timestamp accurati**: Tracciamento modifiche

## 🎛️ CONTROLLI DISPONIBILI

### **Comandi Rapidi**
```cmd
# Test sincronizzazione
sync-to-external.bat

# Avvia monitoraggio manuale
powershell -File auto-sync-usb.ps1

# Rimuovi automazione
schtasks /delete /tn "DallelecSyncGestionale" /f
```

### **Verifica Stato**
- **File stato**: `[HD]:\gestionale\Dallelec_app\SYNC_STATUS.txt`
- **Ultima sincronizzazione**: Data/ora nell'file stato
- **Task Windows**: Visibile in "Utilità di pianificazione"

## 🚨 RISOLUZIONE PROBLEMI

### **HD non rilevato**
- Verifica cartella "gestionale" esista
- Controlla connessione USB
- Esegui test manuale: `sync-to-external.bat`

### **Sincronizzazione fallita**
- Spazio insufficiente su HD esterno
- Permessi di scrittura mancanti
- File in uso (chiudi applicazioni)

### **Monitoraggio non funziona**
- Riavvia task: `setup-auto-sync-gestionale.bat`
- Verifica PowerShell abilitato
- Controlla log eventi Windows

---

## ✅ SISTEMA ATTIVO

**🎉 Il tuo sistema di backup automatico è configurato e pronto!**

**Collega l'HD esterno per testare la sincronizzazione automatica.**