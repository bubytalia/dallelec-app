# 🔧 PROBLEMA PREZZI OCCHIO MÉTRAGE - RISOLUZIONE

## 📋 SINTESI PROBLEMA

**Sintomo**: L'occhio (👁) del métrage "Mikron 2 Swizerland AC Boudry" mostra prezzi sbagliati (50.00 CHF per tutti i prodotti invece dei prezzi corretti dal devis).

**Causa**: Il devis ID 24 in Supabase contiene solo 1 prodotto invece di 10. I prodotti sono visibili nella pagina del devis ma NON sono salvati nel database.

---

## 🎯 SOLUZIONE IMMEDIATA

### Step 1: Salvare il devis in Supabase
1. Vai sulla pagina del devis: **DEV-596429** (Mikron 2)
2. Clicca sul pulsante **"Salva"** o **"Aggiorna Devis"**
3. Verifica che tutti i 10 prodotti siano salvati

### Step 2: Verificare il salvataggio
Esegui questo SQL in Supabase:
```sql
SELECT id, numero, jsonb_array_length(produits) as num_prodotti
FROM devis 
WHERE id = 24;
```

Deve mostrare: `num_prodotti = 10` (non 1)

### Step 3: Testare l'occhio
1. Torna su **AdminFacturation**
2. Ricarica la pagina (F5)
3. Clicca sull'occhio (👁) del métrage "Mikron 2"
4. Verifica i prezzi corretti:
   - A01100X60: **19.20 CHF** ✓
   - A01200X60: **20.80 CHF** ✓
   - A01500X60: **26.40 CHF** ✓
   - L08DECU5TE: **5.00 CHF** ✓

---

## 🔍 ANALISI DETTAGLIATA

### Problema 1: Devis ID sbagliato (RISOLTO)
**Situazione iniziale:**
- Cantiere "Mikron 2 Swizerland AC Boudry" aveva `devis_id = 11` (sbagliato)
- Cantiere "Halle et stock - Mikron Swizerland AC Boudry" aveva `devis_id = 24` (sbagliato)
- Entrambi puntavano a devis sbagliati

**Soluzione applicata:**
```sql
-- Corretto devis_id per Mikron 2
UPDATE chantiers 
SET devis_id = 24 
WHERE nom LIKE '%Mikron 2%';

-- Rimosso devis_id per Halle et stock (cantiere finito)
UPDATE chantiers 
SET devis_id = NULL 
WHERE nom LIKE '%Halle%';
```

### Problema 2: Devis incompleto in Supabase (DA RISOLVERE)
**Situazione attuale:**
- Nella pagina del devis si vedono **10 prodotti**
- In Supabase (tabella `devis`, id=24) c'è **solo 1 prodotto**:
  ```json
  [
    {
      "article": "ZREGIES00",
      "nom": "travaux en regie",
      "prix": 70,
      "zone": "Sous sol"
    }
  ]
  ```

**Causa:**
- I prodotti sono salvati solo in **localStorage** del browser
- NON sono stati salvati in Supabase
- Quando l'applicazione carica il devis da Supabase, trova solo 1 prodotto

**Impatto:**
- `getPrixUnitaireItem()` cerca il prodotto in `devis.value`
- Trova solo 1 prodotto (ZREGIES00)
- Non trova A01100X60, A01200X60, A01500X60, L08DECU5TE
- Usa il prezzo di default: 50.00 CHF

---

## 🛠️ MODIFICHE CODICE APPLICATE

### File: `AdminFacturation.vue`

#### 1. Ricaricamento devis quando si apre l'occhio
```javascript
const voirDetailMetrage = async (metrage) => {
  detailMetrage.value = metrage;
  accontiPrecedenti.value = 0;
  
  // FORZA ricaricamento devis da Supabase
  const chantier = chantiers.value.find(c => c.id === metrage.chantier_id);
  
  if (chantier?.devis_id) {
    const { data: devisData } = await supabase
      .from('devis')
      .select('*')
      .eq('id', chantier.devis_id)
      .single();
    
    if (devisData) {
      console.log('✅ Devis ricaricato:', devisData.id, 'Prodotti:', devisData.produits?.length);
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

#### 2. Logica prezzi (identica al PDF)
```javascript
const getPrixUnitaireItem = (item) => {
  const chantier = chantiers.value.find(c => c.id === detailMetrage.value.chantier_id);
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  
  // COPIA ESATTA LOGICA PDF
  const prodottoDevis = chantierDevis?.produits?.find(p => p.article === item.article);
  const prezzoUnit = Number(prodottoDevis?.prix || 50);
  
  return prezzoUnit;
};
```

---

## ✅ CHECKLIST VERIFICA

- [ ] Devis 24 salvato in Supabase con 10 prodotti
- [ ] SQL verifica: `num_prodotti = 10`
- [ ] Cantiere "Mikron 2" ha `devis_id = 24`
- [ ] Cantiere "Halle et stock" ha `devis_id = NULL`
- [ ] Occhio métrage mostra prezzi corretti (19.20, 20.80, 26.40, 5.00)
- [ ] PDF métrage mostra prezzi corretti
- [ ] Totale corretto: **9047.32 CHF** (non 10926.10 CHF)

---

## 🚨 PREVENZIONE FUTURA

### Problema: Devis non salvati in Supabase
**Sintomo**: Prodotti visibili nella pagina ma non nel database

**Verifica rapida**:
```sql
SELECT id, numero, jsonb_array_length(produits) as num_prodotti
FROM devis 
WHERE id = [ID_DEVIS];
```

**Soluzione**: Cliccare sempre "Salva" dopo aver modificato un devis

### Problema: Cantieri con devis_id sbagliato
**Sintomo**: Prezzi sbagliati nell'occhio e nel PDF

**Verifica rapida**:
```sql
SELECT c.id, c.nom, c.devis_id, d.numero as devis_numero
FROM chantiers c
LEFT JOIN devis d ON d.id = c.devis_id
WHERE c.nom LIKE '%[NOME_CANTIERE]%';
```

**Soluzione**: Aggiornare `devis_id` del cantiere con l'ID corretto

---

## 📊 DATI CORRETTI ATTESI

### Devis 24 - Mikron 2 Swizerland AC Boudry
**Prodotti (10 totali):**

**Zone: Rez**
- A01100X60 (100mm): 19.20 CHF/ML
- A01500X60 (500mm): 26.40 CHF/ML

**Zone: 1 er étage**
- A01100X60 (100mm): 19.20 CHF/ML
- A01400X60 (400mm): 24.40 CHF/ML
- D03A050X050 (50mm): 18.00 CHF/ML

**Zone: info**
- L08DECU5PO: 3.00 CHF/pc
- L08DECU5TE: 5.00 CHF/pc
- ZREGIES00: 75.00 CHF/h

**Zone: chaufferie**
- A01100X60 (100mm): 19.20 CHF/ML
- A01200X60 (200mm): 20.80 CHF/ML

**Total Devis**: 11531.60 CHF

---

## 🎯 PROSSIMI PASSI

1. ✅ **IMMEDIATO**: Salvare devis 24 in Supabase (cliccare "Salva")
2. ✅ **VERIFICA**: Eseguire SQL per confermare 10 prodotti
3. ✅ **TEST**: Ricaricare AdminFacturation e verificare prezzi occhio
4. ✅ **VALIDAZIONE**: Generare PDF e verificare totale 9047.32 CHF

---

**Data**: 2025-01-XX  
**Stato**: IN ATTESA DI SALVATAGGIO DEVIS  
**Priorità**: ALTA 🔴
