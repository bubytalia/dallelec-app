# 🚨 TODO - PDF RESOCONTI PERCENTUALI

## 📋 PROBLEMA IDENTIFICATO

**Data**: Febbraio 2025  
**Stato**: ⚠️ DA RISOLVERE  

### **Situazione Attuale**
- ✅ **PDF Métrages détaillés**: Funziona correttamente
- ❌ **PDF Resoconti percentuali**: Da rifare completamente

### **Problema Specifico**
Il sistema di generazione PDF in `AdminFacturation.vue` è ottimizzato per métrages détaillés ma non gestisce correttamente i resoconti percentuali che hanno una struttura dati diversa.

## 🔧 ANALISI TECNICA

### **Differenze Struttura Dati**

#### **Métrages Détaillés**
```javascript
{
  items: [
    {
      article: "...",
      nom: "...",
      zone: "...",
      mlPosee: 123.45,
      supplements: [...]
    }
  ],
  regies: [...]
}
```

#### **Resoconti Percentuali**
```javascript
{
  avancementi: {
    "1 SS -2": 100,
    "2 SS-1": 100, 
    "3 Mezzanine": 40
  },
  regies: [
    {
      zone: "3 Mezzanine",
      heures: 24,
      prixHeure: 65,
      description: "installation de supports..."
    }
  ]
}
```

## 🎯 SOLUZIONE NECESSARIA

### **1. Nuovo Template PDF per Resoconti Percentuali**
Creare un template specifico che mostri:
- **Avanzamenti per zona** con percentuali
- **Calcolo importi** basato su percentuali del devis totale
- **Régies détaillées** con ore e descrizioni
- **Totali corretti** (lavori + régies + TVA)

### **2. Modifiche in AdminFacturation.vue**
Nella funzione `genererPDF()`:
- Rilevare se è un resoconto percentuale
- Usare template diverso per il calcolo
- Gestire correttamente i dati percentuali

### **3. Calcoli Specifici**
```javascript
// Per resoconti percentuali
const totalPercentuali = Object.values(resoconto.avancementi).reduce((sum, pct) => sum + pct, 0);
const montantTravauxHT = devisTotal * (totalPercentuali / 100);
const montantRegiesHT = regies.reduce((sum, r) => sum + (r.heures * r.prixHeure), 0);
```

## 📁 FILE COINVOLTI

### **Principale**
- `src/views/AdminFacturation.vue` - Funzione `genererPDF()`

### **Supporto**
- Verificare struttura dati in `resoconti_percentuali` table
- Template PDF specifico per percentuali

## 🚀 PRIORITÀ

**ALTA** - Il PDF è essenziale per la fatturazione dei resoconti percentuali.

## 💡 NOTE IMPLEMENTAZIONE

1. **Mantenere** il PDF métrages détaillés funzionante
2. **Aggiungere** logica condizionale per tipo documento
3. **Testare** con il resoconto esistente (24h régies, zone completate)
4. **Verificare** calcoli TVA Svizzera (8.1%)

## 🔍 TEST CASE

**Resoconto Test**:
- Chantier: "Halle et stock - Mikron"
- Avanzamenti: 1 SS -2 (100%), 2 SS-1 (100%), 3 Mezzanine (40%)
- Régies: 24h zona 3 Mezzanine @ 65 CHF/h
- Descrizione: "installation de supports de renforcement"

---

*Creato: Febbraio 2025*  
*Stato: TODO per prossima sessione*  
*Priorità: ALTA*