<template>
  <div class="container-fluid py-4">
    <RetourButton />
    
    <div class="row mb-4">
      <div class="col-12">
        <h2>Gestion Heures Employés</h2>
        <p class="text-muted">Modifier et supprimer les heures de tous les employés</p>
      </div>
    </div>

    <!-- Filtres -->
    <div class="row mb-3">
      <div class="col-md-3">
        <label>Employé:</label>
        <select v-model="filterEmploye" class="form-select">
          <option value="">Tous les employés</option>
          <option v-for="emp in employes" :key="emp.email" :value="emp.email">
            {{ emp.nom }} {{ emp.prenom }}
          </option>
        </select>
      </div>
      <div class="col-md-3">
        <label>Chantier:</label>
        <select v-model="filterChantier" class="form-select">
          <option value="">Tous les chantiers</option>
          <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
            {{ chantier.nom }}
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <label>Date début:</label>
        <input v-model="filterDateDebut" type="date" class="form-control">
      </div>
      <div class="col-md-2">
        <label>Date fin:</label>
        <input v-model="filterDateFin" type="date" class="form-control">
      </div>
      <div class="col-md-2">
        <label>&nbsp;</label>
        <button @click="chargerHeures" class="btn btn-primary w-100">🔍 Rechercher</button>
      </div>
    </div>

    <!-- Statistiques + Export -->
    <div class="row mb-3">
      <div class="col-md-8">
        <div class="alert alert-info mb-0">
          <strong>Total heures trouvées:</strong> {{ totalHeures.toFixed(2) }}h | 
          <strong>Entrées:</strong> {{ heuresFiltrees.length }}
        </div>
      </div>
      <div class="col-md-4 d-flex align-items-center justify-content-end gap-2">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="sansPrix" v-model="exportSansPrix">
          <label class="form-check-label" for="sansPrix">Sans prix</label>
        </div>
        <button @click="exporterPDF" class="btn btn-outline-primary" :disabled="heuresFiltrees.length === 0">
          📄 Exporter PDF
        </button>
      </div>
    </div>

    <!-- Tableau heures -->
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employé</th>
                <th>Type</th>
                <th>Chantier</th>
                <th>Heures</th>
                <th>Type</th>
                <th>Suppl.</th>
                <th>Tarif/h</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="heure in heuresFiltrees" :key="`${heure.type}-${heure.id}`">
                <td>{{ formatDate(heure.date) }}</td>
                <td>{{ heure.employe_nom }}</td>
                <td>
                  <span class="badge" :class="getBadgeClass(heure.type)">
                    {{ getTypeLabel(heure.type) }}
                  </span>
                </td>
                <td>
                  <select 
                    v-if="editingId === `${heure.type}-${heure.id}`"
                    v-model="editingHeure.chantier_id"
                    class="form-select form-select-sm"
                  >
                    <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                      {{ chantier.nom }}
                    </option>
                  </select>
                  <span v-else>{{ getChantierName(heure.chantier_id) }}</span>
                </td>
                <td>
                  <input 
                    v-if="editingId === `${heure.type}-${heure.id}`"
                    v-model.number="editingHeure.heures"
                    type="number"
                    step="0.25"
                    class="form-control form-control-sm"
                    style="width: 80px"
                  >
                  <span v-else>{{ heure.heures }}h</span>
                </td>
                <td>
                  <select
                    v-if="editingId === `${heure.type}-${heure.id}`"
                    v-model="editingHeure.type_travail"
                    class="form-select form-select-sm"
                    style="width: 130px"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Nuit +50%">Nuit +50%</option>
                    <option value="Nuit +100%">Nuit +100%</option>
                    <option value="Weekend">Weekend</option>
                  </select>
                  <span v-else :class="getTypeTravailBadge(heure.type_travail)">
                    {{ heure.type_travail || 'Normal' }}
                  </span>
                </td>
                <td>
                  <span v-if="(heure.supplement_pourcentage || 0) > 0" class="badge bg-warning text-dark">
                    +{{ heure.supplement_pourcentage }}%
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>{{ heure.tarif_utilise || '-' }} CHF</td>
                <td>{{ getCoutEffectif(heure).toFixed(2) }} CHF</td>
                <td>
                  <div v-if="editingId === `${heure.type}-${heure.id}`">
                    <button @click="saveEdit" class="btn btn-sm btn-success me-1">✔</button>
                    <button @click="cancelEdit" class="btn btn-sm btn-secondary">✖</button>
                  </div>
                  <div v-else>
                    <button @click="startEdit(heure)" class="btn btn-sm btn-warning me-1" title="Modifier">✎</button>
                    <button @click="deleteHeure(heure)" class="btn btn-sm btn-danger" title="Supprimer">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import RetourButton from '../components/RetourButton.vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const chantiers = ref([])
