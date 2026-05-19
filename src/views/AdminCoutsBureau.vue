<template>
  <div class="container py-4">
    <RetourButton to="/admin" />

    <h2 class="text-center mb-4">🏢 Coûts Bureau</h2>

    <!-- Sélection année -->
    <div class="row mb-4 justify-content-center">
      <div class="col-md-3">
        <label class="form-label">Année:</label>
        <select v-model="selectedYear" class="form-control" @change="loadData">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

    <!-- Résumé annuel -->
    <div class="card mb-4" v-if="loaded">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Résumé Annuel {{ selectedYear }}</h5>
        <button @click="exportPDF" class="btn btn-sm btn-primary">📄 PDF</button>
      </div>
      <div class="card-body">
        <div class="row text-center mb-3">
          <div class="col-md-4">
            <div class="card bg-light">
              <div class="card-body py-2">
                <h4 class="text-primary mb-0">{{ totalHeuresAnnuel.toFixed(2) }}</h4>
                <small>Heures totales</small>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card bg-light">
              <div class="card-body py-2">
                <h4 class="text-danger mb-0">{{ totalCoutAnnuel.toFixed(2) }} CHF</h4>
                <small>Coût total</small>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card bg-light">
              <div class="card-body py-2">
                <h4 class="text-info mb-0">{{ moyenneMensuelle.toFixed(2) }} CHF</h4>
                <small>Moyenne mensuelle</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau par personne (annuel) -->
        <h6>Détail par personne</h6>
        <div class="table-responsive">
          <table class="table table-striped table-sm">
            <thead>
              <tr>
                <th>Personne</th>
                <th>Rôle</th>
                <th class="text-end">Heures</th>
                <th class="text-end">Coût/h</th>
                <th class="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in personnesAnnuel" :key="p.id">
                <td>{{ p.nom }}</td>
                <td><span class="badge" :class="p.role === 'Chef' ? 'bg-primary' : 'bg-secondary'">{{ p.role }}</span></td>
                <td class="text-end">{{ p.heures.toFixed(2) }}</td>
                <td class="text-end">{{ p.coutHoraire.toFixed(2) }}</td>
                <td class="text-end fw-bold">{{ p.total.toFixed(2) }} CHF</td>
              </tr>
            </tbody>
            <tfoot class="table-dark" v-if="personnesAnnuel.length > 0">
              <tr>
                <td colspan="2"><strong>TOTAL</strong></td>
                <td class="text-end"><strong>{{ totalHeuresAnnuel.toFixed(2) }}</strong></td>
                <td></td>
                <td class="text-end"><strong>{{ totalCoutAnnuel.toFixed(2) }} CHF</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Détail mois par mois -->
    <div class="card" v-if="loaded && moisData.length > 0">
      <div class="card-header"><h5 class="mb-0">Détail mois par mois</h5></div>
      <div class="card-body">
        <div class="accordion" id="accordionMois">
          <div class="accordion-item" v-for="(mois, idx) in moisData" :key="mois.mois">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button"
                :data-bs-toggle="'collapse'" :data-bs-target="'#mois-' + idx">
                <div class="d-flex justify-content-between w-100 me-3">
                  <span>{{ formatMois(mois.mois) }}</span>
                  <span>
                    <span class="badge bg-info me-2">{{ mois.heures.toFixed(2) }}h</span>
                    <span class="badge bg-danger">{{ mois.cout.toFixed(2) }} CHF</span>
                  </span>
                </div>
              </button>
            </h2>
            <div :id="'mois-' + idx" class="accordion-collapse collapse" data-bs-parent="#accordionMois">
              <div class="accordion-body p-2">
                <table class="table table-sm mb-0">
                  <thead>
                    <tr><th>Personne</th><th>Rôle</th><th class="text-end">Heures</th><th class="text-end">Total</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in mois.personnes" :key="p.id">
                      <td>{{ p.nom }}</td>
                      <td><span class="badge" :class="p.role === 'Chef' ? 'bg-primary' : 'bg-secondary'">{{ p.role }}</span></td>
                      <td class="text-end">{{ p.heures.toFixed(2) }}</td>
                      <td class="text-end">{{ p.total.toFixed(2) }} CHF</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loaded && moisData.length === 0" class="alert alert-info text-center mt-3">
      Aucune heure Bureau pour {{ selectedYear }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import RetourButton from '@/components/RetourButton.vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 3 }, (_, i) => currentYear - i)
const selectedYear = ref(currentYear)
const loaded = ref(false)
const moisData = ref([])
const personnesAnnuel = ref([])

const totalHeuresAnnuel = computed(() => personnesAnnuel.value.reduce((s, p) => s + p.heures, 0))
const totalCoutAnnuel = computed(() => personnesAnnuel.value.reduce((s, p) => s + p.total, 0))
const moyenneMensuelle = computed(() => {
  const moisActifs = moisData.value.length
  return moisActifs > 0 ? totalCoutAnnuel.value / moisActifs : 0
})

const formatMois = (m) => {
  const [y, mo] = m.split('-')
  return new Date(y, mo - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const loadData = async () => {
  loaded.value = false
  const startDate = `${selectedYear.value}-01-01`
  const endDate = `${selectedYear.value}-12-31`

  // Cantieri Bureau
  const { data: bureau } = await supabase.from('chantiers').select('id').eq('type', 'interne')
  if (!bureau || bureau.length === 0) { loaded.value = true; moisData.value = []; personnesAnnuel.value = []; return }
  const bureauIds = bureau.map(b => b.id)

  // Collaborateurs et chefs
  const [{ data: collabs }, { data: chefs }] = await Promise.all([
    supabase.from('collaborateurs').select('email, nom, prenom, cout_horaire'),
    supabase.from('chefdechantiers').select('email, nom, prenom, cout_horaire')
  ])

  // Heures
  const [{ data: heuresChef }, { data: heuresOuv }] = await Promise.all([
    supabase.from('heures_chef_propres').select('*').in('chantier_id', bureauIds).gte('date', startDate).lte('date', endDate),
    supabase.from('heures_ouvriers').select('*').in('chantier_id', bureauIds).gte('date', startDate).lte('date', endDate)
  ])

  // Agréger par mois et par personne
  const moisMap = {}
  const annuelMap = {}

  const getInfo = (id, isChef) => {
    const chef = chefs?.find(c => c.email === id)
    const collab = collabs?.find(c => c.email === id)
    const info = chef || collab
    return { nom: info ? `${info.nom} ${info.prenom}` : id, coutHoraire: info?.cout_horaire || (isChef ? 45 : 35) }
  }

  ;(heuresChef || []).forEach(h => {
    const m = h.date.slice(0, 7)
    const hrs = h.total_heures || h.heures_normales || 0
    const info = getInfo(h.chef_id, true)
    const tarif = h.tarif_utilise || info.coutHoraire

    if (!moisMap[m]) moisMap[m] = {}
    if (!moisMap[m][h.chef_id]) moisMap[m][h.chef_id] = { id: h.chef_id, nom: info.nom, role: 'Chef', heures: 0, coutHoraire: tarif, total: 0 }
    moisMap[m][h.chef_id].heures += hrs
    moisMap[m][h.chef_id].total += hrs * tarif

    if (!annuelMap[h.chef_id]) annuelMap[h.chef_id] = { id: h.chef_id, nom: info.nom, role: 'Chef', heures: 0, coutHoraire: tarif, total: 0 }
    annuelMap[h.chef_id].heures += hrs
    annuelMap[h.chef_id].total += hrs * tarif
  })

  ;(heuresOuv || []).forEach(h => {
    const m = h.date.slice(0, 7)
    const hrs = h.heures || 0
    const info = getInfo(h.ouvrier_id, false)
    const tarif = h.tarif_utilise || info.coutHoraire
    const nom = info.nom !== h.ouvrier_id ? info.nom : (h.ouvrier_nom || h.ouvrier_id)

    if (!moisMap[m]) moisMap[m] = {}
    if (!moisMap[m][h.ouvrier_id]) moisMap[m][h.ouvrier_id] = { id: h.ouvrier_id, nom, role: 'Collaborateur', heures: 0, coutHoraire: tarif, total: 0 }
    moisMap[m][h.ouvrier_id].heures += hrs
    moisMap[m][h.ouvrier_id].total += hrs * tarif

    if (!annuelMap[h.ouvrier_id]) annuelMap[h.ouvrier_id] = { id: h.ouvrier_id, nom, role: 'Collaborateur', heures: 0, coutHoraire: tarif, total: 0 }
    annuelMap[h.ouvrier_id].heures += hrs
    annuelMap[h.ouvrier_id].total += hrs * tarif
  })

  // Construire moisData
  moisData.value = Object.entries(moisMap)
    .map(([mois, personnes]) => ({
      mois,
      personnes: Object.values(personnes).sort((a, b) => b.total - a.total),
      heures: Object.values(personnes).reduce((s, p) => s + p.heures, 0),
      cout: Object.values(personnes).reduce((s, p) => s + p.total, 0)
    }))
    .sort((a, b) => a.mois.localeCompare(b.mois))

  personnesAnnuel.value = Object.values(annuelMap).sort((a, b) => b.total - a.total)
  loaded.value = true
}

const exportPDF = () => {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`Coûts Bureau - ${selectedYear.value}`, 14, 20)

  // Résumé annuel par personne
  doc.setFontSize(12)
  doc.text('Récapitulatif annuel par personne', 14, 32)

  autoTable(doc, {
    head: [['Personne', 'Rôle', 'Heures', 'Coût/h', 'Total']],
    body: personnesAnnuel.value.map(p => [p.nom, p.role, p.heures.toFixed(2), `${p.coutHoraire.toFixed(2)}`, `${p.total.toFixed(2)} CHF`]),
    foot: [['TOTAL', '', totalHeuresAnnuel.value.toFixed(2), '', `${totalCoutAnnuel.value.toFixed(2)} CHF`]],
    startY: 36,
    theme: 'striped',
    headStyles: { fillColor: [70, 130, 180] }
  })

  let y = doc.lastAutoTable.finalY + 15

  // Détail mois par mois
  doc.setFontSize(12)
  doc.text('Détail mois par mois', 14, y)
  y += 8

  moisData.value.forEach(mois => {
    if (y > 250) { doc.addPage(); y = 20 }
    autoTable(doc, {
      head: [[{ content: `${formatMois(mois.mois)} — ${mois.heures.toFixed(2)}h — ${mois.cout.toFixed(2)} CHF`, colSpan: 4, styles: { fillColor: [100, 100, 100] } }]],
      body: mois.personnes.map(p => [p.nom, p.role, p.heures.toFixed(2), `${p.total.toFixed(2)} CHF`]),
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 100] },
      bodyStyles: { fontSize: 8 }
    })
    y = doc.lastAutoTable.finalY + 5
  })

  doc.save(`Couts_Bureau_${selectedYear.value}.pdf`)
}

onMounted(loadData)
</script>
