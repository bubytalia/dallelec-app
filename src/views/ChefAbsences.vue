<template>
  <div class="container py-5">
    <RetourButton to="/chef" />
    
    <h2 class="text-center mb-4">Gestion des Absences</h2>
    
    <!-- Form per aggiungere assenza -->
    <div class="row mb-4">
      <div class="col-md-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Demander une absence</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label>Type d'absence:</label>
                  <select v-model="newAbsence.type" class="form-control" required>
                    <option value="">Sélectionner</option>
                    <option value="vacances">Vacances</option>
                    <option value="maladie">Maladie</option>
                    <option value="accident">Accident</option>
                    <option value="vacances_sans_solde">Vacances sans solde</option>
                    <option value="cours">Cours</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label>Date de début:</label>
                  <input v-model="newAbsence.startDate" type="date" class="form-control" required />
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label>Date de fin:</label>
                  <input v-model="newAbsence.endDate" type="date" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label>Motif (optionnel):</label>
                  <input v-model="newAbsence.reason" type="text" class="form-control" placeholder="Ex: Ferie estive" />
                </div>
              </div>
            </div>
            <button @click="addAbsence" class="btn btn-primary" :disabled="!newAbsence.type || !newAbsence.startDate || !newAbsence.endDate">
              Demander l'absence
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista assenze attive -->
    <div class="row">
      <div class="col-md-12">
        <h5>Mes demandes d'absences</h5>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Type</th>
              <th>Période</th>
              <th>Statut</th>
              <th>Motif</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="absence in mesAbsences" :key="absence.id">
              <td>
                <span :class="getTypeClass(absence.type)">
                  {{ getTypeLabel(absence.type) }}
                </span>
              </td>
              <td>{{ formatDate(absence.startDate) }} - {{ formatDate(absence.endDate) }}</td>
              <td>
                <span :class="getStatusClass(absence.status)">
                  {{ getStatusLabel(absence.status) }}
                </span>
              </td>
              <td>{{ absence.reason || '-' }}</td>
              <td>
                <button v-if="absence.status === 'pending'" @click="requestCancellation(absence.id)" class="btn btn-warning btn-sm me-1">
                  Annuler la demande
                </button>
                <button v-if="absence.status === 'approved'" @click="requestCancellation(absence.id)" class="btn btn-warning btn-sm me-1">
                  Demander l'annulation
                </button>
                <span v-if="absence.status === 'cancellation_requested'" class="badge bg-info">
                  Annulation demandée
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Riepilogo assenze -->
    <div class="row mt-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Résumé de mes absences</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>Demandes en attente:</strong> {{ getAbsencesCount('pending') }}</p>
                <p><strong>Demandes approuvées:</strong> {{ getAbsencesCount('approved') }}</p>
                <p><strong>Demandes refusées:</strong> {{ getAbsencesCount('rejected') }}</p>
                <p><strong>Demandes d'annulation:</strong> {{ getAbsencesCount('cancellation_requested') }}</p>
                <p><strong>En absence aujourd'hui:</strong> 
                  <span :class="isAbsentToday() ? 'text-danger' : 'text-success'">
                    {{ isAbsentToday() ? 'Oui' : 'Non' }}
                  </span>
                </p>
              </div>
              <div class="col-md-6">
                <h6>Détail par type</h6>
                <div v-for="(count, type) in getAbsencesResume()" :key="type" class="mb-1">
                  <span :class="getTypeClass(type)" class="me-2">{{ getTypeLabel(type) }}</span>
                  <span>{{ count }} jours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendario assenze -->
    <div class="row mt-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Calendrier de mes absences</h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <label>Mois:</label>
                <input v-model="selectedMonth" type="month" class="form-control" @change="generateCalendar" />
              </div>
            </div>
            
            <div v-if="calendarData" class="calendar-container">
              <div class="calendar-header">
                <div class="calendar-weekdays">
                  <div class="calendar-day-header">Lun</div>
                  <div class="calendar-day-header">Mar</div>
                  <div class="calendar-day-header">Mer</div>
                  <div class="calendar-day-header">Jeu</div>
                  <div class="calendar-day-header">Ven</div>
                  <div class="calendar-day-header">Sam</div>
                  <div class="calendar-day-header">Dim</div>
                </div>
              </div>
              <div class="calendar-grid">
                <div v-for="week in calendarData.weeks" :key="week.weekNumber" class="calendar-week">
                  <div v-for="day in week.days" :key="day.date" 
                       :class="['calendar-day', { 'other-month': !day.isCurrentMonth, 'has-absence': day.absences.length > 0 }]">
                    <div class="day-number">{{ day.dayNumber }}</div>
                    <div v-for="absence in day.absences" :key="absence.id" 
                         :class="['absence-indicator', getTypeClass(absence.type), getStatusClass(absence.status)]">
                      {{ getTypeLabel(absence.type) }}
                      <small v-if="absence.status !== 'approved'">({{ getStatusLabel(absence.status) }})</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

