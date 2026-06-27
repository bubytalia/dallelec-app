# MODULO MATERIALI - Stato Lavoro 27/06/2026

## COSA È STATO FATTO

### Database (Supabase)
Tabelle create con prefisso `mat_`:
- `mat_fornitori` — anagrafica fornitori materiale
- `mat_articoli_fornitore` — catalogo articoli per fornitore (con campo `taille` aggiunto)
- `mat_distinte` — composizione materiali per articolo di posa (con campo `fornitore_id` aggiunto: ogni distinta è specifica per fornitore)
- `mat_maggiorazioni` — % scarto/gestione/guadagno (globali, ma nel devis sono specifiche per preventivo)
- `mat_offerte` — offerte ricevute dai fornitori
- `mat_offerte_prezzi` — prezzi articoli dentro un'offerta
- `mat_preventivi` — preventivi completi posa+materiali (con campo `fornitore_nome`)
- `mat_preventivi_righe` — righe dettaglio preventivo
- `mat_distinte_supplements` — composizione materiali per supplemento (per taille e fornitore)

### Pagine Vue (in `src/views/materiali/`)
- `MateriaDashboard.vue` — dashboard con 4 link
- `MateriaFornitori.vue` — CRUD fornitori
- `MateriaArticoliFornitore.vue` — CRUD articoli per fornitore (con campo taille, categoria a tendina auto-popolante)
- `MateriaDistinte.vue` — lista materiali per articolo di posa, con tab per fornitore e récapitulatif comparativo
- `MateriaSupplements.vue` — lista materiali per supplemento (per taille e fornitore)
- `MateriaPreventivi.vue` — devis matériaux completo (selezione devis → lista materiali → prezzi → maggiorazioni → calcolo → PDF)

### Router
Rotte aggiunte in `src/router/index.js` sotto sezione "Modulo Materiali (isolato)"

### Dashboard Admin
Aggiunta sezione viola "📦 Matériaux" in `AdminDashboard.vue`

### Backup
Script `utils/backup-completo-semplice.cjs` aggiornato con:
- Tutte le tabelle `mat_*` + `mat_distinte_supplements`
- Tabelle mancanti aggiunte: `planification`, `solde_vacances`, `primes_paiements`, `configurazione_fatture`

---

## FLUSSO OPERATIVO

1. **Fournisseurs** → inserisci fornitori + loro articoli (con codice, descrizione, taille, unité, catégorie)
2. **Liste Matériel par Article** → per ogni articolo di posa, per ogni fornitore, inserisci i componenti con quantità per unità
3. **Matériel Suppléments** → per ogni supplemento + taille + fornitore, inserisci i componenti con quantità per occorrenza
4. **Fai il devis di posa** (procedura classica esistente)
5. **Devis Matériaux** → selezioni il devis posa → il sistema genera la lista materiali (articoli base + supplementi) raggruppata per fornitore → esporti CSV → inserisci prezzi → imposti maggiorazioni → calcola → PDF cliente

---

## COSA RESTA DA FARE / MIGLIORARE

### Priorità alta
- [ ] **Testare i supplementi** nel flusso devis matériaux (la logica è implementata ma non ancora testata con dati reali)
- [ ] **PDF Client** — attualmente genera un PDF base; va completato per essere identico al formato classico (condizioni, firma, supplementi come righe con prezzo totale)
- [ ] **Quantità reali dal devis** — verificare che per devis con più articoli e più zone, le quantità siano corrette (attualmente prende `ml` o `totalML` dal JSON)

### Priorità media
- [ ] **Pagina Offerte** (rimossa come pagina separata) — valutare se serve un archivio offerte o se basta il flusso integrato nel devis matériaux
- [ ] **Confronto fornitori** — nella vista devis completi ci sono i tab per fornitore, ma potrebbe servire una vista affiancata per confrontare
- [ ] **Salvataggio prezzi** — attualmente i prezzi si perdono se si ricarica la pagina; valutare se salvarli in una tabella (es. `mat_offerte_prezzi`)
- [ ] **Import/Export Excel** — attualmente CSV con separatore `;`. Potrebbe servire formato .xlsx reale

### Priorità bassa
- [ ] Pulizia file `MateriaOfferte.vue` e `MateriaMaggiorazioni.vue` (rimasti nella cartella ma non più linkati nel router)
- [ ] Aggiungere validazione e messaggi di errore più dettagliati
- [ ] Responsive mobile

---

## NOTE TECNICHE

- I campi della tabella `produits` (listino posa) sono: `id, article, description, taille, unite, prix` (NON code/designation/prix_unitaire)
- Il devis salva i prodotti nel campo JSON `produits` con struttura: `{ article, nom, taille, unite, ml, totalML, prix, total, supplements: [{supplement, qte, qteTotale, valeur, taille}] }`
- La tabella `devis` NON ha `chantier_id`, usa il campo `nom` per il nome del cantiere
- Branch deploy: `fix-produits-devis`
- Tutto il modulo è isolato: non tocca nessun file/tabella esistente tranne `AdminDashboard.vue` (aggiunta sezione) e `router/index.js` (aggiunte rotte)