const employes = ref([])
const heuresChefPropres = ref([])
const heuresChefInterim = ref([])
const heuresOuvriers = ref([])

const filterEmploye = ref('')
const filterChantier = ref('')
const filterDateDebut = ref('')
const filterDateFin = ref('')

const editingId = ref(null)
const editingHeure = ref({})
const exportSansPrix = ref(true)

const fetchChantiers = async () => {
  const { data } = await supabase.from('chantiers').select('*').neq('type', 'interne').order('nom')
  chantiers.value = data || []
}

const fetchEmployes = async () => {
  const employes_list = []
  
  const { data: chefs } = await supabase.from('chefdechantiers').select('*')
  const { data: collabs } = await supabase.from('collaborateurs').select('*')
  
  if (chefs) employes_list.push(...chefs)
  if (collabs) employes_list.push(...collabs)
  
  employes.value = employes_list.sort((a, b) => a.nom.localeCompare(b.nom))
}

const chargerHeures = async () => {
  // Carica heures_chef_propres
  let query1 = supabase.from('heures_chef_propres').select('*')
  if (filterEmploye.value) query1 = query1.eq('chef_id', filterEmploye.value)
  if (filterChantier.value) query1 = query1.eq('chantier_id', filterChantier.value)
  if (filterDateDebut.value) query1 = query1.gte('date', filterDateDebut.value)
  if (filterDateFin.value) query1 = query1.lte('date', filterDateFin.value)
  const { data: data1 } = await query1.order('date', { ascending: false })
  heuresChefPropres.value = (data1 || []).map(h => ({ ...h, type: 'chef_propre', heures: h.total_heures, employe_nom: getEmployeName(h.chef_id), type_travail: h.type_travail || 'Normal', supplement_pourcentage: h.supplement_pourcentage || 0 }))

  // Carica heures_chef_interim
  let query2 = supabase.from('heures_chef_interim').select('*')
  if (filterEmploye.value) query2 = query2.eq('chef_id', filterEmploye.value)
  if (filterChantier.value) query2 = query2.eq('chantier_id', filterChantier.value)
  if (filterDateDebut.value) query2 = query2.gte('date', filterDateDebut.value)
  if (filterDateFin.value) query2 = query2.lte('date', filterDateFin.value)
  const { data: data2 } = await query2.order('date', { ascending: false })
  heuresChefInterim.value = (data2 || []).map(h => ({ ...h, type: 'chef_interim', heures: h.total_heures, employe_nom: h.interinaire_nom || getEmployeName(h.chef_id), type_travail: h.type_travail || 'Normal', supplement_pourcentage: h.supplement_pourcentage || 0 }))

  // Carica heures_ouvriers
  let query3 = supabase.from('heures_ouvriers').select('*')
  if (filterEmploye.value) query3 = query3.eq('ouvrier_id', filterEmploye.value)
  if (filterChantier.value) query3 = query3.eq('chantier_id', filterChantier.value)
  if (filterDateDebut.value) query3 = query3.gte('date', filterDateDebut.value)
  if (filterDateFin.value) query3 = query3.lte('date', filterDateFin.value)
  const { data: data3 } = await query3.order('date', { ascending: false })
  heuresOuvriers.value = (data3 || []).map(h => ({ ...h, type: 'ouvrier', employe_nom: h.ouvrier_nom || getEmployeName(h.ouvrier_id), type_travail: h.type_travail || 'Normal', supplement_pourcentage: h.supplement_pourcentage || 0 }))
}

