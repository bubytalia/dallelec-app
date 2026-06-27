<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>🧮 Devis Matériaux</h2>
      <router-link to="/admin/materiali" class="btn btn-outline-secondary">← Retour</router-link>
    </div>

    <!-- STEP 1: Richiamo devis posa -->
    <div class="card mb-4">
      <div class="card-body">
        <h5>1. Sélectionner le devis de pose</h5>
        <select v-model="selectedDevis" class="form-select" @change="onDevisChange">
          <option value="">-- Choisir un devis existant --</option>
          <option v-for="d in devisList" :key="d.id" :value="d.id">
            N°{{ d.numero || d.id }} - {{ d.clientNom }} - {{ d.chantierNom }}
          </option>
        </select>
      </div>
    </div>

    <!-- Avviso articoli senza distinta -->
    <div v-if="articoliSenzaDistinta.length > 0" class="alert alert-warning mb-4">
      <strong>⚠️ Attention :</strong> Les articles suivants n'ont pas de nomenclature matériel définie :
      <ul class="mb-0 mt-2">
        <li v-for="a in articoliSenzaDistinta" :key="a.produit_id">
          <strong>{{ a.article }}</strong> - {{ a.description }}
          <span v-if="a.taille">({{ a.taille }})</span>
          — {{ a.quantita }} {{ a.unite || '' }}
        </li>
      </ul>
      <div class="mt-2 small">Veuillez compléter la nomenclature dans "Liste Matériel par Article".</div>
    </div>

    <!-- STEP 2: Lista materiali per fornitore -->
    <div v-if="selectedDevis && fornitoriDisponibili.length > 0" class="card mb-4">
      <div class="card-body">
        <h5>2. Liste matériel (par fournisseur)</h5>
        <p class="text-muted small">
          Quantités calculées à partir des articles du devis et des nomenclatures définies.
        </p>

        <!-- Tab fornitori -->
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item" v-for="f in fornitoriDisponibili" :key="f.id">
            <a class="nav-link" :class="{ active: activeFornitore === f.id }" href="#"
              @click.prevent="activeFornitore = f.id">
              {{ f.nome }}
            </a>
          </li>
        </ul>

        <!-- Lista materiali fornitore attivo -->
        <div v-if="activeFornitore">
          <div class="d-flex justify-content-end mb-2">
            <button @click="exportCSV" class="btn btn-sm btn-outline-success">
              📤 Exporter CSV (demande de prix)
            </button>
          </div>

          <table class="table table-sm">
            <thead>
              <tr>
                <th>Code</th>
                <th>Désignation</th>
                <th>Unité</th>
                <th class="text-end">Qté totale</th>
                <th class="text-end">Prix unit. CHF</th>
                <th class="text-end">Total CHF</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in listaFornitoreAttivo" :key="m.articolo_id">
                <td><code>{{ m.codice }}</code></td>
                <td>{{ m.descrizione }}</td>
                <td>{{ m.unita }}</td>
                <td class="text-end">{{ m.quantita_totale.toFixed(2) }}</td>
                <td class="text-end">
                  <input v-model.number="m.prezzo" type="number" step="0.01"
                    class="form-control form-control-sm text-end" style="width:100px; display:inline-block"
                    @change="ricalcola" placeholder="—" />
                </td>
                <td class="text-end">
                  {{ m.prezzo ? (m.quantita_totale * m.prezzo).toFixed(2) : '—' }}
                </td>
              </tr>
            </tbody>
            <tfoot v-if="subtotaleAttivo > 0">
              <tr class="table-light">
                <td colspan="5" class="text-end"><strong>Sous-total:</strong></td>
                <td class="text-end"><strong>CHF {{ subtotaleAttivo.toFixed(2) }}</strong></td>
              </tr>
            </tfoot>
          </table>

          <!-- Import CSV -->
          <div class="mt-2">
            <label class="form-label small">Importer prix depuis CSV :</label>
            <input type="file" @change="importCSV" accept=".csv" class="form-control form-control-sm" style="max-width:400px" />
          </div>
        </div>

        <!-- Nessun fornitore -->
        <div v-if="fornitoriDisponibili.length === 0 && selectedDevis" class="alert alert-warning">
          Aucune nomenclature définie pour les articles de ce devis. Veuillez d'abord définir les composants dans "Liste Matériel par Article".
        </div>
      </div>
    </div>

    <!-- STEP 3: Maggiorazioni per questo devis -->
    <div v-if="selectedDevis && hasPrezzi" class="card mb-4">
      <div class="card-body">
        <h5>3. Majorations (spécifiques à ce devis)</h5>
        <div class="row g-2 mb-2" v-for="(m, i) in maggiorazioni" :key="i">
          <div class="col-md-4">
            <input v-model="m.nome" class="form-control form-control-sm" />
          </div>
          <div class="col-md-2">
            <div class="input-group input-group-sm">
              <input v-model.number="m.percentuale" type="number" step="0.5" class="form-control" @change="ricalcola" />
              <span class="input-group-text">%</span>
            </div>
          </div>
          <div class="col-md-2">
            <button @click="maggiorazioni.splice(i, 1); ricalcola()" class="btn btn-sm btn-outline-danger">🗑️</button>
          </div>
        </div>
        <button @click="maggiorazioni.push({ nome: '', percentuale: 0 })" class="btn btn-sm btn-outline-secondary">
          + Ajouter
        </button>
        <div class="mt-2">
          Total majorations: <strong>{{ totaleMaggPerc.toFixed(1) }}%</strong>
        </div>
      </div>
    </div>

    <!-- STEP 4: Risultato devis completi -->
    <div v-if="devisCompleti.length > 0" class="card mb-4">
      <div class="card-body">
        <h5>4. Devis complets</h5>

        <!-- Un tab per ogni fornitore che ha prezzi completi -->
        <ul class="nav nav-pills mb-3">
          <li class="nav-item" v-for="dc in devisCompleti" :key="dc.fornitore_id">
            <a class="nav-link" :class="{ active: activeDevisCompleto === dc.fornitore_id }" href="#"
              @click.prevent="activeDevisCompleto = dc.fornitore_id">
              {{ dc.fornitore_nome }}
              <span class="badge bg-light text-dark ms-1">CHF {{ dc.totale_generale.toFixed(2) }}</span>
            </a>
          </li>
        </ul>

        <!-- Dettaglio devis completo -->
        <div v-for="dc in devisCompleti" :key="'det-'+dc.fornitore_id" v-show="activeDevisCompleto === dc.fornitore_id">
          <div class="d-flex justify-content-end mb-2">
            <button @click="generatePdfClient(dc)" class="btn btn-outline-dark btn-sm me-2">📄 PDF Client</button>
            <button @click="salvaDevis(dc)" class="btn btn-primary btn-sm">💾 Sauvegarder</button>
          </div>

          <div class="table-responsive">
            <table class="table table-sm">
              <thead class="table-dark">
                <tr>
                  <th>Article</th>
                  <th class="text-end">Qté</th>
                  <th class="text-end">Prix Pose</th>
                  <th class="text-end">Prix Matériau</th>
                  <th class="text-end">Prix Unit. Client</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in dc.righe" :key="r.produit_id">
                  <td>{{ r.descrizione }}</td>
                  <td class="text-end">{{ r.quantita }}</td>
                  <td class="text-end">{{ r.prezzo_posa.toFixed(2) }}</td>
                  <td class="text-end">{{ r.prezzo_materiale.toFixed(2) }}</td>
                  <td class="text-end"><strong>{{ r.prezzo_unitario_totale.toFixed(2) }}</strong></td>
                  <td class="text-end"><strong>{{ r.totale_riga.toFixed(2) }}</strong></td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="table-light">
                  <td colspan="5" class="text-end">Total Pose :</td>
                  <td class="text-end"><strong>CHF {{ dc.totale_posa.toFixed(2) }}</strong></td>
                </tr>
                <tr class="table-light">
                  <td colspan="5" class="text-end">Total Matériaux (maj. incluses) :</td>
                  <td class="text-end"><strong>CHF {{ dc.totale_materiali.toFixed(2) }}</strong></td>
                </tr>
                <tr class="table-warning">
                  <td colspan="5" class="text-end"><strong>TOTAL GÉNÉRAL :</strong></td>
                  <td class="text-end"><strong>CHF {{ dc.totale_generale.toFixed(2) }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Devis salvati -->
    <div class="card">
      <div class="card-body">
        <h5>Devis matériaux sauvegardés</h5>
        <table class="table table-hover table-sm">
          <thead>
            <tr>
              <th>Devis</th>
              <th>Fournisseur</th>
              <th class="text-end">Total Pose</th>
              <th class="text-end">Total Matériaux</th>
              <th class="text-end">Total Général</th>
              <th>État</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in preventiviSalvati" :key="p.id">
              <td>{{ p.nome }}</td>
              <td>{{ p.fornitore_nome || '-' }}</td>
              <td class="text-end">CHF {{ Number(p.totale_posa).toFixed(2) }}</td>
              <td class="text-end">CHF {{ Number(p.totale_materiali).toFixed(2) }}</td>
              <td class="text-end"><strong>CHF {{ Number(p.totale_generale).toFixed(2) }}</strong></td>
              <td><span class="badge bg-secondary">{{ p.stato }}</span></td>
              <td>
                <button @click="removePreventivo(p.id)" class="btn btn-sm btn-outline-danger">🗑️</button>
              </td>
            </tr>
            <tr v-if="preventiviSalvati.length === 0">
              <td colspan="7" class="text-center text-muted">Aucun devis matériaux sauvegardé</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/supabase'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import logo from '@/assets/logo.jpg'

export default {
  name: 'MateriaPreventivi',
  setup() {
    const devisList = ref([])
    const preventiviSalvati = ref([])
    const selectedDevis = ref('')
    const devisArticles = ref([]) // articoli con quantità dal devis
    const fornitoriDisponibili = ref([])
    const activeFornitore = ref(null)
    const activeDevisCompleto = ref(null)
    const listaMateriali = ref({}) // { fornitoreId: [{ articolo_id, codice, descrizione, unita, quantita_totale, prezzo }] }
    const devisCompleti = ref([])
    const maggiorazioni = ref([
      { nome: 'Déchet', percentuale: 5 },
      { nome: 'Gestion chantier', percentuale: 3 },
      { nome: 'Bénéfice', percentuale: 15 }
    ])

    const totaleMaggPerc = computed(() =>
      maggiorazioni.value.reduce((s, m) => s + Number(m.percentuale || 0), 0)
    )

    const listaFornitoreAttivo = computed(() =>
      listaMateriali.value[activeFornitore.value] || []
    )

    const subtotaleAttivo = computed(() =>
      listaFornitoreAttivo.value.reduce((s, m) => s + (m.prezzo ? m.quantita_totale * m.prezzo : 0), 0)
    )

    const hasPrezzi = computed(() => {
      return Object.values(listaMateriali.value).some(lista =>
        lista.some(m => m.prezzo > 0)
      )
    })

    // Carica devis e preventivi salvati
    const load = async () => {
      const { data: dv } = await supabase.from('devis').select('id, numero, nom, client_id')
      const { data: cl } = await supabase.from('clients').select('id, nom')
      devisList.value = (dv || []).map(d => ({
        ...d,
        clientNom: cl?.find(c => c.id === d.client_id)?.nom || '-',
        chantierNom: d.nom || '-'
      }))
      const { data: ps } = await supabase.from('mat_preventivi')
        .select('*').order('created_at', { ascending: false })
      preventiviSalvati.value = ps || []
    }

    const articoliSenzaDistinta = ref([])

    // Quando seleziono un devis: carico gli articoli del devis e genero la lista materiali
    const onDevisChange = async () => {
      devisCompleti.value = []
      listaMateriali.value = {}
      fornitoriDisponibili.value = []
      articoliSenzaDistinta.value = []
      if (!selectedDevis.value) return

      // Carica il devis con i suoi produits (array JSON con article, ml, prix, etc.)
      const { data: devisData } = await supabase.from('devis')
        .select('id, produits').eq('id', selectedDevis.value).single()
      const devisProduits = devisData?.produits || []
      if (devisProduits.length === 0) return

      // Carica tutti i produits del listino per trovare gli id
      const { data: produits } = await supabase.from('produits')
        .select('id, article, description, taille, unite, prix')
      devisArticles.value = produits || []

      // Mappa: article code → { produit_id, quantita dal devis }
      const devisMap = []
      for (const dp of devisProduits) {
        const prod = produits.find(p => p.article === dp.article && p.taille === dp.taille)
        if (prod) {
          devisMap.push({ produit_id: prod.id, quantita: Number(dp.ml || dp.totalML || 1), article: prod.article, description: prod.description, taille: prod.taille, prix_posa: Number(dp.prix || prod.prix || 0) })
        }
      }
      if (devisMap.length === 0) return

      // Carica le distinte solo per i produits presenti nel devis
      const produitIds = devisMap.map(d => d.produit_id)
      const { data: distinte } = await supabase.from('mat_distinte')
        .select('produit_id, fornitore_id, articolo_fornitore_id, quantita_per_unita, mat_articoli_fornitore(id, codice, descrizione, unita)')
        .in('produit_id', produitIds)

      // Verifica articoli senza distinta
      const produitIdsConDistinta = [...new Set((distinte || []).map(d => d.produit_id))]
      articoliSenzaDistinta.value = devisMap.filter(dm => !produitIdsConDistinta.includes(dm.produit_id))

      if (!distinte || distinte.length === 0) return

      // Trova fornitori unici
      const fornIds = [...new Set(distinte.map(d => d.fornitore_id).filter(Boolean))]
      const { data: forns } = await supabase.from('mat_fornitori').select('id, nome').in('id', fornIds)
      fornitoriDisponibili.value = forns || []
      if (forns?.length > 0) activeFornitore.value = forns[0].id

      // Genera lista materiali per fornitore (quantità distinta × quantità devis)
      const materiali = {}
      for (const fId of fornIds) {
        const distinteF = distinte.filter(d => d.fornitore_id === fId)
        const articoliMap = {}

        for (const d of distinteF) {
          // Trova la quantità dal devis per questo produit
          const devisItem = devisMap.find(dm => dm.produit_id === d.produit_id)
          const qtaDevis = devisItem ? devisItem.quantita : 1
          const qtaTotale = Number(d.quantita_per_unita) * qtaDevis

          const artId = d.articolo_fornitore_id
          if (!articoliMap[artId]) {
            articoliMap[artId] = {
              articolo_id: artId,
              codice: d.mat_articoli_fornitore?.codice || '',
              descrizione: d.mat_articoli_fornitore?.descrizione || '',
              unita: d.mat_articoli_fornitore?.unita || 'pce',
              quantita_totale: 0,
              prezzo: null
            }
          }
          articoliMap[artId].quantita_totale += qtaTotale
        }

        // Aggiungi materiali dei supplementi
        for (const dp of devisProduits) {
          if (!dp.supplements || dp.supplements.length === 0) continue
          for (const supp of dp.supplements) {
            const suppTaille = supp.taille || dp.taille
            // Cerca distinta supplemento per questo fornitore
            const { data: distinteSupp } = await supabase.from('mat_distinte_supplements')
              .select('articolo_fornitore_id, quantita_per_occorrenza, mat_articoli_fornitore(id, codice, descrizione, unita)')
              .eq('fornitore_id', fId)
              .eq('taille', suppTaille)
            // Trova il supplement_id dalla tabella supplements
            const suppRecord = (await supabase.from('supplements').select('id').eq('nom', supp.supplement).single()).data
            if (!suppRecord) continue
            const distinteForSupp = (distinteSupp || []).filter(ds => {
              // Filtra solo per il supplement_id corretto
              return true // Caricati tutti, filtriamo sotto
            })
            // Ricarica con filtro corretto
            const { data: distSuppFiltered } = await supabase.from('mat_distinte_supplements')
              .select('articolo_fornitore_id, quantita_per_occorrenza, mat_articoli_fornitore(id, codice, descrizione, unita)')
              .eq('supplement_id', suppRecord.id)
              .eq('taille', suppTaille)
              .eq('fornitore_id', fId)

            const qteSupplement = Number(supp.qte || supp.qteTotale || 1)
            for (const ds of (distSuppFiltered || [])) {
              const qtaTotale = Number(ds.quantita_per_occorrenza) * qteSupplement
              const artId = ds.articolo_fornitore_id
              if (!articoliMap[artId]) {
                articoliMap[artId] = {
                  articolo_id: artId,
                  codice: ds.mat_articoli_fornitore?.codice || '',
                  descrizione: ds.mat_articoli_fornitore?.descrizione || '',
                  unita: ds.mat_articoli_fornitore?.unita || 'pce',
                  quantita_totale: 0,
                  prezzo: null
                }
              }
              articoliMap[artId].quantita_totale += qtaTotale
            }
          }
        }

        materiali[fId] = Object.values(articoliMap)
      }
      listaMateriali.value = materiali
    }

    // Ricalcola devis completi
    const ricalcola = async () => {
      const risultati = []
      const maggMult = 1 + totaleMaggPerc.value / 100

      // Recupera il devis per avere le quantità reali
      const { data: devisData } = await supabase.from('devis')
        .select('produits').eq('id', selectedDevis.value).single()
      const devisProduits = devisData?.produits || []

      // Per ogni fornitore che ha almeno un prezzo
      for (const fId of Object.keys(listaMateriali.value)) {
        const lista = listaMateriali.value[fId]
        const tuttiConPrezzo = lista.length > 0 && lista.every(m => m.prezzo > 0)
        if (!tuttiConPrezzo) continue

        const forn = fornitoriDisponibili.value.find(f => f.id === fId)

        // Carica distinte di questo fornitore
        const { data: distinte } = await supabase.from('mat_distinte')
          .select('produit_id, articolo_fornitore_id, quantita_per_unita')
          .eq('fornitore_id', fId)

        // Mappa prezzi
        const prezziMap = {}
        lista.forEach(m => { prezziMap[m.articolo_id] = m.prezzo })

        // Calcola per ogni articolo di posa presente nel devis
        const righe = []
        const produitIds = [...new Set((distinte || []).map(d => d.produit_id))]

        for (const pId of produitIds) {
          const prod = devisArticles.value.find(p => p.id === pId)
          if (!prod) continue

          // Trova la quantità dal devis
          const devisItem = devisProduits.find(dp => dp.article === prod.article && dp.taille === prod.taille)
          const qta = devisItem ? Number(devisItem.ml || devisItem.totalML || 1) : 1
          const prezzoPosa = devisItem ? Number(devisItem.prix || prod.prix || 0) : Number(prod.prix || 0)

          const comps = (distinte || []).filter(d => d.produit_id === pId)

          // Costo materiale per UNA unità di posa
          let costoMatUnitario = 0
          for (const c of comps) {
            const prezzo = prezziMap[c.articolo_fornitore_id] || 0
            costoMatUnitario += Number(c.quantita_per_unita) * prezzo
          }
          costoMatUnitario = costoMatUnitario * maggMult

          righe.push({
            produit_id: pId,
            descrizione: `${prod.article || ''} - ${prod.description || ''}`,
            quantita: qta,
            prezzo_posa: prezzoPosa,
            prezzo_materiale: costoMatUnitario,
            prezzo_unitario_totale: prezzoPosa + costoMatUnitario,
            totale_riga: (prezzoPosa + costoMatUnitario) * qta,
            is_supplement: false
          })

          // Calcola supplementi per questo articolo
          if (devisItem?.supplements && devisItem.supplements.length > 0) {
            for (const supp of devisItem.supplements) {
              const suppTaille = supp.taille || devisItem.taille
              const suppRecord = (await supabase.from('supplements').select('id').eq('nom', supp.supplement).single()).data
              if (!suppRecord) continue

              const { data: distSupp } = await supabase.from('mat_distinte_supplements')
                .select('articolo_fornitore_id, quantita_per_occorrenza')
                .eq('supplement_id', suppRecord.id)
                .eq('taille', suppTaille)
                .eq('fornitore_id', fId)

              const qteSupplement = Number(supp.qte || supp.qteTotale || 1)
              let costoSupp = 0
              for (const ds of (distSupp || [])) {
                const prezzo = prezziMap[ds.articolo_fornitore_id] || 0
                costoSupp += Number(ds.quantita_per_occorrenza) * prezzo
              }
              costoSupp = costoSupp * maggMult

              if (costoSupp > 0) {
                righe.push({
                  produit_id: null,
                  descrizione: `  ↳ ${supp.supplement}`,
                  quantita: qteSupplement,
                  prezzo_posa: 0,
                  prezzo_materiale: costoSupp,
                  prezzo_unitario_totale: costoSupp,
                  totale_riga: costoSupp * qteSupplement,
                  is_supplement: true
                })
              }
            }
          }
        }

        const totPosa = righe.reduce((s, r) => s + r.quantita * r.prezzo_posa, 0)
        const totMat = righe.reduce((s, r) => s + (r.is_supplement ? r.totale_riga : r.quantita * r.prezzo_materiale), 0)

        risultati.push({
          fornitore_id: fId,
          fornitore_nome: forn?.nome || '-',
          righe,
          totale_posa: totPosa,
          totale_materiali: totMat,
          totale_generale: totPosa + totMat
        })
      }

      devisCompleti.value = risultati
      if (risultati.length > 0) activeDevisCompleto.value = risultati[0].fornitore_id
    }

    // Export CSV per demande de prix
    const exportCSV = () => {
      const lista = listaFornitoreAttivo.value
      const forn = fornitoriDisponibili.value.find(f => f.id === activeFornitore.value)
      let csv = 'Code;Désignation;Unité;Quantité;Prix Unitaire CHF\n'
      lista.forEach(m => { csv += `${m.codice};${m.descrizione};${m.unita};${m.quantita_totale.toFixed(2)};\n` })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `demande_prix_${forn?.nome || 'fournisseur'}.csv`
      link.click()
    }

    // Import CSV prezzi
    const importCSV = async (event) => {
      const file = event.target.files[0]
      if (!file) return
      const text = await file.text()
      const lines = text.split('\n').slice(1).filter(l => l.trim())
      const lista = listaMateriali.value[activeFornitore.value] || []
      for (const line of lines) {
        const parts = line.split(';')
        if (parts.length >= 5 && parts[4]?.trim()) {
          const codice = parts[0].trim()
          const prezzo = parseFloat(parts[4].trim().replace(',', '.'))
          if (isNaN(prezzo)) continue
          const art = lista.find(m => m.codice === codice)
          if (art) art.prezzo = prezzo
        }
      }
      ricalcola()
    }

    // Salva devis completo
    const salvaDevis = async (dc) => {
      const devis = devisList.value.find(d => d.id === parseInt(selectedDevis.value))
      const { data: prev } = await supabase.from('mat_preventivi').insert({
        devis_id: parseInt(selectedDevis.value),
        chantier_id: devis?.chantier_id || null,
        client_id: devis?.client_id || null,
        nome: `${devis?.clientNom} - ${devis?.chantierNom} (${dc.fornitore_nome})`,
        fornitore_nome: dc.fornitore_nome,
        totale_posa: dc.totale_posa,
        totale_materiali: dc.totale_materiali,
        totale_generale: dc.totale_generale,
        stato: 'bozza'
      }).select().single()

      if (prev) {
        const righeInsert = dc.righe.map((r, i) => ({
          preventivo_id: prev.id,
          produit_id: r.produit_id,
          descrizione: r.descrizione,
          quantita: r.quantita,
          prezzo_posa: r.prezzo_posa,
          prezzo_materiale: r.prezzo_materiale,
          prezzo_unitario_totale: r.prezzo_unitario_totale,
          totale_riga: r.totale_riga,
          ordine: i
        }))
        await supabase.from('mat_preventivi_righe').insert(righeInsert)
      }
      alert('Devis matériaux sauvegardé !')
      load()
    }

    const removePreventivo = async (id) => {
      if (!confirm('Supprimer ce devis ?')) return
      await supabase.from('mat_preventivi').delete().eq('id', id)
      load()
    }

    // Genera PDF identico al formato classico ma con prezzo unitario comprensivo di materiali
    const generatePdfClient = (dc) => {
      const devis = devisList.value.find(d => d.id === parseInt(selectedDevis.value))
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })

      const drawHeader = () => {
        const logoW = 55
        const logoH = logoW / 5.32
        doc.addImage(logo, 'JPEG', 10, 10, logoW, logoH)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80)
        const info = ['DALLELEC Sarl', 'Rue de Bourgogne 25', '1203 Gen\u00e8ve', 'contact@dallelec.ch']
        let y = 12
        info.forEach(l => { doc.text(l, 200, y, { align: 'right' }); y += 4 })
        doc.setTextColor(0)
      }

      const drawFooter = (pageNum, total) => {
        doc.setFontSize(8)
        doc.text(`Pag. ${pageNum}/${total}`, 105, 292, { align: 'center' })
      }

      // Page 1: Intestazione
      drawHeader()
      doc.setFontSize(20)
      doc.setFont('Helvetica', 'bold')
      doc.text(`DEVIS N. ${devis?.numero || ''}`, 10, 40)
      doc.setFontSize(11)
      doc.setFont('Helvetica', 'normal')
      doc.text(`Client: ${devis?.clientNom || ''}`, 10, 55)
      doc.text(`Chantier: ${devis?.chantierNom || ''}`, 10, 63)
      doc.text(`Date: ${new Date().toLocaleDateString('fr-CH')}`, 10, 71)

      // Page 2: Détail
      doc.addPage()
      drawHeader()
      doc.setFontSize(16)
      doc.setFont('Helvetica', 'bold')
      doc.text('D\u00e9tail du Devis', 10, 40)

      const head = [['Code', 'Produit', 'Taille', 'Unit\u00e9', 'Quantit\u00e9', 'Prix U.', 'Total']]
      const body = dc.righe.map(r => {
        const parts = r.descrizione.split(' - ')
        const article = parts[0] || ''
        const nom = parts.slice(1).join(' - ') || ''
        const prod = devisArticles.value.find(p => p.id === r.produit_id)
        return [
          article,
          nom,
          prod?.taille || '',
          prod?.unite || 'm',
          String(r.quantita),
          r.prezzo_unitario_totale.toFixed(2) + ' CHF',
          r.totale_riga.toFixed(2) + ' CHF'
        ]
      })

      autoTable(doc, {
        head, body,
        startY: 50,
        theme: 'plain',
        margin: { top: 35 },
        headStyles: { fillColor: [230, 230, 230], textColor: 20, halign: 'center', fontSize: 7 },
        bodyStyles: { textColor: 20, fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 30, halign: 'left' },
          1: { cellWidth: 45, halign: 'left' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 25, halign: 'right' }
        },
        didDrawPage: () => { drawHeader() }
      })

      // Totale
      const finalY = doc.lastAutoTable.finalY + 10
      doc.setFontSize(10)
      doc.setFont('Helvetica', 'bold')
      doc.text('Total Devis:', 80, finalY)
      doc.text(`${dc.totale_generale.toFixed(2)} CHF`, 170, finalY, { align: 'right' })

      // Footer su tutte le pagine
      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        drawFooter(i, totalPages)
      }

      const clientName = (devis?.clientNom || 'Client').replace(/[^a-zA-Z0-9]/g, '_')
      const chantierName = (devis?.chantierNom || 'Chantier').replace(/[^a-zA-Z0-9]/g, '_')
      doc.save(`${clientName}_${chantierName}_${devis?.numero || 'DEV'}_MAT.pdf`)
    }

    onMounted(load)
    return {
      devisList, preventiviSalvati, selectedDevis, articoliSenzaDistinta,
      fornitoriDisponibili, activeFornitore, activeDevisCompleto,
      listaFornitoreAttivo, subtotaleAttivo, hasPrezzi,
      maggiorazioni, totaleMaggPerc, devisCompleti,
      onDevisChange, ricalcola, exportCSV, importCSV, salvaDevis, removePreventivo, generatePdfClient
    }
  }
}
</script>
