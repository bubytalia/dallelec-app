# 🐛 PROBLEMA CALCOLO FATTURA RESOCONTO FINALE

## 📊 SITUAZIONE ATTUALE

**Fattura F2026-009 - Resoconto Finale Zona Chaufferie**

### 3 VALORI DIVERSI:

1. **PDF FATTURA**: 6113.49 CHF ✅ CORRETTO
   - Montant des metrages finaux: 18452.05 CHF
   - Deja facture: -12796.65 CHF
   - A facturer: 5655.40 CHF
   - SOLDE À PAYER: 6113.49 CHF

2. **ANTEPRIMA (Modal)**: 5717.84 CHF ❌ SBAGLIATO
   - Valeur réelle: 18086.05 CHF
   - Acompte: -12796.65 CHF
   - À FACTURER: 5289.40 CHF
   - TOTAL TTC: 5717.84 CHF

3. **TABELLA FATTURE**: 5717.84 CHF ❌ SBAGLIATO
   - Mostra il valore salvato nel database

### DIFFERENZA:
- **366 CHF** di differenza nell'HT (18452.05 - 18086.05)
- **395.65 CHF** di differenza nel TTC (6113.49 - 5717.84)

---

## 🔍 CAUSA DEL PROBLEMA

### IL PDF CALCOLA CORRETTAMENTE:
```javascript
// File: AdminFacturation.vue - Riga ~3010
// Nel PDF per resoconti finali:
let totalSuppl = 0;
if (item.supplements && Array.isArray(item.supplements)) {
  totalSuppl = item.supplements.reduce((sum, supp) => {
    const totalMLSupp = Number(supp.totalML || 0);
    if (totalMLSupp > 0) {
      return sum + totalMLSupp;
    }
    const qte = Number(supp.qte || supp.qtePosee || 0);
    const valeur = Number(supp.valeur || 0);
    return sum + (qte * valeur); // ✅ FALLBACK FUNZIONA
  }, 0);
}
```

### L'ANTEPRIMA CALCOLA MALE:
```javascript
// File: AdminFacturation.vue - Riga ~1420
// Funzione getValoreRealeZona() - MODIFICATA MA NON FUNZIONA
const getValoreRealeZona = (zone) => {
  // ... stesso codice del PDF con fallback qte × valeur
  // MA NON VIENE ESEGUITO CORRETTAMENTE
}
```

### IL DATABASE SALVA IL VALORE SBAGLIATO:
```javascript
// File: AdminFacturation.vue - Riga ~1650
// Funzione approuverResoconto()
const montantHT = calculateTotalHT(); // ❌ USA getValoreRealeZona() che calcola male
montantTTCFattura = montantHTFattura * 1.081; // ❌ Salva valore sbagliato
```

---

## 🎯 SOLUZIONE

### OPZIONE 1: Far funzionare getValoreRealeZona()
Il codice è corretto ma non viene eseguito dal browser (cache? Vite non ricompila?).

**Provato:**
- ✅ Modificato getValoreRealeZona() con fallback qte × valeur
- ✅ Riavviato npm run dev multiple volte
- ✅ Svuotato cache browser
- ✅ Cancellato node_modules\.vite
- ✅ Provato con browser diverso
- ❌ **NON FUNZIONA** - l'anteprima mostra sempre 18086.05

### OPZIONE 2: Usare lo stesso calcolo del PDF (CONSIGLIATA)
Modificare `approuverResoconto()` per calcolare il montantHT usando lo stesso codice del PDF invece di `calculateTotalHT()`.

**Codice da modificare:**
```javascript
// File: AdminFacturation.vue - Riga ~1650
// INVECE DI:
const montantHT = calculateTotalHT(); // ❌ Usa getValoreRealeZona()

// FARE:
const montantHT = calcolaDirettamenteDaProdottiReali(); // ✅ Come il PDF
```

### OPZIONE 3: Creare funzione unificata
Estrarre il calcolo del PDF in una funzione separata e usarla sia nel PDF che nell'anteprima.

---

## 📝 DATI TECNICI

### Resoconto nel database:
- ID: 31
- Chantier: EM_CE_CDC ET CANAUX (ID: 8)
- Devis: DEV-951641 (ID: 50)
- Type: resoconto_finale
- Zone: chaufferie (100%)

### Prodotti (esempio dal PDF):
```
A01100X60: 77 ML + 30 suppl = 107 ML × 16.80 = 1797.60 CHF
A01200X60: 57 ML + 66 suppl = 123 ML × 17.60 = 2164.80 CHF
A01400X60: 354 ML + 189.5 suppl = 543.5 ML × 19.80 = 10761.30 CHF
...
TOTALE: 18452.05 CHF
```

### Supplementi:
I supplementi sono salvati come:
- `qte` o `qtePosee`: numero di pezzi (es: 30 coude)
- `valeur`: metri per pezzo (es: 1 ML)
- `totalML`: qte × valeur (DOVREBBE essere salvato ma NON c'è nei dati)

---

## 🔧 MODIFICHE GIÀ FATTE

1. ✅ Corretto `approuverResoconto()` per salvare `acconti_precedenti = 0` per resoconti finali
2. ✅ Modificato `getValoreRealeZona()` con fallback `qte × valeur`
3. ✅ Modificato `ChefResocontoFinale.vue` per salvare `totalML` nei supplementi
4. ❌ **NON FUNZIONA** - il browser non usa il codice aggiornato

---

## 🎬 PROSSIMI PASSI

1. **Verificare** perché getValoreRealeZona() non viene eseguito con il codice aggiornato
2. **Modificare** approuverResoconto() per usare lo stesso calcolo del PDF
3. **Testare** con una nuova fattura
4. **Commit** e deploy in produzione

---

## 📌 FILE COINVOLTI

- `src/views/AdminFacturation.vue` (principale)
  - Riga ~1420: getValoreRealeZona()
  - Riga ~1500: calculateTotalTravaux()
  - Riga ~1650: approuverResoconto()
  - Riga ~3010: Generazione PDF resoconti finali

- `src/views/ChefResocontoFinale.vue`
  - Salvataggio prodotti_reali con supplementi

---

**Data**: 12/02/2026  
**Sessione**: Token esauriti - continuare in nuova chat
