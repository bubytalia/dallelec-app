<template>
  <div class="container-fluid py-2">
    <RetourButton to="/admin" />

    <h4 class="text-center mb-3">📋 Relevé Chantier</h4>

    <!-- Selezione cantiere -->
    <div v-if="!selectedChantierId" class="card mb-3">
      <div class="card-body">
        <select v-model="selectedChantierId" class="form-select form-select-lg" @change="loadChantierData">
          <option value="">Choisir un chantier...</option>
          <option v-for="ch in chantiers" :key="ch.id" :value="ch.id">
            {{ ch.numero_cantiere ? `N°${ch.numero_cantiere} - ` : '' }}{{ ch.nom }}
          </option>
        </select>
      </div>
    </div>

    <!-- Header cantiere -->
    <div v-if="selectedChantierId" class="alert alert-info py-2 mb-2">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>{{ nomChantier }}</strong> — {{ nomClient }}
          <br><small class="text-muted">Devis: {{ numeroDevis }} | {{ typeDevisLabel }}</small>
          <span v-if="currentMetrageId" class="badge bg-warning ms-2">✏️ Modification</span>
        </div>
        <button class="btn btn-sm btn-outline-secondary" @click="resetSelection">✕</button>
      </div>
    </div>

    <!-- Métrées existantes (brouillons ou non facturées) -->
    <div v-if="selectedChantierId && metragesExistants.length > 0 && !devisData" class="card mb-3">
      <div class="card-header py-2"><strong>📂 Relevés existants</strong></div>
      <div class="card-body p-2">
        <div v-for="m in metragesExistants" :key="m.id" class="d-flex justify-content-between align-items-center border-bottom py-1">
          <div>
            <span class="badge" :class="m.draft ? 'bg-secondary' : 'bg-success'">{{ m.draft ? 'Brouillon' : 'Sauvé' }}</span>
            <small class="ms-2">{{ formatDate(m.created_at) }}</small>
            <small class="ms-2 text-muted">{{ m.total_produits }} produits - {{ (m.total_ml || 0).toFixed(1) }} ML</small>
          </div>
          <button class="btn btn-sm btn-outline-primary" @click="chargerMetrage(m)">Ouvrir</button>
        </div>
        <button class="btn btn-sm btn-success w-100 mt-2" @click="nouveauReleve">➕ Nouveau relevé</button>
      </div>
    </div>

    <!-- Griglia rilevamento -->
    <div v-if="selectedChantierId && gridRows.length > 0">

      <!-- Per ogni zona -->
      <div v-for="zone in zoneGroups" :key="zone.nom" class="mb-4">
        <h5 class="bg-dark text-white p-2 rounded mb-1">📍 {{ zone.nom }}</h5>

        <div class="table-responsive">
          <table class="table table-sm table-bordered mb-0 rilevamento-table">
            <thead class="table-light">
              <tr>
                <th style="min-width:200px">Produit</th>
                <th class="text-center" style="min-width:45px" 
                    v-for="col in zone.maxCols" :key="col">{{ col }}</th>
                <th class="text-center bg-success text-white" style="min-width:55px">TOT</th>
                <th style="width:36px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in zone.rows" :key="row.key"
                  :class="getRowClass(row)">
                <!-- Nome -->
                <td class="align-middle">
                  <span v-if="row.type === 'produit'">
                    <small class="fw-bold">{{ row.article }}</small>
                    <small class="ms-1">{{ row.nom }} {{ row.taille ? `(${row.taille})` : '' }}</small>
                  </span>
                  <span v-else-if="row.type === 'supplement'" class="ps-3">
                    <small class="text-muted">↳</small>
                    <small>{{ row.nom }} ({{ row.valeur }}m)</small>
                  </span>
                  <span v-if="row.horsDevis" class="badge bg-warning text-dark ms-1">HD</span>
                </td>
                <!-- Celle misurazioni -->
                <td v-for="(val, ci) in getMesures(row.key)" :key="ci" class="p-0">
                  <input v-model.number="val.v" type="number" :step="row.type === 'supplement' ? '1' : '0.5'"
                         class="form-control form-control-sm border-0 text-center cell-input"
                         @focus="$event.target.select()">
                </td>
                <!-- Celle vuote -->
                <td v-for="n in (zone.maxCols - getMesures(row.key).length)" :key="'e'+n"></td>
                <!-- Totale -->
                <td class="text-center align-middle fw-bold bg-light">
                  <span v-if="row.type === 'supplement'">
                    {{ getSomma(row.key) }} <small class="text-muted">({{ (getSomma(row.key) * row.valeur).toFixed(1) }}m)</small>
                  </span>
                  <span v-else>{{ getSomma(row.key) }}</span>
                </td>
                <!-- + -->
                <td class="text-center align-middle p-0">
                  <button class="btn btn-sm btn-outline-primary px-2 py-0" 
                          @click="addMesure(row.key)">+</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Ajout article hors devis -->
      <div class="card mb-3 border-warning">
        <div class="card-header py-2 bg-warning bg-opacity-25" 
             @click="showAjoutHD = !showAjoutHD" style="cursor:pointer">
          <strong>➕ Article HORS DEVIS</strong>
          <span class="float-end">{{ showAjoutHD ? '▲' : '▼' }}</span>
        </div>
        <div class="card-body p-2" v-if="showAjoutHD">
          <div class="row g-2">
            <div class="col-6">
              <select v-model="hdForm.zone" class="form-select form-select-sm">
                <option value="">Zone...</option>
                <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
              </select>
            </div>
            <div class="col-6">
              <select v-model="hdForm.produitId" class="form-select form-select-sm" @change="onHdProduitSelect">
                <option value="">Choisir un produit...</option>
                <option v-for="p in catalogueProduits" :key="p.id" :value="p.id">
                  [{{ p.article }}] {{ p.description }} {{ p.taille ? `(${p.taille})` : '' }}
                </option>
              </select>
            </div>
            <div class="col-6" v-if="isDevisDetaille && hdForm.nom">
              <div class="input-group input-group-sm">
                <input v-model.number="hdForm.prix" type="number" step="0.01" 
                       class="form-control" placeholder="Prix/unité">
                <span class="input-group-text">CHF</span>
              </div>
            </div>
            <div class="col-6" v-if="hdForm.nom">
              <input v-model="hdForm.unite" class="form-control form-control-sm" placeholder="Unité (m, pcs...)">
            </div>
            <div class="col-12" v-if="hdForm.nom">
              <div class="alert alert-warning py-1 mb-2">
                <small><strong>⚠️ {{ hdForm.article }} - {{ hdForm.nom }} {{ hdForm.taille ? `(${hdForm.taille})` : '' }}</strong></small>
              </div>
              <button class="btn btn-warning btn-sm w-100" @click="ajouterHorsDevis"
                      :disabled="!hdForm.zone || !hdForm.nom">
                ⚠️ Ajouter Hors Devis
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Régies -->
      <div class="card mb-3">
        <div class="card-header py-2" @click="showRegies = !showRegies" style="cursor:pointer">
          <strong>⏱ Régies</strong>
          <span class="badge bg-secondary ms-1">{{ regies.length }}</span>
          <span class="float-end">{{ showRegies ? '▲' : '▼' }}</span>
        </div>
        <div class="card-body p-2" v-if="showRegies">
          <div v-for="(r, ri) in regies" :key="ri" class="d-flex gap-1 mb-1">
            <select v-model="r.zone" class="form-select form-select-sm" style="flex:1">
              <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
            </select>
            <input v-model.number="r.heures" type="number" step="0.5" 
                   class="form-control form-control-sm" placeholder="h" style="width:55px">
            <input v-model="r.description" class="form-control form-control-sm" 
                   placeholder="Description" style="flex:2">
            <button class="btn btn-sm btn-outline-danger px-1" @click="regies.splice(ri,1)">✕</button>
          </div>
          <button class="btn btn-sm btn-outline-primary w-100 mt-1" 
                  @click="regies.push({zone:'',heures:0,description:''})">+ Régie</button>
        </div>
      </div>

      <!-- Période + Actions -->
      <div class="card mb-3 border-success">
        <div class="card-body">
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label small mb-0">Début:</label>
              <input type="date" v-model="periodeDebut" class="form-control form-control-sm">
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">Fin:</label>
              <input type="date" v-model="periodeFin" class="form-control form-control-sm">
            </div>
          </div>

          <!-- Alert hors devis -->
          <div v-if="hdNonPrices.length > 0 && !isDevisDetaille" class="alert alert-danger py-1 mb-2">
            <small><strong>⚠️ {{ hdNonPrices.length }} article(s) hors devis à pricer avant facturation!</strong></small>
          </div>

          <div class="d-grid gap-2">
            <button class="btn btn-success btn-lg" @click="sauvegarderMetree(false)">
              💾 Sauvegarder Métrée
            </button>
            <button class="btn btn-outline-warning" @click="sauvegarderMetree(true)">
              📝 Sauvegarder Brouillon
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import RetourButton from '@/components/RetourButton.vue'