const heuresFiltrees = computed(() => {
  return [...heuresChefPropres.value, ...heuresChefInterim.value, ...heuresOuvriers.value]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

const totalHeures = computed(() => {
  return heuresFiltrees.value.reduce((sum, h) => sum + (h.heures || 0), 0)
})

const getEmployeName = (email) => {
  const emp = employes.value.find(e => e.email === email)
  return emp ? `${emp.nom} ${emp.prenom}` : email
}

const getChantierName = (id) => {
  const chantier = chantiers.value.find(c => c.id == id)
  return chantier ? chantier.nom : '-'
}

const getTypeLabel = (type) => {
  const labels = {
    'chef_propre': 'Chef Propre',
    'chef_interim': 'Chef Intérim',
    'ouvrier': 'Ouvrier'
  }
  return labels[type] || type
}

const getBadgeClass = (type) => {
  const classes = {
    'chef_propre': 'bg-primary',
    'chef_interim': 'bg-info',
    'ouvrier': 'bg-success'
  }
  return classes[type] || 'bg-secondary'
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

const startEdit = (heure) => {
  editingId.value = `${heure.type}-${heure.id}`
  editingHeure.value = { ...heure }
}

const cancelEdit = () => {
  editingId.value = null
  editingHeure.value = {}
}

const getSupplementFromType = (typeTravail) => {
  if (typeTravail === 'Nuit +50%') return 50
  if (typeTravail === 'Nuit +100%') return 100
  return 0
}

const getTypeTravailBadge = (type) => {
  if (type === 'Nuit +50%') return 'badge bg-warning text-dark'
  if (type === 'Nuit +100%') return 'badge bg-danger'
  return 'badge bg-secondary'
}

const getCoutEffectif = (heure) => {
  const mult = 1 + (heure.supplement_pourcentage || 0) / 100
  return (heure.heures || 0) * (heure.tarif_utilise || 0) * mult
}

const saveEdit = async () => {
  const tableName = editingHeure.value.type === 'chef_propre' ? 'heures_chef_propres' :
                    editingHeure.value.type === 'chef_interim' ? 'heures_chef_interim' : 'heures_ouvriers'
  
  const suppPct = getSupplementFromType(editingHeure.value.type_travail)
  
  const updateData = editingHeure.value.type === 'ouvrier' 
    ? { heures: editingHeure.value.heures, chantier_id: editingHeure.value.chantier_id, type_travail: editingHeure.value.type_travail, supplement_pourcentage: suppPct }
    : { total_heures: editingHeure.value.heures, heures_normales: editingHeure.value.heures, chantier_id: editingHeure.value.chantier_id, type_travail: editingHeure.value.type_travail, supplement_pourcentage: suppPct }
  
  const { error } = await supabase
    .from(tableName)
    .update(updateData)
    .eq('id', editingHeure.value.id)
  
  if (error) {
    alert('Erreur: ' + error.message)
  } else {
    cancelEdit()
    chargerHeures()
  }
}

const deleteHeure = async (heure) => {
  if (!confirm(`Supprimer cette entrée de ${heure.employe_nom} du ${formatDate(heure.date)} ?`)) return
  
  const tableName = heure.type === 'chef_propre' ? 'heures_chef_propres' :
                    heure.type === 'chef_interim' ? 'heures_chef_interim' : 'heures_ouvriers'
  
  const { error } = await supabase.from(tableName).delete().eq('id', heure.id)
  
  if (error) {
    alert('Erreur: ' + error.message)
  } else {
    chargerHeures()
  }
}

const exporterPDF = () => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: exportSansPrix.value ? 'portrait' : 'landscape' })
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Gestion Heures Employés', 15, 15)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  let subtitle = `Période: ${filterDateDebut.value || '...'} au ${filterDateFin.value || '...'}`
  if (filterEmploye.value) subtitle += ` | Employé: ${getEmployeName(filterEmploye.value)}`
  if (filterChantier.value) subtitle += ` | Chantier: ${getChantierName(filterChantier.value)}`
  doc.text(subtitle, 15, 22)
  doc.text(`Total: ${totalHeures.value.toFixed(2)}h — ${heuresFiltrees.value.length} entrées`, 15, 27)

  const head = exportSansPrix.value
    ? [['Date', 'Employé', 'Type', 'Chantier', 'Heures', 'Travail', 'Suppl.']]
    : [['Date', 'Employé', 'Type', 'Chantier', 'Heures', 'Travail', 'Suppl.', 'Tarif/h', 'Total CHF']]

  const body = heuresFiltrees.value.map(h => {
    const row = [
      formatDate(h.date),
      h.employe_nom,
      getTypeLabel(h.type),
      getChantierName(h.chantier_id),
      `${(h.heures || 0).toFixed(2)}`,
      h.type_travail || 'Normal',
      (h.supplement_pourcentage || 0) > 0 ? `+${h.supplement_pourcentage}%` : '-'
    ]
    if (!exportSansPrix.value) {
      row.push(`${h.tarif_utilise || '-'}`, `${getCoutEffectif(h).toFixed(2)}`)
    }
    return row
  })

  autoTable(doc, {
    head,
    body,
    startY: 32,
    theme: 'striped',
    headStyles: { fillColor: [70, 130, 180], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 2 }
  })

  const d1 = filterDateDebut.value?.replace(/-/g, '') || 'all'
  const d2 = filterDateFin.value?.replace(/-/g, '') || 'all'

  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    const pageW = doc.internal.pageSize.getWidth()
    doc.text(`Page ${i} / ${totalPages}`, pageW - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' })
  }

  doc.save(`Heures_${d1}_${d2}.pdf`)
}

onMounted(() => {
  // Imposta date default (ultimo mese)
  const today = new Date()
  const lastMonth = new Date(today)
  lastMonth.setMonth(today.getMonth() - 1)
  
  filterDateDebut.value = lastMonth.toISOString().split('T')[0]
  filterDateFin.value = today.toISOString().split('T')[0]
  
  fetchChantiers()
  fetchEmployes()
  chargerHeures()
})
</script>

<style scoped>
.table th {
  background-color: #f8f9fa;
}
</style>
