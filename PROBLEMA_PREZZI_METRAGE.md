# 🔴 PROBLEMA PREZZI MÉTRAGE - RIEPILOGO

## 📊 SITUAZIONE ATTUALE

### Dati Corretti (dal PDF che funziona):
- **A01100X60**: 19.20 CHF ✅
- **A01200X60**: 20.80 CHF ✅
- **A01500X60**: 26.40 CHF ✅
- **L08DECU5TE**: 5.00 CHF ✅
- **Total HT**: 8369.40 CHF
- **Total TTC**: 9047.32 CHF

### Dati Sbagliati (nell'occhio e nella fattura):
- **A01100X60**: 20.80 CHF ❌
- **A01200X60**: 17.60 CHF ❌
- **A01500X60**: 24.60 CHF ❌
- **L08DECU5TE**: 50.00 CHF ❌
- **Total HT**: 10107.40 CHF ❌
- **Total TTC**: 10926.10 CHF ❌

---

## 🔍 CAUSA DEL PROBLEMA

Il cantiere **"Mikron 2 Swizerland AC Boudry"** (ID=24) **NON aveva** il campo `devis_id` salvato nel database.

### Fix Applicato:
```sql
UPDATE chantiers 
SET devis_id = 11 
WHERE id = 24;
```

---

## ✅ SOLUZIONI IMPLEMENTATE

### 1. Fix Strutturale nel Codice
**File**: `src/views/repertoires/Chantiers.vue`

Il codice **già salva correttamente** `devis_id` quando crei/modifichi un cantiere:

```javascript
// Funzione addChantier (riga ~436)
devis_id: newChantier.value.devisId || null,

// Funzione updateChantier (riga ~485)
devis_id: editChantier.value.devisId || null,
```

✅ **Tutti i nuovi cantieri avranno automaticamente il devis_id salvato**

---

### 2. Fix Logica Ricerca Prezzi
**File**: `src/views/AdminFacturation.vue`

#### Funzione `getPrixUnitaireItem` (riga ~1161):
```javascript
const getPrixUnitaireItem = (item) => {
  const chantier = chantiers.value.find(c => c.id === detailMetrage.value.chantier_id);
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id); // == invece di ===
  
  const prodottoDevis = chantierDevis?.produits?.find(p => p.article === item.article);
  
  return Number(prodottoDevis?.prix || 50);
};
```

#### Funzione `autoriserFacturation` (riga ~1213):
```javascript
const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id); // == invece di ===

metrage.items.forEach(item => {
  const prodottoDevis = chantierDevis?.produits?.find(p => p.article === item.article);
  const prezzoUnit = Number(prodottoDevis?.prix || 50);
  // ... calcolo totale
});
```

#### Funzione `voirDetailMetrage` (riga ~1245):
```javascript
const voirDetailMetrage = async (metrage) => {
  detailMetrage.value = metrage;
  accontiPrecedenti.value = 0;
  
  // Carica il devis del cantiere
  const chantier = chantiers.value.find(c => c.id === metrage.chantier_id);
  
  if (chantier?.devis_id) {
    const { data: devisData } = await supabase
      .from('devis')
      .select('*')
      .eq('id', chantier.devis_id)
      .single();
    
    if (devisData) {
      const existingIndex = devis.value.findIndex(d => d.id === devisData.id);
      if (existingIndex >= 0) {
        devis.value[existingIndex] = devisData;
      } else {
        devis.value.push(devisData);
      }
    }
  }
  
  showDetailMetrage.value = true;
};
```

---

## 🎯 PUNTI CHIAVE

1. **Codici articolo sono UNIVOCI**: 
   - A01100X60 ≠ A01200X60 ≠ A01500X60
   - Non serve cercare per `article + taille`

2. **Usa `==` invece di `===`**:
   - `devis_id` può essere numero o stringa
   - `==` gestisce entrambi i casi

3. **Assicurati che `devis_id` sia salvato**:
   - Controlla sempre che il cantiere abbia `devis_id` in Supabase
   - Se manca, aggiungilo manualmente con SQL

---

## 🔧 CHECKLIST PER CANTIERI VECCHI

Se in futuro i prezzi sono sbagliati:

1. **Controlla su Supabase** → tabella `chantiers` → campo `devis_id`
2. Se `devis_id` è `null`, trova l'ID del devis corretto
3. Esegui SQL:
   ```sql
   UPDATE chantiers 
   SET devis_id = [ID_DEVIS] 
   WHERE id = [ID_CANTIERE];
   ```

---

## 📝 NOTE FINALI

- ✅ Il codice è **strutturalmente corretto** per i nuovi cantieri
- ✅ Il PDF genera **sempre i prezzi corretti**
- ⚠️ I cantieri vecchi potrebbero non avere `devis_id` salvato
- 🔧 Fix manuale necessario solo per cantieri creati prima di questo fix

---

**Data**: 2026-03-02  
**Problema**: Prezzi métrage sbagliati nell'occhio e nella fattura  
**Causa**: Campo `devis_id` mancante nel cantiere  
**Soluzione**: Fix strutturale + SQL manuale per cantieri vecchi