const chantiers = ref([])
const selectedChantierId = ref('')
const devisData = ref(null)
const currentMetrageId = ref(null)
const metragesExistants = ref([])
const zones = ref([])
const nomChantier = ref('')
const nomClient = ref('')
const numeroDevis = ref('')
const modalitaPrezzi = ref('')
const prixRegieChantier = ref(75)
const supplementsAnagrafica = ref([])
const periodeDebut = ref('')
const periodeFin = ref('')
const showAjoutHD = ref(false)
const showRegies = ref(false)
const regies = ref([])
const produitsHorsDevis = ref([])

// Mesures: { "rowKey": [{v: number}] }
const mesures = reactive({})

const hdForm = ref({ zone: '', produitId: '', article: '', nom: '', taille: '', prix: 0, unite: 'm' })
const catalogueProduits = ref([])

const isDevisDetaille = computed(() => modalitaPrezzi.value !== 'aCorps')
const typeDevisLabel = computed(() => {
  const l = { scontistica: 'Détaillé (Remise)', prezziFissi: 'Détaillé (Prix Fixes)', aCorps: 'À Corps', railEnergie: 'Rail d\'Énergie' }
  return l[modalitaPrezzi.value] || ''
})

// Costruisce le righe della griglia: prodotto + TUTTI i supplementi possibili
const gridRows = computed(() => {
  if (!devisData.value?.produits) return []
  const rows = []

  // Prodotti dal devis
  devisData.value.produits.forEach((p, pi) => {
    // Riga prodotto principale
    rows.push({
      key: `${p.zone}|prod|${pi}`,
      type: 'produit',
      zone: p.zone,
      article: p.article,
      nom: p.nom,
      taille: p.taille,
      unite: p.unite || 'm',
      ml: p.ml || 0,
      prodIndex: pi,
      horsDevis: false
    })
    // TUTTI i supplementi disponibili per ogni prodotto
    supplementsAnagrafica.value.forEach((s, si) => {
      rows.push({
        key: `${p.zone}|supp|${pi}|${si}`,
        type: 'supplement',
        zone: p.zone,
        article: p.article,
        nom: s.nom,
        valeur: s.valeur || 1,
        parentProdIndex: pi,
        suppIndex: si,
        horsDevis: false
      })
    })
  })

  // Prodotti hors devis (con supplementi)
  produitsHorsDevis.value.forEach((p, hi) => {
    rows.push({
      key: `${p.zone}|hd|${hi}`,
      type: 'produit',
      zone: p.zone,
      article: p.article,
      nom: p.nom,
      taille: p.taille,
      unite: p.unite || 'm',
      ml: 0,
      horsDevis: true,
      prixHorsDevis: p.prixHorsDevis
    })
    // TUTTI i supplementi disponibili anche per hors devis
    supplementsAnagrafica.value.forEach((s, si) => {
      rows.push({
        key: `${p.zone}|hdsupp|${hi}|${si}`,
        type: 'supplement',
        zone: p.zone,
        article: p.article,
        nom: s.nom,
        valeur: s.valeur || 1,
        parentHdIndex: hi,
        suppIndex: si,
        horsDevis: true
      })
    })
  })

  return rows
})

