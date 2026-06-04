<template>
  <div class="container-fluid py-4">
    <RetourButton to="/admin" />
    <h2 class="text-center mb-4">Planificateur Chantiers</h2>

    <!-- Navigation mois -->
    <div class="d-flex justify-content-center align-items-center mb-4">
      <button class="btn btn-outline-secondary" @click="prevMonth">&larr;</button>
      <h4 class="mx-4 mb-0">{{ monthLabel }}</h4>
      <button class="btn btn-outline-secondary" @click="nextMonth">&rarr;</button>
      <div class="ms-3">
        <select v-model="visibleMonths" class="form-select form-select-sm" style="width:auto">
          <option :value="1">1 mois</option>
          <option :value="2">2 mois</option>
          <option :value="3">3 mois</option>
        </select>
      </div>
    </div>



    <!-- Calendrier -->
    <div class="calendar-wrapper">
      <table class="table table-bordered table-sm calendar-table">
        <thead>
          <tr>
            <th class="sticky-col" style="min-width:170px;max-width:170px">Chantier</th>
            <template v-for="(monthData, mIdx) in allDays" :key="mIdx">
              <th
                v-for="(day, dIdx) in monthData.days"
                :key="day.dateStr"
                class="text-center day-col"
                :class="{ 'bg-light': day.isWeekend, 'month-separator': dIdx === 0 && mIdx > 0 }"
              >
                <div class="day-header" :class="{ 'fw-bold': dIdx === 0 }">{{ day.label }}</div>
                <small :class="{ 'fw-bold': dIdx === 0 }">{{ dIdx === 0 ? day.monthShort + ' ' + day.num : day.num }}</small>
              </th>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ch, idx) in chantiersActifs" :key="ch.id">
            <td class="sticky-col fw-bold chantier-name" style="min-width:170px;max-width:170px;font-size:0.7em;line-height:1.3" :style="{ borderLeft: '4px solid ' + getColor(idx) }">
              {{ ch.nom }}
            </td>
            <template v-for="(monthData, mIdx) in allDays" :key="mIdx">
              <td
                v-for="(day, dIdx) in monthData.days"
                :key="day.dateStr"
                class="text-center cell"
                :class="{ 'bg-light': day.isWeekend, 'active-cell': isCellActiveDate(ch.id, day.dateStr), 'selecting-cell': isSelectingDate(ch.id, day.dateStr), 'month-separator': dIdx === 0 && mIdx > 0 }"
                :style="isCellActiveDate(ch.id, day.dateStr) ? { backgroundColor: getColor(idx) + '30' } : {}"
                @mousedown="startSelectDate(ch, day.dateStr)"
                @mouseenter="moveSelectDate(ch.id, day.dateStr)"
                @mouseup="endSelectDate(ch, day.dateStr)"
              >
                <div v-if="isCellActiveDate(ch.id, day.dateStr)" class="cell-content">
                  <small v-for="collab in getCellCollabsDate(ch.id, day.dateStr)" :key="collab.id" class="d-block badge bg-white text-dark border mb-1" style="font-size: 0.65em;">
                    {{ collab.prenom }}
                  </small>
                </div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
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
        <!-- Collaborateurs déjà assignés dans cette période -->
        <div class="mb-3" v-if="assignedInPeriod.length > 0">
          <strong>Déjà assignés:</strong>
          <div v-for="collab in assignedInPeriod" :key="collab.id" class="d-flex align-items-center justify-content-between my-1">
            <span>{{ collab.nom }} {{ collab.prenom }}</span>
            <button class="btn btn-sm btn-danger" @click="removeOneFromPeriod(collab.id)">&times;</button>
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
const visibleMonths = ref(2)

const chantiers = ref([])
const collaborateurs = ref([])
const chefDeChantiers = ref([])
const planifications = ref([])

const showModal = ref(false)
const modalChantier = ref(null)
const modalDay = ref(null)
const modalDateDebut = ref('')
const modalDateFin = ref('')
const selectedCollabs = ref([])

