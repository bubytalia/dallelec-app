# 🔄 RIPRISTINO LIMITE ORE - ISTRUZIONI URGENTI

## ⚠️ MODIFICA TEMPORANEA ATTIVA

**Data modifica**: Dicembre 2024  
**Motivo**: Permettere inserimento ore complete del mese corrente  
**Stato**: ⚠️ TEMPORANEO - DA RIPRISTINARE A FINE MESE  

## 🎯 COSA È STATO MODIFICATO

- **PRIMA**: Limite 2 giorni per inserimento ore
- **ADESSO**: Permesso inserimento per tutto il mese corrente
- **FILE MODIFICATI**: OuvrierHeures.vue, ChefHeures.vue

## 🔧 PROCEDURA RIPRISTINO (FINE MESE)

### 1. File da modificare:
- `src/views/OuvrierHeures.vue`
- `src/views/ChefHeures.vue`

### 2. In OuvrierHeures.vue:
**Sostituire la funzione `isDateBlocked` (linea ~35) con:**
```javascript
const isDateBlocked = (date) => {
  if (!date) return false;
  const selectedDate = new Date(date);
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);
  
  return selectedDate < twoDaysAgo && !adminOverride.value;
};
```

### 3. In ChefHeures.vue:
**Sostituire la funzione `isDateBlocked` (linea ~180) con:**
```javascript
const isDateBlocked = (date) => {
  if (!date) return false;
  const selectedDate = new Date(date);
  const today = new Date();
  const diffTime = today - selectedDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 2;
};
```

### 4. Deploy modifiche:
```bash
git add .
git commit -m "Ripristino limite 2 giorni per inserimento ore"
git push origin fix-produits-devis
```

### 5. Pulizia documentazione:
- Eliminare questo file: `RIPRISTINO_LIMITE_ORE.md`
- Rimuovere sezione "MODIFICA TEMPORANEA SISTEMA ORE" da `PROGRESS_REPORT.md`
- Rimuovere sezione "ISTRUZIONI RIPRISTINO" da `PROGRESS_REPORT.md`

## ✅ VERIFICA POST-RIPRISTINO

Dopo il ripristino, verificare che:
- [ ] Ouvriers non possano inserire ore > 2 giorni fa
- [ ] Chef non possano inserire ore > 2 giorni fa  
- [ ] Admin override continui a funzionare
- [ ] Messaggio di errore appaia per date bloccate

## 📞 SUPPORTO

In caso di problemi durante il ripristino:
- Controllare la sintassi JavaScript
- Verificare che le funzioni siano nella posizione corretta
- Testare in locale prima del deploy

---

**⚠️ IMPORTANTE**: Questo file deve essere eliminato dopo il ripristino!