// Raggruppa per zona
const zoneGroups = computed(() => {
  const grouped = {}
  gridRows.value.forEach(row => {
    if (!grouped[row.zone]) grouped[row.zone] = []
    grouped[row.zone].push(row)
  })
  return Object.entries(grouped).map(([nom, rows]) => {
    let maxCols = 1
    rows.forEach(r => {
      const len = getMesures(r.key).length
      if (len > maxCols) maxCols = len
    })
    return { nom, rows, maxCols }
  })
})

// Helpers mesures
const getMesures = (key) => {
  if (!mesures[key]) mesures[key] = []
  return mesures[key]
}

const addMesure = (key) => {
  if (!mesures[key]) mesures[key] = []
  mesures[key].push({ v: 0 })
}

const getSomma = (key) => {
  const m = getMesures(key)
  return m.reduce((s, c) => s + (Number(c.v) || 0), 0)
}

const getRowClass = (row) => {
  if (row.horsDevis) return 'table-warning'
  if (row.type === 'supplement') return 'table-light'
  return ''
}

// Hors devis
const hdNonPrices = computed(() => produitsHorsDevis.value.filter(p => !p.prixHorsDevis || p.prixHorsDevis <= 0))

const onHdProduitSelect = () => {
  const prod = catalogueProduits.value.find(p => p.id === hdForm.value.produitId)
  if (prod) {
    hdForm.value.article = prod.article
    hdForm.value.nom = prod.description
    hdForm.value.taille = prod.taille || ''
    hdForm.value.unite = prod.unite || 'm'
    hdForm.value.prix = prod.prix || 0
  }
}

