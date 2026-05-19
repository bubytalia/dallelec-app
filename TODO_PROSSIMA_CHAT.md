# TODO - Prossima Chat

## 1. Filtri `type != 'interne'` per escludere cantiere Bureau

Aggiungere il filtro nelle seguenti pagine per non mostrare i cantieri con `type = 'interne'`:

- **AdminFacturation.vue** - nella lista cantieri per fatturazione
- **AdminBilanChantiers.vue** - nel bilan chantiers
- **AdminMetragesSelection.vue** - nella selezione cantiere per métrages
- **AdminMetrages.vue** - métrages détaillés
- **AdminRilevamento.vue** - relevé chantier
- **AdminResocontoFinale.vue** - rapport final
- **AdminResocontoPercentuale.vue** - resoconto percentuale
- **AdminAssocierDevis.vue** - associer devis
- **ChefHeures.vue** - selezione cantiere per chef (inserimento ore)
- **OuvrierHeures.vue** - selezione cantiere per ouvrier (inserimento ore)
- **ChefChantiers.vue** - lista cantieri chef

Il filtro da aggiungere nelle query Supabase: `.neq('type', 'interne')` oppure filtrare lato client con `.filter(c => c.type !== 'interne')`

**NOTA**: NON filtrare in AdminMonitoringHeures.vue e AdminBilanMensuel.vue — le ore su Bureau devono contare nel bilan personnel.

## 2. Nuova pagina "Coûts Bureau"

Creare `/admin/couts-bureau` con:

### Dati da mostrare (mese per mese):
- Per ogni persona che ha lavorato su cantiere "Bureau":
  - Nome
  - Ore lavorate nel mese su Bureau
  - Coût horaire (da `collaborateurs.cout_horaire` o `chefdechantiers.cout_horaire`)
  - Coût total = ore × coût horaire
- Totale mensile ufficio

### Query per trovare le ore Bureau:
```js
// Trovare l'ID del cantiere Bureau
const { data: bureau } = await supabase.from('chantiers').select('id').eq('type', 'interne');
const bureauIds = bureau.map(b => b.id);

// Ore chef su Bureau
const { data: heuresChef } = await supabase.from('heures_chef_propres').select('*')
  .in('chantier_id', bureauIds).gte('date', startDate).lte('date', endDate);

// Ore ouvrier su Bureau  
const { data: heuresOuv } = await supabase.from('heures_ouvriers').select('*')
  .in('chantier_id', bureauIds).gte('date', startDate).lte('date', endDate);
```

### Funzionalità:
- Selezione mese
- Tableau récapitulatif per persona
- Totale costi ufficio
- PDF mensile
- Eventualmente storico annuale

### Route:
- Aggiungere in `router/index.js`
- Aggiungere link nel dashboard admin (sezione Financier o Administration)

## 3. Note tecniche

- Branch deploy: `fix-produits-devis`
- Database: Supabase (aumhdoiwtichjlvbrnrl.supabase.co)
- La colonna `type` nella tabella `chantiers` è già creata (default 'chantier', Bureau ha 'interne')
- I costi orari sono in `collaborateurs.cout_horaire` e `chefdechantiers.cout_horaire`

## 4. Bug/miglioramenti minori da verificare

- Rimuovere i `console.log` di debug dal monitoring heures (SAVE EDIT, DEBUG heures, etc.)
- Verificare che il calcolo del Bilan Mensuel non sia troppo lento (calcola da gennaio ogni volta)
- La pagina Solde Vacances ora è in sola lettura (i dati vengono dal Bilan Mensuel)
