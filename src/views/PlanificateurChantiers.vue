<template>
  <div class="container-fluid py-4">
    <RetourButton to="/admin" />
    <h2 class="text-center mb-4">Planificateur Chantiers</h2>

    <!-- Navigation mois -->
    <div class="d-flex justify-content-center align-items-center mb-4">
      <button class="btn btn-outline-secondary" @click="prevMonth">&larr;</button>
      <h4 class="mx-4 mb-0">{{ monthLabel }}</h4>
      <button class="btn btn-outline-secondary" @click="nextMonth">&rarr;</button>
    </div>

    <!-- Légende couleurs -->
    <div class="d-flex flex-wrap justify-content-center gap-2 mb-3">
      <span v-for="(ch, idx) in chantiersActifs" :key="ch.id" class="badge p-2" :style="{ backgroundColor: getColor(idx) }">
        {{ ch.nom }}
      </span>
    </div>

    <!-- Calendrier -->
    <div class="calendar-wrapper">
      <table class="table table-bordered table-sm calendar-table">
        <thead>
          <tr>
            <th class="sticky-col">Chantier</th>
            <th v-for="day in daysInMonth" :key="day" class="text-center day-col" :class="{ 'bg-light': isWeekend(day) }">
              <div>{{ dayLabel(day) }}</div>
              <small>{{ day }}</small>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ch, idx) in chantiersActifs" :key="ch.id">
            <td class="sticky-col fw-bold chantier-name" :style="{ borderLeft: '4px solid ' + getColor(idx) }">
              {{ ch.nom }}
            </td>
            <td
              v-for="day in daysInMonth"
              :key="day"
              class="text-center cell"
              :class="{ 'bg-light': isWeekend(day), 'active-cell': isCellActive(ch.id, day) }"
              :style="isCellActive(ch.id, day) ? { backgroundColor: getColor(idx) + '30' } : {}"
              @click="openAssignment(ch, day)"
              @dragover.prevent
              @drop="onDrop($event, ch.id, day)"
            >
              <div v-if="isCellActive(ch.id, day)" class="cell-content">
                <small v-for="collab in getCellCollabs(ch.id, day)" :key="collab.id" class="d-block badge bg-white text-dark border mb-1" style="font-size: 0.65em;">
                  {{ collab.prenom }}
                </small>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Panel collaborateurs (draggable) -->
    <div class="card mt-4 p-3">
      <h5>Collaborateurs disponibles <small class="text-muted">(glisser sur le calendrier)</small></h5>
      <div class="d-flex flex-wrap gap-2">
        <div
          v-for="collab in collaborateursActifs"
          :key="collab.id"
          class="badge bg-primary p-2 draggable-collab"
          draggable="true"
          @dragstart="onDragStart($event, collab)"
        >
          {{ collab.nom }} {{ collab.prenom }}
        </div>
      </div>
    </div>

    <!-- Modal assegnazione -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-box">
        <h5>{{ modalChantier?.nom }}</h5>
        <hr>
        <div class="mb-3">
          <strong>Période:</strong>
          <div class="d-flex gap-2 mt-1">
            <div>
              <label class="form-label mb-0"><small>Du</small></label>
              <input type="date" class="form-control form-control-sm" v-model="modalDateDebut" />
            </div>
            <div>
              <label class="form-label mb-0"><small>Au</small></label>
              <input type="date" class="form-control form-control-sm" v-model="modalDateFin" />
            </div>
          </div>
        </div>
        <div class="mb-3">
          <strong>Collaborateurs à assigner:</strong>
          <div class="mt-1">
            <div v-for="collab in collaborateursActifs" :key="collab.id" class="form-check">
              <input class="form-check-input" type="checkbox" :id="'collab-' + collab.id" :value="collab.id" v-model="selectedCollabs">
              <label class="form-check-label" :for="'collab-' + collab.id">{{ collab.nom }} {{ collab.prenom }}</label>
            </div>
          </div>
        </div>
        <div class="d-flex justify-content-between">
          <button class="btn btn-primary" @click="addAssignmentRange" :disabled="selectedCollabs.length === 0 || !modalDateDebut || !modalDateFin">
            Assigner ({{ getDaysCount() }} jours)
          </button>
          <button class="btn btn-outline-danger" @click="removeAssignmentRange" :disabled="selectedCollabs.length === 0 || !modalDateDebut || !modalDateFin">
            Retirer
          </button>
          <button class="btn btn-secondary" @click="showModal = false">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import RetourButton from '@/components/RetourButton.vue'

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

const chantiers = ref([])
const collaborateurs = ref([])
const planifications = ref([])

const showModal = ref(false)
const modalChantier = ref(null)
const modalDay = ref(null)
const modalDateDebut = ref('')
const modalDateFin = ref('')
const selectedCollabs = ref([])

const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548', '#607D8B', '#E91E63', '#3F51B5']
const getColor = (idx) => colors[idx % colors.length]

const monthLabel = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

const daysInMonth = computed(() => {
  const count = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  return Array.from({ length: count }, (_, i) => i + 1)
})

const dayLabel = (day) => {
  const date = new Date(currentYear.value, currentMonth.value, day)
  return date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2)
}

const isWeekend = (day) => {
  const date = new Date(currentYear.value, currentMonth.value, day)
  return date.getDay() === 0 || date.getDay() === 6
}

const chantiersActifs = computed(() => {
  return chantiers.value.filter(c => (c.stato_cantiere === 'a_commencer' || c.stato_cantiere === 'en_cours') && c.type !== 'interne')
})

