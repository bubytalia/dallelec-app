<template>
  <div class="container py-5">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Gestion des Demandes de Congés</h2>
    
    <!-- Alert per nuove richieste -->
    <div v-if="nouvellesDemandes.length > 0" class="alert alert-info alert-dismissible fade show" role="alert">
      <strong>Nouvelles demandes:</strong> {{ nouvellesDemandes.length }} demande(s) en attente d'autorisation
      <button type="button" class="btn-close" @click="dismissAlert"></button>
    </div>

    <!-- Richieste in attesa -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Demandes en attente ({{ demandesEnAttente.length }})</h5>
          </div>
          <div class="card-body">
            <div v-if="demandesEnAttente.length === 0" class="text-center text-muted">
              Aucune demande en attente
            </div>
            <div v-else>
              <div v-for="demande in demandesEnAttente" :key="demande.id" class="card mb-3">
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-6">
                      <h6>{{ getUserName(demande.user_id || demande.userId) }}</h6>
                      <p><strong>Type:</strong> 
                        <span :class="getTypeClass(demande.type)">
                          {{ getTypeLabel(demande.type) }}
                        </span>
                      </p>
                      <p><strong>Période:</strong> {{ formatDate(demande.start_date || demande.startDate) }} - {{ formatDate(demande.end_date || demande.endDate) }}</p>
                      <p v-if="demande.reason"><strong>Motif:</strong> {{ demande.reason }}</p>
                      <p><strong>Demandé le:</strong> {{ formatDate(demande.created_at || demande.createdAt) }}</p>
                    </div>
                    <div class="col-md-6 text-end">
                      <button @click="autoriserDemande(demande.id)" class="btn btn-success me-2">
                        <i class="fas fa-check"></i> Autoriser
                      </button>
                      <button @click="refuserDemande(demande.id)" class="btn btn-danger">
                        <i class="fas fa-times"></i> Refuser
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Richieste di cancellazione -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Demandes d'annulation ({{ demandesAnnulation.length }})</h5>
          </div>
          <div class="card-body">
            <div v-if="demandesAnnulation.length === 0" class="text-center text-muted">
              Aucune demande d'annulation
            </div>
            <div v-else>
              <div v-for="demande in demandesAnnulation" :key="demande.id" class="card mb-3 border-warning">
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-6">
                      <h6>{{ getUserName(demande.user_id || demande.userId) }}</h6>
                      <p><strong>Type:</strong> 
                        <span :class="getTypeClass(demande.type)">
                          {{ getTypeLabel(demande.type) }}
                        </span>
                      </p>
                      <p><strong>Période:</strong> {{ formatDate(demande.start_date || demande.startDate) }} - {{ formatDate(demande.end_date || demande.endDate) }}</p>
                      <p v-if="demande.reason"><strong>Motif:</strong> {{ demande.reason }}</p>
                      <p><strong>Demande d'annulation le:</strong> {{ formatDate(demande.cancellation_requested_at || demande.cancellationRequestedAt) }}</p>
                      <p><strong>Statut original:</strong> 
                        <span :class="getStatusClass(demande.original_status || demande.originalStatus || 'pending')">
                          {{ getStatusLabel(demande.original_status || demande.originalStatus || 'pending') }}
                        </span>
                      </p>
                    </div>
                    <div class="col-md-6 text-end">
                      <button @click="autoriserAnnulation(demande.id)" class="btn btn-success me-2">
                        <i class="fas fa-check"></i> Autoriser l'annulation
                      </button>
                      <button @click="refuserAnnulation(demande.id)" class="btn btn-warning">
                        <i class="fas fa-times"></i> Refuser l'annulation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistiche -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Statistiques des congés</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-primary">{{ demandesEnAttente.length }}</h4>
                  <p>En attente</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-success">{{ demandesAutorisees.length }}</h4>
                  <p>Autorisées</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-danger">{{ demandesRefusees.length }}</h4>
                  <p>Refusées</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-info">{{ totalDemandes }}</h4>
                  <p>Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendario con tutte le ferie -->
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Calendrier des congés</h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <label>Mois:</label>
                <input v-model="selectedMonth" type="month" class="form-control" @change="generateCalendar" />
              </div>
              <div class="col-md-6">
                <label>Filtrer par statut:</label>
                <select v-model="selectedStatus" class="form-control">
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Autorisées</option>
                  <option value="rejected">Refusées</option>
                </select>
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
                         :class="['absence-indicator', getStatusClass(absence.status), getTypeClass(absence.type)]">
                      {{ getTypeLabel(absence.type) }}
                      <small>({{ getStatusLabel(absence.status) }})</small>
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
import { supabase } from '../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

const collaborateurs = ref([]);
const absences = ref([]);
const nouvellesDemandes = ref([]);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const selectedStatus = ref('');
const calendarData = ref(null);