const ajouterHorsDevis = () => {
  if (!hdForm.value.zone || !hdForm.value.nom) return
  produitsHorsDevis.value.push({
    zone: hdForm.value.zone,
    article: hdForm.value.article || 'HD-' + Date.now().toString().slice(-4),
    nom: hdForm.value.nom,
    taille: hdForm.value.taille || '',
    unite: hdForm.value.unite || 'm',
    prixHorsDevis: hdForm.value.prix || 0
  })
  hdForm.value = { zone: '', produitId: '', article: '', nom: '', taille: '', prix: 0, unite: 'm' }
  showAjoutHD.value = false
  alert('⚠️ Article HORS DEVIS ajouté!' + (!isDevisDetaille.value ? '\n\nATTENTION: À pricer avant facturation!' : ''))
}

// Chargement
const fetchChantiers = async () => {
  const { data } = await supabase.from('chantiers').select('*').neq('type', 'interne').order('nom')
  chantiers.value = data || []
}

const fetchSupplements = async () => {
  const { data } = await supabase.from('supplements').select('*').order('ordre')
  supplementsAnagrafica.value = (data || []).map(s => ({ id: s.id, nom: s.nom, valeur: s.valeur || 1 }))
}

const fetchCatalogue = async () => {
  const { data } = await supabase.from('produits').select('*').order('article')
  catalogueProduits.value = data || []
}

const loadChantierData = async () => {
  if (!selectedChantierId.value) return
  const chantier = chantiers.value.find(c => String(c.id) === String(selectedChantierId.value))
  if (!chantier) return

  nomChantier.value = `${chantier.numero_cantiere ? 'N°' + chantier.numero_cantiere + ' - ' : ''}${chantier.nom}`
  nomClient.value = chantier.client || ''
  prixRegieChantier.value = chantier.prix_regie || 75

  // Chercher métrées existantes (brouillons ou non facturées)
  const { data: existants } = await supabase
    .from('metrages')
    .select('*')
    .eq('chantier_id', selectedChantierId.value)
    .or('draft.eq.true,facture.is.null,facture.eq.false')
    .order('created_at', { ascending: false })
  
  metragesExistants.value = (existants || []).filter(m => !m.facture && !m.facture_numero)

  // Si pas de métrées existantes, charger directement le devis
  if (metragesExistants.value.length === 0) {
    await nouveauReleve()
  }
}