const absences = ref([]);

const newAbsence = ref({
  type: '',
  startDate: '',
  endDate: '',
  reason: ''
});

const fetchAbsences = async () => {
  const snapshot = await getDocs(collection(db, 'absences'));
  absences.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const addAbsence = async () => {
  if (!newAbsence.value.type || !newAbsence.value.startDate || !newAbsence.value.endDate) return;
  
  console.log('Adding absence:', newAbsence.value);
  
  await addDoc(collection(db, 'absences'), {
    userId: 'chef@dallelec.com',
    type: newAbsence.value.type,
    startDate: newAbsence.value.startDate,
    endDate: newAbsence.value.endDate,
    reason: newAbsence.value.reason,
    status: 'pending',
    createdAt: new Date()
  });
  
  console.log('Absence added successfully');
  
  newAbsence.value = {
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  };
  fetchAbsences();
};

const deleteAbsence = async (id) => {
  if (confirm('Confirmer la suppression de cette demande ?')) {
    await deleteDoc(doc(db, 'absences', id));
    fetchAbsences();
  }
};

const requestCancellation = async (id) => {
  const absence = absences.value.find(a => a.id === id);
  if (!absence) return;
  
  let message = '';
  if (absence.status === 'pending') {
    message = 'Confirmer l\'annulation de cette demande en attente ?';
  } else if (absence.status === 'approved') {
    message = 'Confirmer la demande d\'annulation de cette absence approuvée ? L\'admin devra autoriser cette annulation.';
  }
  
  if (confirm(message)) {
    try {
      await updateDoc(doc(db, 'absences', id), {
        status: 'cancellation_requested',
        originalStatus: absence.status, // Salva lo status originale
        cancellationRequestedAt: new Date()
      });
      fetchAbsences();
    } catch (error) {
      console.error('Erreur lors de la demande d\'annulation:', error);
      alert('Erreur lors de la demande d\'annulation: ' + error.message);
    }
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'vacances': return 'Vacances';
    case 'maladie': return 'Maladie';
    case 'accident': return 'Accident';
    case 'vacances_sans_solde': return 'Vacances sans solde';
    case 'cours': return 'Cours';
    default: return type;
  }
};

const getTypeClass = (type) => {
  switch (type) {
    case 'vacances': return 'badge bg-success';
    case 'maladie': return 'badge bg-danger';
    case 'accident': return 'badge bg-warning';
    case 'vacances_sans_solde': return 'badge bg-info';
    case 'cours': return 'badge bg-secondary';
    default: return 'badge bg-secondary';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'approved': return 'Approuvée';
    case 'rejected': return 'Rejetée';
    case 'cancellation_requested': return 'Annulation demandée';
    default: return status;
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'badge bg-warning';
    case 'approved': return 'badge bg-success';
    case 'rejected': return 'badge bg-danger';
    case 'cancellation_requested': return 'badge bg-info';
    default: return 'badge bg-secondary';
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

const mesAbsences = computed(() => {
  return absences.value.filter(absence => absence.userId === 'chef@dallelec.com');
});

const getAbsencesCount = (status) => {
  return mesAbsences.value.filter(absence => absence.status === status).length;
};

const isAbsentToday = () => {
  const today = new Date().toISOString().split('T')[0];
  return mesAbsences.value.some(absence => 
    absence.status === 'approved' &&
    absence.startDate <= today && 
    absence.endDate >= today
  );
};

const getAbsencesResume = () => {
  const absencesApprouvees = mesAbsences.value.filter(absence => absence.status === 'approved');
  const resume = {};
  absencesApprouvees.forEach(absence => {
    const type = absence.type;
    if (resume[type]) {
      resume[type]++;
    } else {
      resume[type] = 1;
    }
  });
  return resume;
};

const generateCalendar = () => {
  const month = selectedMonth.value;
  const year = month.split('-')[0];
  const monthIndex = parseInt(month.split('-')[1], 10) - 1;

  console.log('Generating calendar for:', month);
  console.log('Mes absences:', mesAbsences.value);

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

  const newCalendarData = { weeks: [] };
  let currentWeek = [];

  // Add days from previous month if needed
  const firstDayOfWeek = firstDayOfMonth.getDay();
  if (firstDayOfWeek !== 1) { // Monday = 1
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const prevMonthLastDay = new Date(year, monthIndex, 0);
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const day = prevMonthLastDay.getDate() - i + 1;
      currentWeek.push({
        date: `${year}-${(monthIndex).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        dayNumber: day,
        isCurrentMonth: false,
        absences: []
      });
    }
  }

  // Add days of the current month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const absencesForDay = mesAbsences.value.filter(absence => 
      absence.startDate <= dateStr && 
      absence.endDate >= dateStr
    );

    if (absencesForDay.length > 0) {
      console.log('Found absences for day:', dateStr, absencesForDay);
    }

    currentWeek.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      absences: absencesForDay
    });

    if (currentWeek.length === 7) {
      newCalendarData.weeks.push({ weekNumber: newCalendarData.weeks.length + 1, days: currentWeek });
      currentWeek = [];
    }
  }

  // Add days from next month if needed
  if (currentWeek.length > 0) {
    const nextMonthFirstDay = new Date(year, monthIndex + 1, 1);
    for (let i = 1; currentWeek.length < 7; i++) {
      currentWeek.push({
        date: `${year}-${(monthIndex + 2).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`,
        dayNumber: i,
        isCurrentMonth: false,
        absences: []
      });
    }
    newCalendarData.weeks.push({ weekNumber: newCalendarData.weeks.length + 1, days: currentWeek });
  }

  calendarData.value = newCalendarData;
  console.log('Calendar data generated:', calendarData.value);
};

const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const calendarData = ref(null);

// Watch for changes to regenerate calendar
watch([selectedMonth, mesAbsences], () => {
  console.log('Watch triggered - selectedMonth:', selectedMonth.value, 'mesAbsences:', mesAbsences.value.length);
  generateCalendar();
});

onMounted(() => {
  fetchAbsences();
  generateCalendar();
});
</script>

<style scoped>
.calendar-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day-header {
  padding: 10px;
  text-align: center;
  font-weight: bold;
  border-right: 1px solid #ddd;
}

.calendar-day-header:last-child {
  border-right: none;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #ddd;
}

.calendar-week:last-child {
  border-bottom: none;
}

.calendar-day {
  min-height: 80px;
  padding: 5px;
  border-right: 1px solid #ddd;
  position: relative;
  background-color: white;
}

.calendar-day:last-child {
  border-right: none;
}

.calendar-day.other-month {
  background-color: #f8f9fa;
  color: #6c757d;
}

.calendar-day.has-absence {
  background-color: #fff3cd;
}

.day-number {
  font-weight: bold;
  margin-bottom: 5px;
}

.absence-indicator {
  font-size: 0.7em;
  padding: 2px 4px;
  margin: 1px 0;
  border-radius: 3px;
  color: white;
  text-align: center;
}

.badge-sm {
  font-size: 0.7em;
  padding: 2px 6px;
}
</style>

