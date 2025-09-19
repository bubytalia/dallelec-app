# 🧹 PIANO PULIZIA SISTEMA DALLELEC
*Creato: 02 Febbraio 2025*

## 🎯 OBIETTIVO
Pulire il sistema ibrido Firebase/Supabase per renderlo consistente e manutenibile.

## 📊 STATO ATTUALE
- ❌ **Sistema ibrido**: Firebase + Supabase
- ❌ **main.js**: Usa Firebase
- ❌ **Componenti**: Misti (alcuni Firebase, alcuni Supabase)
- ❌ **Composables**: Duplicati e inconsistenti

## 🗺️ PIANO COMPLETO

### ✅ **STEP 1: UNIFICARE DATABASE** (QUESTA CHAT)
**Obiettivo**: Solo Supabase, eliminare Firebase dal core
**File da modificare**:
- `src/main.js` → Solo Supabase
- Testare che il sistema si avvii

### ✅ **STEP 2: STANDARDIZZARE AUTH** (COMPLETATO)
**Obiettivo**: Un solo sistema autenticazione
**File modificati**:
- ✅ `src/composables/useAuth.js` → Convertito a Supabase
- ✅ `src/views/Login.vue` → Usa useAuth unificato
- ⏳ Rimuovere `src/firebase.js` (prossimo step)

### ✅ **STEP 3: PULIRE COMPONENTI REPERTOIRES** (COMPLETATO)
**Obiettivo**: Tutti i repertoires solo Supabase
**File verificati**:
- ✅ `src/views/repertoires/Clients.vue` - Già Supabase
- ✅ `src/views/repertoires/Produits.vue` - Già Supabase
- ✅ `src/views/repertoires/Chantiers.vue` - Già Supabase
- ✅ `src/views/repertoires/Supplements.vue` - Già Supabase
- ✅ Tutti i repertoires già convertiti!

### ✅ **STEP 4: SISTEMA DEVIS** (COMPLETATO)
**Obiettivo**: Devis completamente Supabase
**File verificati**:
- ✅ `src/views/devis/DevisList.vue` - Già Supabase
- ✅ `src/views/devis/DevisCreate.vue` - Già Supabase
- ✅ `src/views/devis/DevisProduits.vue` - Già Supabase
- ✅ Tutto il sistema devis già convertito!

### ✅ **STEP 5: PULIZIA FINALE** (COMPLETATO)
**Obiettivo**: Rimuovere file Firebase non necessari
**File puliti**:
- ✅ `src/components/ProduitFormMetrages.vue` - Convertito a Supabase
- ✅ Rimossi file Firebase obsoleti
- ✅ Sistema completamente unificato su Supabase

## 📋 CHECKLIST STEP 1 (ATTUALE)

### ✅ COMPLETATO
- [x] Creato piano dettagliato
- [x] Modificato `src/main.js` → Solo Supabase
- [x] Rimosso Firebase dal core sistema
- [x] Sistema ora usa solo Supabase

### ⏳ DA FARE (PROSSIME CHAT)
- [ ] Verificare Login funziona
- [ ] Testare repertoires esistenti
- [ ] Procedere con Step 2

## 🚨 NOTE IMPORTANTI PER PROSSIME CHAT

### **STATO SISTEMA**
- **Database**: Solo Supabase (aumhdoiwtichjlvbrnrl.supabase.co)
- **main.js**: Modificato per Supabase
- **Login**: Potrebbe essere temporaneamente rotto (da sistemare Step 2)

### **COSA NON TOCCARE**
- File `.env` (contiene credenziali corrette)
- File `src/supabase.js` (configurazione corretta)
- Componenti che funzionano bene

### **PROSSIMO STEP**
Quando riprendi, inizia con **STEP 2: STANDARDIZZARE AUTH**
- Obiettivo: Far funzionare il login con Supabase
- File: `src/composables/useAuth.js` e `src/views/Login.vue`

## 📊 PROGRESS TRACKER
- **Step 1**: ✅ COMPLETATO (02/02/2025) - Sistema unificato su Supabase
- **Step 2**: ✅ COMPLETATO (02/02/2025) - Autenticazione unificata su Supabase
- **Step 3**: ✅ COMPLETATO (02/02/2025) - Repertoires già puliti
- **Step 4**: ✅ COMPLETATO (02/02/2025) - Sistema devis già pulito
- **Step 5**: ✅ COMPLETATO (02/02/2025) - Pulizia finale completata

---
**IMPORTANTE**: Ogni chat deve aggiornare questo file con il progresso fatto!