const collaborateursActifs = computed(() => {
  return collaborateurs.value.filter(c => c.actif !== false)
})

const getDateStr = (day) => {
  const m = String(currentMonth.value + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${currentYear.value}-${m}-${d}`
}

const isCellActive = (chantierId, day) => {
  const dateStr = getDateStr(day)
  return planifications.value.some(p => p.chantier_id === chantierId && p.date === dateStr)
}

const getCellCollabs = (chantierId, day) => {
  const dateStr = getDateStr(day)
  const collabIds = planifications.value
    .filter(p => p.chantier_id === chantierId && p.date === dateStr)
    .map(p => p.collaborateur_id)
  return collaborateurs.value.filter(c => collabIds.includes(c.id))
}


// Navigation
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  loadPlanifications()
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  loadPlanifications()
}

// Drag & Drop
const onDragStart = (event, collab) => {
  event.dataTransfer.setData('collabId', collab.id)
}

const onDrop = async (event, chantierId, day) => {
  const collabId = event.dataTransfer.getData('collabId')
  if (!collabId) return
  await addAssignment(chantierId, collabId, day)
}

// Assignments
const addAssignment = async (chantierId, collabId, day) => {
  const dateStr = getDateStr(day)
  const exists = planifications.value.some(
    p => p.chantier_id === chantierId && p.collaborateur_id === collabId && p.date === dateStr
  )
  if (exists) return

  const { data, error } = await supabase
    .from('planification')
    .insert({ chantier_id: chantierId, collaborateur_id: collabId, date: dateStr })
    .select()
    .single()

  if (!error && data) {
    planifications.value.push(data)
  }
}

const removeAssignment = async (collabId) => {
  const dateStr = getDateStr(modalDay.value)
  const chantierId = modalChantier.value.id

  const { error } = await supabase
    .from('planification')
    .delete()
    .eq('chantier_id', chantierId)
    .eq('collaborateur_id', collabId)
    .eq('date', dateStr)

  if (!error) {
    planifications.value = planifications.value.filter(
      p => !(p.chantier_id === chantierId && p.collaborateur_id === collabId && p.date === dateStr)
    )
  }
}

const openAssignment = (chantier, day) => {
  modalChantier.value = chantier
  modalDay.value = day
  const dateStr = getDateStr(day)
  modalDateDebut.value = dateStr
  modalDateFin.value = dateStr
  selectedCollabs.value = []
  showModal.value = true
}

const getDaysCount = () => {
  if (!modalDateDebut.value || !modalDateFin.value) return 0
  const start = new Date(modalDateDebut.value)
  const end = new Date(modalDateFin.value)
  return Math.max(0, Math.round((end - start) / 86400000) + 1)
}

const addAssignmentRange = async () => {
  if (!modalChantier.value || selectedCollabs.value.length === 0) return
  const start = new Date(modalDateDebut.value)
  const end = new Date(modalDateFin.value)
  if (start > end) return

  const inserts = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    for (const collabId of selectedCollabs.value) {
      const exists = planifications.value.some(
        p => p.chantier_id === modalChantier.value.id && p.collaborateur_id === collabId && p.date === dateStr
      )
      if (!exists) {
        inserts.push({ chantier_id: modalChantier.value.id, collaborateur_id: collabId, date: dateStr })
      }
    }
  }

  if (inserts.length === 0) return

  const { data, error } = await supabase
    .from('planification')
    .insert(inserts)
    .select()

  if (!error && data) {
    planifications.value.push(...data)
  }
  showModal.value = false
}

const removeAssignmentRange = async () => {
  if (!modalChantier.value || selectedCollabs.value.length === 0) return
  const start = new Date(modalDateDebut.value)
  const end = new Date(modalDateFin.value)
  if (start > end) return

  const dates = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0])
  }

  const { error } = await supabase
    .from('planification')
    .delete()
    .eq('chantier_id', modalChantier.value.id)
    .in('collaborateur_id', selectedCollabs.value)
    .in('date', dates)

  if (!error) {
    planifications.value = planifications.value.filter(
      p => !(p.chantier_id === modalChantier.value.id && selectedCollabs.value.includes(p.collaborateur_id) && dates.includes(p.date))
    )
  }
  showModal.value = false
}

// Data loading
const loadPlanifications = async () => {
  const startDate = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-01`
  const endDay = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const endDate = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${endDay}`

  const { data, error } = await supabase
    .from('planification')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)

  if (!error) planifications.value = data || []
}

onMounted(async () => {
  const [chRes, collRes] = await Promise.all([
    supabase.from('chantiers').select('*').order('nom'),
    supabase.from('collaborateurs').select('*').order('nom')
  ])

  chantiers.value = chRes.data || []
  collaborateurs.value = collRes.data || []

  await loadPlanifications()
})
</script>

<style scoped>
.calendar-wrapper {
  overflow-x: auto;
}

.calendar-table {
  min-width: 1200px;
  table-layout: fixed;
}

.sticky-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 1;
  min-width: 150px;
  max-width: 150px;
}

.chantier-name {
  font-size: 0.75em;
}

.day-col {
  width: 45px;
  min-width: 45px;
}

.cell {
  cursor: pointer;
  vertical-align: top;
  padding: 1px !important;
  height: 35px;
}

.cell:hover {
  background-color: #e3f2fd !important;
}

.active-cell {
  border: 1px solid #1976D2;
}

.cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.draggable-collab {
  cursor: grab;
  user-select: none;
}

.draggable-collab:active {
  cursor: grabbing;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-box {
  background: white;
  border-radius: 8px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
}
</style>
