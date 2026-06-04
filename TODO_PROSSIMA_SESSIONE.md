# TODO - Prossima Sessione

## 1. PRIMES NEI BILANCI CHANTIER
**Pagina:** `/admin/bilan-chantiers` (`src/views/AdminBilanChantiers.vue`)

**Cosa fare:**
- Caricare `primes_paiements` nel componente
- Aggiungere colonna "Primes payées" nella tabella bilan chantier
- Il premio pagato è un costo del cantiere → impatta la marge
- Dati da `primes_paiements`: per ogni `chantier_id`, sommare i `montant` pagati

## 2. PRIMES NEL RAPPORT MENSUEL (PDF COMMERCIALISTA)
**Pagina:** `/admin/report-mensuel` (`src/views/AdminReportMensuel.vue`)

**Cosa fare:**
- In calce al PDF, aggiungere una sezione "BONUS" per ogni dipendente (capocantiere)
- La sezione deve essere analitica per cantiere:
  - Nome chantier
  - Prime efficacité (montant)
  - Prime régies (montant)
  - Total prime
- Filtrare per `mois_paiement` corrispondente al mese del rapport
- Dati da `primes_paiements` + calcoli già presenti in `AdminPremi.vue`

## 3. COSE MINORI PENDENTI

### Client VIP - test completo
- Testare il flusso completo: login → creazione devis → salvataggio → invio
- Verificare che la pagina admin `/admin/devis-vip` funzioni
- Condizioni de vendita di default per il client VIP (non ancora implementato)

### PostgREST Schema Cache
- Le colonne `has_hors_devis`, `hors_devis_alert`, `updated_at` nella tabella `metrages` esistono ma PostgREST non le riconosce
- Sono state rimosse temporaneamente dal codice (`AdminRilevamento.vue`)
- Quando il cache si aggiorna (o dopo restart Supabase), si possono riaggiungere

### Debug logs da rimuovere
- `DevisProduits.vue`: log "🔍 VIP check", "📋 Listino VIP chargé", "🔍 Match VIP"
- Sono utili per debug ma andranno rimossi in produzione

## 4. RIEPILOGO MODIFICHE FATTE IN QUESTA SESSIONE

1. ✅ Fix rapport mensuel salari — ricalcolo forzato ogni volta
2. ✅ Devis non acceptés — nascosti di default con toggle
3. ✅ Listino VIP completo (tabella, pagina admin, % béton/DIN, prezzo_netto esclusi)
4. ✅ Integrazione VIP nei devis (popup scelta, prezzi auto, pulsante recalcul)
5. ✅ Espace Client VIP (/client) — dashboard, creazione devis, tutorial, multi-zone, modifica linea, suppléments
6. ✅ Separazione salvataggio/invio devis client VIP
7. ✅ Page admin Devis VIP con badge notification
8. ✅ Totali CDC — inclusi échelle, canale a grille, canal G
9. ✅ Jours travaillés (paniers) nel rapport mensuel
10. ✅ Fix "fabbriqué" → "fabriqué" (DB)
11. ✅ Monitoring heures — support multi-chantiers par jour
12. ✅ Virement bancaire = échéance à vue (0 jours)
13. ✅ Planificateur — vue multi-mois avec scroll horizontal
14. ✅ Relevé Chantier — traduzione + fix colonne manquantes

## 5. TABELLE DB AGGIUNTE/MODIFICATE

```sql
-- Tabelle create:
-- listino_vip (client_id, article, description, prix_beton, prix_din, pct_beton, pct_din)
-- accessi_vip (nom, prenom, email, client_id, actif)

-- Colonne aggiunte:
-- clients: vip, vip_pct_beton, vip_pct_din
-- devis: use_listino_vip, vip_type_pose, created_by
-- solde_heures: jours_travailles
-- metrages: has_hors_devis, hors_devis_alert (esistono ma PostgREST cache non le vede)
```

## 6. BRANCH E DEPLOY
- **Branch:** `fix-produits-devis`
- **Ultimo commit:** fix rilevamento colonnes
- **Deploy:** automatico su Netlify via push