const nouveauReleve = async () => {
  const chantier = chantiers.value.find(c => String(c.id) === String(selectedChantierId.value))
  if (!chantier) return

  let allDevis = []
  if (chantier.devis_id) {
    const { data } = await supabase.from('devis').select('*').eq('id', parseInt(chantier.devis_id))
    allDevis = data || []
  }
  if (!allDevis.length) { alert('Devis non trouvé'); selectedChantierId.value = ''; return }

  modalitaPrezzi.value = allDevis[0].modalita_prezzi || 'scontistica'
  currentMetrageId.value = null

  const prodottiMap = new Map()
  allDevis.forEach(devis => {
    if (devis.produits && Array.isArray(devis.produits)) {
      devis.produits.forEach(p => {
        const key = `${p.zone}-${p.article}-${p.nom}-${p.taille}`
        if (!prodottiMap.has(key)) prodottiMap.set(key, { ...p, mlPrevue: p.ml || 0 })
      })
    }
  })

  devisData.value = { numero: allDevis.map(d => d.numero).join(', '), produits: Array.from(prodottiMap.values()) }
  numeroDevis.value = devisData.value.numero

  const zoneSet = new Set()
  devisData.value.produits.forEach(p => { if (p.zone) zoneSet.add(p.zone) })
  zones.value = Array.from(zoneSet).sort()
}

