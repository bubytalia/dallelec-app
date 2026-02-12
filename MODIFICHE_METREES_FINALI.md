# 🔧 MODIFICHE MÉTRÉES FINALI CON ACCONTI MANUALI

**Data**: 11 Febbraio 2025  
**Problema**: Gestione acconti manuali nelle métrées finali

---

## 🎯 SCENARIO

Cantiere grande **EM_A4_CDC ET CANAUX** con:
- **3 zone**: SS, REZ, rez+2
- **Acconti manuali** già fatturati (sistema non era pronto)
- **Métrées finali** solo per zone terminate
- Necessità di **sottrarre acconti** dalla fattura finale

---

## 🔧 MODIFICHE EFFETTUATE

### **1. ChefResocontoFinale.vue**

#### Problema 1: Pulsante invio scompariva dopo salvataggio zona
**Fix**: Rimosso `v-if="selectedZone"` dal div azioni
```vue
<!-- PRIMA -->
<div v-if="selectedZone" class="text-center">
  <button>Ajouter zone</button>
  <button v-if="zoneSelezionate.length > 0">Envoyer</button>
</div>

<!-- DOPO -->
<div class="text-center">
  <button v-if="selectedZone">Ajouter zone</button>
  <button v-if="zoneSelezionate.length > 0">Envoyer</button>
</div>
```

#### Problema 2: Colonna `zone_details` non esistente
**Fix**: Rimossa dal salvataggio database
```javascript
// RIMOSSO
zone_details: zoneSelezionate.value,
```

#### Problema 3: Perdita dati al refresh
**Fix**: Aggiunto backup automatico in localStorage
```javascript
// Salva in localStorage quando aggiungi zona
localStorage.setItem('resoconto_draft', JSON.stringify({
  chantierId: selectedChantierId.value,
  zone: zoneSelezionate.value,
  timestamp: new Date().toISOString()
}));

// Recupera al mount
if (draft && confirm('Récupérer le brouillon précédent?')) {
  // Ripristina dati
}
```

---

### **2. AdminFacturation.vue**

#### Problema: Acconti inseriti non venivano salvati
**Fix**: Semplificato sistema acconti

**PRIMA** (complicato):
- Campo separato per ogni zona
- Calcolo somma totale
- Confusione nell'inserimento

**DOPO** (semplice):
```vue
<label>Acconti già fatturati (CHF HT):</label>
<input v-model.number="accontiPrecedentiResoconto" 
       type="number" step="0.01" class="form-control">
<small>Importo HT totale da sottrarre (somma di tutti gli acconti)</small>
```

**Calcolo**:
```javascript
const totalAccontiZone = computed(() => {
  return Number(accontiPrecedentiResoconto.value || 0);
});
```

**Salvataggio nella fattura**:
```javascript
acconti_precedenti: accontiInseriti, // Ora viene salvato correttamente
```

---

## 📋 PROCEDURA OPERATIVA

### **Per il Chef**

1. Vai in **"Rapport Final de Zone"**
2. Seleziona cantiere **EM_A4_CDC ET CANAUX**
3. Per ogni zona terminata:
   - Seleziona zona (es: SS)
   - Inserisci quantità reali posate
   - Click **"Ajouter cette zone au rapport"**
4. Quando hai aggiunto tutte le zone terminate
5. Click **"Sauvegarder et envoyer pour approbation (3 zones)"**

### **Per l'Admin**

1. Vai in **"Gestion Facturation"**
2. Vedi il resoconto in attesa
3. Click **👁** per vedere dettagli
4. **Inserisci acconti manuali**:
   - Esempio: 2 acconti da 5000 CHF TTC
   - 5000 TTC = 4625 HT
   - **Inserisci**: 9250 CHF HT
5. L'anteprima mostra:
   ```
   Total HT:           55.628,60 CHF
   Acconti HT:         -9.250,00 CHF
   Imponibile residuo: 46.378,60 CHF
   TVA (8.1%):          3.756,67 CHF
   SOLDE À PAYER:      50.135,27 CHF
   ```
6. Click **"✅ Approuver"**
7. Fattura generata con acconti sottratti

---

## 📄 PDF GENERATI

**2 documenti**:

1. **Métrées Détaillées** (per tecnico)
   - Quantità posate per prodotto
   - Supplementi dettagliati
   - Régies
   - Prezzi per controllo

2. **Facture** (per contabilità)
   - Totale lavori HT
   - **Sottrazione acconti precedenti**
   - TVA sul residuo
   - **SOLDE À PAYER**

---

## ✅ VANTAGGI

- ✅ **Flessibilità**: Inserisci qualsiasi importo di acconti manuali
- ✅ **Semplicità**: Un solo campo invece di uno per zona
- ✅ **Calcolo automatico**: TVA solo sul residuo
- ✅ **PDF professionale**: Acconti chiaramente visibili
- ✅ **Backup automatico**: Dati salvati in localStorage
- ✅ **Zone multiple**: Gestisci più zone in un unico resoconto

---

## 🔍 ESEMPIO PRATICO

**Cantiere**: EM_A4_CDC ET CANAUX  
**Zone terminate**: SS, REZ, rez+2  
**Acconti manuali**: 49.014,12 CHF HT

**Calcolo fattura**:
```
Valore reale lavori:
- SS:     15.315,30 CHF
- REZ:    15.071,60 CHF  
- rez+2:  25.241,70 CHF
─────────────────────────
Total HT: 55.628,60 CHF

Acconti HT: -49.014,12 CHF
─────────────────────────
Imponibile residuo: 6.614,48 CHF
TVA (8.1%): 535,77 CHF
═════════════════════════
SOLDE À PAYER: 7.150,25 CHF
```

---

## ⚠️ NOTE IMPORTANTI

- **Acconti in HT**: Inserisci sempre importo HT (senza TVA)
- **Calcolo TTC → HT**: Dividi per 1.081 (es: 5000 / 1.081 = 4625)
- **Backup automatico**: Dati salvati ogni volta che aggiungi una zona
- **Recupero draft**: Al refresh, sistema chiede se recuperare dati

---

*Sistema aggiornato e funzionante per gestione acconti manuali*