// Cell selection (drag to select range) - date-based
const selecting = ref(false)
const selectChantierId = ref(null)
const selectDateStart = ref(null)
const selectDateEnd = ref(null)

const startSelectDate = (chantier, dateStr) => {
  selecting.value = true
  selectChantierId.value = chantier.id
  selectDateStart.value = dateStr
  selectDateEnd.value = dateStr
  modalChantier.value = chantier
}

const moveSelectDate = (chantierId, dateStr) => {
  if (!selecting.value || chantierId !== selectChantierId.value) return
  selectDateEnd.value = dateStr
}

const endSelectDate = (chantier, dateStr) => {
  if (!selecting.value) return
  selecting.value = false
  const start = selectDateStart.value < selectDateEnd.value ? selectDateStart.value : selectDateEnd.value
  const end = selectDateStart.value < selectDateEnd.value ? selectDateEnd.value : selectDateStart.value
  modalDateDebut.value = start
  modalDateFin.value = end
  selectedCollabs.value = []
  showModal.value = true
  selectChantierId.value = null
  selectDateStart.value = null
  selectDateEnd.value = null
}

const isSelectingDate = (chantierId, dateStr) => {
  if (!selecting.value || chantierId !== selectChantierId.value) return false
  const min = selectDateStart.value < selectDateEnd.value ? selectDateStart.value : selectDateEnd.value
  const max = selectDateStart.value < selectDateEnd.value ? selectDateEnd.value : selectDateStart.value
  return dateStr >= min && dateStr <= max
}

const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548', '#607D8B', '#E91E63', '#3F51B5']
const getColor = (idx) => colors[idx % colors.length]

