# ✅ SOLUZIONE PROBLEMA CALCOLO FATTURA RESOCONTO FINALE

## 🎯 PROBLEMA RISOLTO

Il calcolo in `approuverResoconto()` ora funziona correttamente:
- ✅ Calcola **18452.05 CHF** (come il PDF)
- ✅ Sottrae acconti **12796.65 CHF**
- ✅ Risultato: **5655.40 CHF HT** → **6113.49 CHF TTC**

**Log console conferma**:
```
💰 TOTALE CALCOLATO: 18452.05 CHF
```

## ❌ PROBLEMA RIMASTO

La **tabella fatture** mostra ancora un valore sbagliato perché la funzione `calculateSoldeFinale()` (riga ~2350) ricalcola il totale in modo errato.

### CAUSA:
```javascript
// File: AdminFacturation.vue - Riga ~2350
const calculateSoldeFinale = (facture) => {
  const acconti = Number(facture.acconti_precedenti || 0);
  
  if (acconti === 0) {
    return Number(facture.montant_ttc || 0); // ✅ Questo funziona
  }
  
  // ❌ QUESTO RICALCOLA MALE per resoconti finali
  const montantHT = Number(facture.montant_ht || 0);
  const montantNetHT = montantHT - acconti;
  const tva = montantNetHT * 0.081;
  return montantNetHT + tva;
};
```

### DATI SALVATI NEL DATABASE:
Per resoconti finali, `approuverResoconto()` salva:
- `montant_ht` = **18452.05 CHF** (lordo)
- `acconti_precedenti` = **12796.65 CHF**
- `montant_ttc` = **6113.49 CHF** (già calcolato corretto)

### IL PROBLEMA:
`calculateSoldeFinale()` ricalcola:
- (18452.05 - 12796.65) × 1.081 = **6113.49 CHF** ✅

Ma se `montant_ttc` è già stato calcolato correttamente, dovrebbe usare quello direttamente!

## 🔧 SOLUZIONE

**Opzione 1**: `calculateSoldeFinale()` usa sempre `montant_ttc` per resoconti finali
```javascript
const calculateSoldeFinale = (facture) => {
  // Per resoconti finali, montant_ttc è già corretto
  return Number(facture.montant_ttc || facture.montantTTC || 0);
};
```

**Opzione 2**: Salva `acconti_precedenti = 0` per resoconti finali
```javascript
// In approuverResoconto() - riga ~1730
acconti_precedenti: 0,  // Invece di accontiDaSalvare
```
Così `calculateSoldeFinale()` usa direttamente `montant_ttc`.

## 📝 CODICE MODIFICATO

### File: `src/views/AdminFacturation.vue`

**Riga ~1650 - approuverResoconto()**: ✅ FUNZIONA
```javascript
// CALCOLA DIRETTAMENTE DAI PRODOTTI REALI (COPIA ESATTA DEL PDF)
if (resoconto.type === 'resoconto_finale' && resoconto.prodotti_reali) {
  resoconto.prodotti_reali.forEach(item => {
    const prodottoDevis = chantierDevis?.produits?.find(p => p.article === item.article);
    
    if (prodottoDevis) {
      const prezzoUnit = Number(prodottoDevis.prix || 50);
      const quantite = Number(item.mlReali || item.totalML || item.mlPosee || 0); // ✅ CORRETTO
      
      let totalSuppl = 0;
      if (item.supplements && Array.isArray(item.supplements)) {
        totalSuppl = item.supplements.reduce((sum, supp) => {
          const totalMLSupp = Number(supp.totalML || 0);
          if (totalMLSupp > 0) return sum + totalMLSupp;
          const qte = Number(supp.qte || supp.qtePosee || 0);
          const valeur = Number(supp.valeur || 0);
          return sum + (qte * valeur);
        }, 0);
      }
      
      const total = quantite + totalSuppl;
      montantHTFattura += total * prezzoUnit;
    }
  });
  
  // Aggiungi régies
  if (resoconto.regies?.length > 0) {
    const prixRegieChantier = chantier?.prix_regie || 75;
    resoconto.regies.forEach(regie => {
      montantHTFattura += Number(regie.heures || 0) * Number(regie.prixHeure || prixRegieChantier);
    });
  }
  
  // Salva acconti separati
  accontiDaSalvare = 0;
  Object.keys(resoconto.avancementi || {}).forEach(zona => {
    accontiDaSalvare += Number(accontiPerZona.value[zona] || 0);
  });
}

// Calcola TTC
let montantTTCFattura;
if (resoconto.type === 'resoconto_finale') {
  const nettoHT = montantHTFattura - accontiDaSalvare;
  montantTTCFattura = nettoHT * 1.081;
} else {
  const nettoHT = montantHTFattura - accontiDaSalvare;
  montantTTCFattura = nettoHT * 1.081;
}

// Salva nel database
await supabase.from('factures').insert([{
  montant_ht: montantHTFattura,        // 18452.05
  montant_ttc: montantTTCFattura,      // 6113.49
  acconti_precedenti: accontiDaSalvare // 12796.65
}]);
```

**Riga ~2350 - calculateSoldeFinale()**: ❌ DA CORREGGERE
```javascript
const calculateSoldeFinale = (facture) => {
  // SOLUZIONE: Usa sempre montant_ttc direttamente
  return Number(facture.montant_ttc || facture.montantTTC || 0);
};
```

## 🎬 PROSSIMI PASSI

1. Modifica `calculateSoldeFinale()` per usare sempre `montant_ttc`
2. Riavvia server: `Ctrl+C` → `npm run dev`
3. Riapri browser (Ctrl+Shift+R)
4. Elimina fattura sbagliata
5. Approva resoconto
6. Verifica tabella fatture: **6113.49 CHF** ✅

## 📊 VALORI ATTESI

| Dove | Valore Atteso |
|------|---------------|
| PDF Fattura | 6113.49 CHF ✅ |
| Tabella Fatture | 6113.49 CHF ❌ (da correggere) |
| Anteprima Modal | 5717.84 CHF ❌ (usa getValoreRealeZona che calcola male) |

**Nota**: L'anteprima usa `getValoreRealeZona()` che ha lo stesso problema (usa `mlPosee` invece di `mlReali`). Correggere anche quella (riga ~1420).

---

**Data**: 12/02/2026  
**Stato**: Calcolo approvazione ✅ | Visualizzazione tabella ❌
