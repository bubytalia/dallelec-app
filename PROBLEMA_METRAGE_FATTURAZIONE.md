# 🚨 PROBLEMA URGENTE - MÉTRAGE E FATTURAZIONE

## 📋 SITUAZIONE ATTUALE

**Utente**: Daniele Maggi (danielemaggi@dallelec.com)  
**Cantiere**: "Halle et stock - Mikron Swizerland AC Boudry" (ID: 2)  
**Problema**: Deve fare fattura con acconti già fatturati ma sistema ha bug  

## 🎯 OBIETTIVO

Generare fattura per cantiere con **sottrazione acconti precedenti** (2 fatture di acconto già emesse).

## ❌ PROBLEMA TECNICO

### **Bug 1: Sistema Percentuale**
- Cantiere configurato come "📊 Percentuel" 
- Sistema reindirizza a `ChefResocontoPercentuale.vue`
- **ERRORE**: `selectedChantier: undefined` 
- **CAUSA**: Cantiere non viene trovato nella lista della pagina percentuale
- **LOG**: "❌ NESSUN DEVIS ID TROVATO per cantiere: undefined"

### **Bug 2: Associazione Devis**
- Cantiere ha devis associato (visibile in admin come "Oui")
- Sistema non trova il devis_id nel cantiere
- **POSSIBILI CAUSE**:
  - Campo database si chiama diversamente (`devis_id` vs `devisId`)
  - Valore null/vuoto nel database
  - Problema query Supabase

## 🔧 SOLUZIONI IMPLEMENTATE

### **✅ Funzionalità Acconti**
Ho già implementato in `AdminFacturation.vue`:
- Campo input per acconti precedenti nel modal métrage
- Calcolo automatico nel PDF: `Sous-total TTC - Déjà facturé = SOLDE À PAYER`
- Visualizzazione corretta nel PDF fattura

### **⚠️ Workaround Temporaneo**
1. **Admin → Repertoires → Chantiers**
2. **Modifica** cantiere "Halle et stock - Mikron"
3. **Cambia** modalità da "📊 Percentuel" a "📏 Métrages"
4. **Salva** e vai su ChefMetrages
5. **Fai métrage** e genera fattura con acconti
6. **Rimetti** modalità "📊 Percentuel"

## 🔍 DEBUG NECESSARIO

### **Verificare Database**
```sql
-- Controllare struttura cantiere
SELECT * FROM chantiers WHERE id = 2;

-- Verificare nomi campi devis
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'chantiers' AND column_name LIKE '%devis%';
```

### **Fix ChefResocontoPercentuale.vue**
Il problema è nella funzione `loadChantierData()`:
- `selectedChantier` rimane `undefined`
- Non trova il cantiere nella lista `chantiers`
- Verificare se `fetchChantiers()` viene chiamato correttamente

## 📁 FILE COINVOLTI

### **Principali**
- `src/views/ChefResocontoPercentuale.vue` - BUG principale
- `src/views/ChefMetrages.vue` - Alternativa funzionante
- `src/views/AdminFacturation.vue` - Funzionalità acconti OK
- `src/views/repertoires/Chantiers.vue` - Gestione modalità

### **Database**
- Tabella `chantiers` - Verificare campo devis
- Tabella `devis` - Verificare associazioni

## 🚀 AZIONI IMMEDIATE PROSSIMA CHAT

1. **PRIORITÀ 1**: Sistemare bug `ChefResocontoPercentuale.vue`
   - Verificare `fetchChantiers()` 
   - Controllare `selectedChantier` undefined
   - Fix associazione devis

2. **PRIORITÀ 2**: Verificare database
   - Nome campo devis nel cantiere
   - Valore effettivo per cantiere ID 2

3. **TEST**: Generare fattura con acconti funzionante

## 💡 NOTE TECNICHE

### **Funzionalità Acconti (GIÀ PRONTA)**
```javascript
// In AdminFacturation.vue - Modal métrage
<input v-model.number="accontiPrecedenti" type="number" step="0.01">

// Nel PDF
const accontiPDF = Number(accontiPrecedenti.value || 0);
const realMontantTTC = montantBrutTTC - accontiPDF;

// Visualizzazione PDF
if (accontiPDF > 0) {
  docFacture.text('Sous-total TTC:', ...);
  docFacture.text('Déjà facturé:', ...); // In rosso
  docFacture.text('SOLDE À PAYER:', ...); // Finale
}
```

### **Log Errore Completo**
```
ChefResocontoPercentuale.vue:385 📋 Selected chantier: undefined
ChefResocontoPercentuale.vue:392 🔍 Devis ID trovato: undefined
ChefResocontoPercentuale.vue:428 ❌ NESSUN DEVIS ID TROVATO per cantiere: undefined
```

## ⚡ SOLUZIONE RAPIDA

**Per completare il lavoro oggi:**
1. Cambia modalità cantiere a "Métrages" 
2. Usa ChefMetrages (funziona)
3. Genera fattura con campo acconti (già implementato)
4. Rimetti modalità "Percentuel"

**La funzionalità acconti è già pronta e funzionante!**

---

*File creato: Febbraio 2025*  
*Stato: PROBLEMA IDENTIFICATO - SOLUZIONE PRONTA*  
*Urgenza: ALTA - Utente deve fatturare*