const fetchCollaborateurs = async () => {
  // TODO: Convertire a Supabase quando necessario
  collaborateurs.value = [];
};

const fetchAbsences = async () => {
  try {
    const { data, error } = await supabase
      .from('absences')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    absences.value = data || [];
  } catch (error) {
    console.error('Erreur chargement absences:', error);
  }
};

const demandesEnAttente = computed(() => {
  return absences.value.filter(absence => absence.status === 'pending');
});

const demandesAutorisees = computed(() => {
  return absences.value.filter(absence => absence.status === 'approved');
});

const demandesRefusees = computed(() => {
  return absences.value.filter(absence => absence.status === 'rejected');
});

const demandesAnnulation = computed(() => {
  return absences.value.filter(absence => absence.status === 'cancellation_requested');
});

const totalDemandes = computed(() => {
  return absences.value.length;
});

const getUserName = (userId) => {
  if (userId === 'chef@dallelec.com') return 'Chef de Chantier';
  const collab = collaborateurs.value.find(c => c.email === userId);
  return collab ? `${collab.nom} ${collab.prenom}` : userId;
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
    case 'vacances': return 'bg-success';
    case 'maladie': return 'bg-danger';
    case 'accident': return 'bg-warning';
    case 'vacances_sans_solde': return 'bg-info';
    case 'cours': return 'bg-secondary';
    default: return 'bg-secondary';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'approved': return 'Autorisé';
    case 'rejected': return 'Refusé';
    case 'cancellation_requested': return 'Demande d\'annulation';
    default: return status;
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'bg-warning';
    case 'approved': return 'bg-success';
    case 'rejected': return 'bg-danger';
    case 'cancellation_requested': return 'bg-warning';
    default: return 'bg-secondary';
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

const autoriserDemande = async (id) => {
  if (confirm('Autoriser cette demande de congé ?')) {
    try {
      const { error } = await supabase
        .from('absences')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'admin@dallelec.com'
        })
        .eq('id', id);
      
      if (error) throw error;
      await notifyUser(id, 'approved');
      fetchAbsences();
    } catch (error) {
      console.error('Erreur lors de l\'autorisation:', error);
    }
  }
};

const refuserDemande = async (id) => {
  if (confirm('Refuser cette demande de congé ?')) {
    try {
      const { error } = await supabase
        .from('absences')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: 'admin@dallelec.com'
        })
        .eq('id', id);
      
      if (error) throw error;
      await notifyUser(id, 'rejected');
      fetchAbsences();
    } catch (error) {
      console.error('Erreur lors du refus:', error);
    }
  }
};

const autoriserAnnulation = async (id) => {
  if (confirm('Autoriser l\'annulation de cette demande de congé ?')) {
    try {
      const { error } = await supabase
        .from('absences')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await notifyUser(id, 'cancellation_approved');
      fetchAbsences();
    } catch (error) {
      console.error('Erreur lors de l\'autorisation de l\'annulation:', error);
    }
  }
};

const refuserAnnulation = async (id) => {
  if (confirm('Refuser l\'annulation de cette demande de congé ?')) {
    try {
      const absence = absences.value.find(a => a.id === id);
      const originalStatus = absence.original_status || absence.originalStatus || 'pending';
      
      const { error } = await supabase
        .from('absences')
        .update({
          status: originalStatus,
          updated_at: new Date().toISOString(),
          updated_by: 'admin@dallelec.com'
        })
        .eq('id', id);
      
      if (error) throw error;
      await notifyUser(id, 'cancellation_rejected');
      fetchAbsences();
    } catch (error) {
      console.error('Erreur lors du refus de l\'annulation:', error);
    }
  }
};

const notifyUser = async (absenceId, status) => {
  // TODO: Implementare notifica push con Firebase Cloud Messaging
  console.log(`Notifica ${status} per assenza ${absenceId}`);
};

const dismissAlert = () => {
  nouvellesDemandes.value = [];
};

const generateCalendar = () => {
  const month = selectedMonth.value;
  const year = month.split('-')[0];
  const monthIndex = parseInt(month.split('-')[1], 10) - 1;

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

  const calendarData = { weeks: [] };
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
    const absencesForDay = absences.value.filter(absence => 
      (absence.start_date || absence.startDate) <= dateStr && 
      (absence.end_date || absence.endDate) >= dateStr &&
      (selectedStatus.value === '' || absence.status === selectedStatus.value)
    );

    currentWeek.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      absences: absencesForDay
    });

    if (currentWeek.length === 7) {
      calendarData.weeks.push({ weekNumber: calendarData.weeks.length + 1, days: currentWeek });
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
    calendarData.weeks.push({ weekNumber: calendarData.weeks.length + 1, days: currentWeek });
  }

  calendarData.value = calendarData;
};

// Watch for changes to regenerate calendar
watch([selectedMonth, selectedStatus, absences], () => {
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
</style>
