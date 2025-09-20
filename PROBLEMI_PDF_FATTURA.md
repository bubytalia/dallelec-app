# 🚨 PROBLEMI PDF FATTURA - SESSIONE 02/02/2025

## 📋 STATO ATTUALE
- **Anteprima fattura**: Funziona perfettamente (calcola 27750.54 CHF)
- **PDF generato**: Ha diversi errori nonostante usi "la stessa logica"

## 🔴 PROBLEMI IDENTIFICATI

### **1. COLONNA "TOTAL ZONE" SEMPRE A 0.00 CHF**
**Problema**: La colonna dovrebbe mostrare l'importo totale del devis per ogni zona
- Attuale: `0.00 CHF` per tutte le zone
- Dovrebbe essere: Importo devis su cui si calcola la percentuale
- **Causa**: `chantierDevis.produits` nel PDF non ha la stessa struttura dell'anteprima

### **2. ACCONTO NON VIENE LETTO**
**Problema**: Il campo "Acconti già fatturati" non viene considerato nel PDF
- Attuale: `accontiPrecedentiResoconto.value` = 0 nel PDF
- Dovrebbe essere: 10000 CHF come inserito nel modal
- **Causa**: Scope diverso tra modal e funzione PDF

### **3. ERRORI DICHIARAZIONI VARIABILI**
**Problema**: Variabili dichiarate multiple volte
- `accontiHT` dichiarata 2-3 volte in scope diversi
- `totalTravauxHT` non definita quando usata
- **Causa**: Modifiche incrementali senza visione d'insieme

### **4. LAYOUT E TRADUZIONI**
**Problema**: Testi in italiano e layout non ottimale
- "Imponibile residuo" → dovrebbe essere "Montant net HT"
- Box troppo piccolo per 4 righe di calcolo
- Numero TVA duplicato (header + footer)

## 🎯 SOLUZIONE SUGGERITA

### **Approccio Corretto**
1. **Copiare ESATTAMENTE** la logica dell'anteprima che funziona
2. **Non riscrivere** i calcoli nel PDF
3. **Usare le stesse funzioni** (`calculateZoneMontant`, `calculateTotalHT`, ecc.)
4. **Passare correttamente** il valore degli acconti dal modal al PDF

### **File da Modificare**
- `AdminFacturation.vue` - Funzione `genererPDF()`
- Linee circa 1500-1700 (sezione PDF resoconto percentuale)

### **Test da Fare**
1. Verificare che `detailResoconto.value` sia impostato correttamente nel PDF
2. Verificare che `accontiPrecedentiResoconto.value` abbia il valore inserito
3. Usare `calculateZoneMontant()` invece di riscrivere la logica
4. Debug con `console.log` per vedere i valori reali

## 💡 NOTA FINALE
Il problema principale è che stiamo **riscrivendo logica che già funziona** invece di **riutilizzare quello che funziona**. L'anteprima calcola tutto correttamente, il PDF dovrebbe solo formattare gli stessi dati.

---
**Creato**: 02/02/2025  
**Sessione**: Correzioni PDF Fatturazione  
**Stato**: Problemi identificati, soluzione da implementare