const monthLabel = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value)
  if (visibleMonths.value === 1) {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }
  const endDate = new Date(currentYear.value, currentMonth.value + visibleMonths.value - 1)
  return `${date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} — ${endDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
})

// Generate all days for visible months
const allDays = computed(() => {
  const months = []
  for (let m = 0; m < visibleMonths.value; m++) {
    let yr = currentYear.value
    let mo = currentMonth.value + m
    if (mo > 11) { mo -= 12; yr++ }
    const count = new Date(yr, mo + 1, 0).getDate()
    const days = []
    for (let d = 1; d <= count; d++) {
      const date = new Date(yr, mo, d)
      const dateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        num: d,
        dateStr,
        label: date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2),
        monthShort: date.toLocaleDateString('fr-FR', { month: 'short' }).slice(0, 3),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      })
    }
    months.push({ year: yr, month: mo, days })
  }
  return months
})

const isCellActiveDate = (chantierId, dateStr) => {
  return planifications.value.some(p => p.chantier_id === chantierId && p.date === dateStr)
}

const getCellCollabsDate = (chantierId, dateStr) => {
  const personnelIds = planifications.value
    .filter(p => p.chantier_id === chantierId && p.date === dateStr)
    .map(p => p.personnel_id)
  return collaborateursActifs.value.filter(c => personnelIds.includes(c.id))
}

const chantiersActifs = computed(() => {
  return chantiers.value.filter(c => (c.stato_cantiere === 'a_commencer' || c.stato_cantiere === 'en_cours') && c.type !== 'interne')
})

const collaborateursActifs = computed(() => {
  const collabs = collaborateurs.value.filter(c => c.actif !== false).map(c => ({ ...c, role: 'collab' }))
  const chefs = chefDeChantiers.value.map(c => ({ ...c, role: 'chef' }))
  return [...chefs, ...collabs]
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
  const personnelIds = planifications.value
    .filter(p => p.chantier_id === chantierId && p.date === dateStr)
    .map(p => p.personnel_id)
  return collaborateursActifs.value.filter(c => personnelIds.includes(c.id))
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
    p => p.chantier_id === chantierId && p.personnel_id === collabId && p.date === dateStr
  )
  if (exists) return

  const { data, error } = await supabase
    .from('planification')
    .insert({ chantier_id: chantierId, personnel_id: collabId, date: dateStr })
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
    .eq('personnel_id', collabId)
    .eq('date', dateStr)

  if (!error) {
    planifications.value = planifications.value.filter(
      p => !(p.chantier_id === chantierId && p.personnel_id === collabId && p.date === dateStr)
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

const assignedInPeriod = computed(() => {
  if (!modalChantier.value || !modalDateDebut.value || !modalDateFin.value) return []
  const start = modalDateDebut.value
  const end = modalDateFin.value
  const personnelIds = [...new Set(
    planifications.value
      .filter(p => p.chantier_id === modalChantier.value.id && p.date >= start && p.date <= end)
      .map(p => p.personnel_id)
  )]
  return collaborateursActifs.value.filter(c => personnelIds.includes(c.id))
})

const removeOneFromPeriod = async (collabId) => {
  if (!modalChantier.value || !modalDateDebut.value || !modalDateFin.value) return
  const start = new Date(modalDateDebut.value)
  const end = new Date(modalDateFin.value)
  const dates = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0])
  }

  const { error } = await supabase
    .from('planification')
    .delete()
    .eq('chantier_id', modalChantier.value.id)
    .eq('personnel_id', collabId)
    .in('date', dates)

  if (!error) {
    planifications.value = planifications.value.filter(
      p => !(p.chantier_id === modalChantier.value.id && p.personnel_id === collabId && dates.includes(p.date))
    )
  }
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
        p => p.chantier_id === modalChantier.value.id && p.personnel_id === collabId && p.date === dateStr
      )
      if (!exists) {
        inserts.push({ chantier_id: modalChantier.value.id, personnel_id: collabId, date: dateStr })
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
    .in('personnel_id', selectedCollabs.value)
    .in('date', dates)

  if (!error) {
    planifications.value = planifications.value.filter(
      p => !(p.chantier_id === modalChantier.value.id && selectedCollabs.value.includes(p.personnel_id) && dates.includes(p.date))
    )
  }
  showModal.value = false
}

// Data loading
const loadPlanifications = async () => {
  // Carica per tutti i mesi visibili
  const startDate = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-01`
  let endYear = currentYear.value
  let endMonth = currentMonth.value + visibleMonths.value
  if (endMonth > 12) { endMonth -= 12; endYear++ }
  const endDay = new Date(endYear, endMonth, 0).getDate()
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-${endDay}`

  const { data, error } = await supabase
    .from('planification')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)

  if (!error) planifications.value = data || []
}

onMounted(async () => {
  const [chRes, collRes, chefRes] = await Promise.all([
    supabase.from('chantiers').select('*').order('nom'),
    supabase.from('collaborateurs').select('*').order('nom'),
    supabase.from('chefdechantiers').select('*').order('nom')
  ])

  chantiers.value = chRes.data || []
  collaborateurs.value = collRes.data || []
  chefDeChantiers.value = chefRes.data || []

  await loadPlanifications()
})
</script>

<style scoped>
.calendar-wrapper {
  overflow-x: auto;
  position: relative;
}

.calendar-table {
  min-width: max-content;
}

.calendar-table .sticky-col {
  position: sticky;
  left: 0;
  z-index: 3;
  min-width: 250px;
  max-width: 250px;
  background-color: #ffffff;
  box-shadow: 3px 0 6px rgba(0,0,0,0.15);
}

.calendar-table thead .sticky-col {
  z-index: 4;
  background-color: #f8f9fa;
}

/* Force opaque background - override Bootstrap */
.calendar-table td.sticky-col {
  background-color: #ffffff !important;
}

.calendar-table th.sticky-col {
  background-color: #f8f9fa !important;
}

.chantier-name {
  font-size: 0.65em;
  line-height: 1.2;
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

.selecting-cell {
  background-color: #bbdefb !important;
}

.active-cell {
  border: 1px solid #1976D2;
}

.month-separator {
  border-left: 3px solid #333 !important;
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