// Charger une métrée existante pour modification
const chargerMetrage = async (metrage) => {
  await nouveauReleve()
  currentMetrageId.value = metrage.id
  periodeDebut.value = metrage.periode_debut || ''
  periodeFin.value = metrage.periode_fin || ''
  regies.value = metrage.regies || []

  // Reconstruire les mesures depuis les items sauvegardés
  if (metrage.items && Array.isArray(metrage.items)) {
    const produits = devisData.value?.produits || []

    metrage.items.forEach(item => {
      // Trouver l'index du produit dans le devis
      const pi = produits.findIndex(p => p.zone === item.zone && p.article === item.article)
      
      if (pi >= 0) {
        // Mesures du produit principal
        const prodKey = `${item.zone}|prod|${pi}`
        if (item.detailMesures && item.detailMesures.length > 0) {
          mesures[prodKey] = item.detailMesures.map(v => ({ v }))
        } else if (item.mlPosee > 0) {
          mesures[prodKey] = [{ v: item.mlPosee }]
        }

        // Supplementi
        if (item.supplements && Array.isArray(item.supplements)) {
          item.supplements.forEach(supp => {
            const si = supplementsAnagrafica.value.findIndex(s => s.nom === supp.supplement)
            if (si >= 0) {
              const suppKey = `${item.zone}|supp|${pi}|${si}`
              mesures[suppKey] = [{ v: supp.qtePosee }]
            }
          })
        }
      } else if (item.horsDevis) {
        // Hors devis
        produitsHorsDevis.value.push({
          zone: item.zone,
          article: item.article,
          nom: item.nom,
          taille: item.taille,
          unite: item.unite || 'm',
          prixHorsDevis: item.prixHorsDevis || 0
        })
        const hdKey = `${item.zone}|hd|${produitsHorsDevis.value.length - 1}`
        if (item.detailMesures && item.detailMesures.length > 0) {
          mesures[hdKey] = item.detailMesures.map(v => ({ v }))
        } else if (item.mlPosee > 0) {
          mesures[hdKey] = [{ v: item.mlPosee }]
        }
      }
    })
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : ''



// Sauvegarde (brouillon ou définitive)
const sauvegarderMetree = async (asBrouillon = false) => {
  if (!asBrouillon && !isDevisDetaille.value && hdNonPrices.value.length > 0) {
    if (!confirm(`⚠️ ${hdNonPrices.value.length} article(s) hors devis sans prix!\nContinuer?`)) return
  }

  const metrageItems = []
  const produits = devisData.value?.produits || []

  produits.forEach((p, pi) => {
    const prodKey = `${p.zone}|prod|${pi}`
    const mlPosee = getSomma(prodKey)

    const supplementDetails = []
    let totalSuppML = 0
    supplementsAnagrafica.value.forEach((s, si) => {
      const suppKey = `${p.zone}|supp|${pi}|${si}`
      const qte = getSomma(suppKey)
      if (qte > 0) {
        const valeur = s.valeur || 1
        supplementDetails.push({
          article: p.article, nom: p.nom, taille: p.taille,
          supplement: s.nom, valeur, qtePosee: qte,
          totalML: qte * valeur, zone: p.zone
        })
        totalSuppML += qte * valeur
      }
    })

    if (mlPosee === 0 && totalSuppML === 0) return

    metrageItems.push({
      zone: p.zone, article: p.article, nom: p.nom, taille: p.taille,
      unite: p.unite || 'm', mlPrevue: p.ml || p.mlPrevue || 0, mlPosee,
      supplements: supplementDetails, totalSuppML, totalML: mlPosee + totalSuppML,
      horsDevis: false,
      detailMesures: getMesures(prodKey).filter(m => m.v > 0).map(m => m.v)
    })
  })

  produitsHorsDevis.value.forEach((p, hi) => {
    const hdKey = `${p.zone}|hd|${hi}`
    const mlPosee = getSomma(hdKey)

    // Supplementi hors devis
    const supplementDetails = []
    let totalSuppML = 0
    supplementsAnagrafica.value.forEach((s, si) => {
      const suppKey = `${p.zone}|hdsupp|${hi}|${si}`
      const qte = getSomma(suppKey)
      if (qte > 0) {
        const valeur = s.valeur || 1
        supplementDetails.push({
          article: p.article, nom: p.nom, taille: p.taille,
          supplement: s.nom, valeur, qtePosee: qte,
          totalML: qte * valeur, zone: p.zone
        })
        totalSuppML += qte * valeur
      }
    })

    if (mlPosee === 0 && totalSuppML === 0) return
    metrageItems.push({
      zone: p.zone, article: p.article, nom: p.nom, taille: p.taille,
      unite: p.unite || 'm', mlPrevue: 0, mlPosee,
      supplements: supplementDetails, totalSuppML, totalML: mlPosee + totalSuppML,
      horsDevis: true, prixHorsDevis: p.prixHorsDevis || null,
      detailMesures: getMesures(hdKey).filter(m => m.v > 0).map(m => m.v)
    })
  })

  if (!asBrouillon && metrageItems.length === 0) { alert('Aucune mesure saisie!'); return }

  const regiesFinales = regies.value
    .filter(r => r.zone && r.heures > 0 && r.description)
    .map(r => ({ ...r, prixHeure: prixRegieChantier.value }))

  const payload = {
    chantier_id: selectedChantierId.value,
    items: metrageItems,
    regies: regiesFinales,
    total_ml: metrageItems.reduce((s, i) => s + i.totalML, 0),
    zones: zones.value,
    total_produits: metrageItems.length,
    periode_debut: periodeDebut.value,
    periode_fin: periodeFin.value,
    draft: asBrouillon,
    status: asBrouillon ? 'draft' : 'approved',
    has_hors_devis: produitsHorsDevis.value.length > 0,
    hors_devis_alert: !isDevisDetaille.value && hdNonPrices.value.length > 0,
    updated_at: new Date().toISOString()
  }

  try {
    if (currentMetrageId.value) {
      // Update existant
      const { error } = await supabase.from('metrages').update(payload).eq('id', currentMetrageId.value)
      if (error) throw error
    } else {
      // Nouveau
      payload.created_at = new Date().toISOString()
      const { data, error } = await supabase.from('metrages').insert([payload]).select()
      if (error) throw error
      if (data?.[0]) currentMetrageId.value = data[0].id
    }

    alert(asBrouillon ? '📝 Brouillon sauvegardé!' : '✅ Métrée sauvegardée!')
    if (!asBrouillon) resetSelection()
  } catch (error) {
    alert('Erreur: ' + error.message)
  }
}

const resetSelection = () => {
  selectedChantierId.value = ''
  devisData.value = null
  Object.keys(mesures).forEach(k => delete mesures[k])
  produitsHorsDevis.value = []
  regies.value = []
  periodeDebut.value = ''
  periodeFin.value = ''
}

onMounted(async () => {
  await Promise.all([fetchChantiers(), fetchSupplements(), fetchCatalogue()])
})
</script>

<style scoped>
.rilevamento-table th, .rilevamento-table td {
  font-size: 0.8rem;
  vertical-align: middle;
}
.cell-input {
  width: 100%;
  min-width: 42px;
  height: 30px;
  font-size: 0.85rem;
  padding: 2px;
  background: transparent;
}
.cell-input:focus {
  background: #fff3cd;
  outline: 2px solid #ffc107;
}
.form-select-lg { font-size: 1.1rem; padding: 0.7rem; }
</style>
