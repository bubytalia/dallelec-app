<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Gestion des Absences</h2>

    <!-- Statistiques -->
    <div class="row mb-4">
      <div class="col-md-2">
        <div class="card bg-warning text-white text-center">
          <div class="card-body">
            <h6>En Attente</h6>
            <h4>{{ absencesEnAttente.length }}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card bg-success text-white text-center">
          <div class="card-body">
            <h6>Approuvées</h6>
            <h4>{{ absencesApprouvees.length }}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card bg-danger text-white text-center">
          <div class="card-body">
            <h6>Refusées</h6>
            <h4>{{ absencesRefusees.length }}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card bg-info text-white text-center">
          <div class="card-body">
            <h6>Annulations</h6>
            <h4>{{ absencesAnnulation.length }}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card bg-primary text-white text-center">
          <div class="card-body">
            <h6>Vacances</h6>
            <h4>{{ vacancesApprouvees.length }}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card bg-dark text-white text-center">
          <div class="card-body">
            <h6>Maladies</h6>
            <h4>{{ maladiesApprouvees.length }}</h4>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="row mb-3">
      <div class="col-md-4">
        <label>Filtrer par statut:</label>
        <select v-model="filtreStatut" class="form-control">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Refusées</option>
          <option value="cancellation_requested">Annulations demandées</option>
        </select>
      </div>
      <div class="col-md-4">
        <label>Filtrer par type:</label>
        <select v-model="filtreType" class="form-control">
          <option value="">Tous les types</option>
          <option value="vacances">Vacances</option>
          <option value="maladie">Maladie</option>
          <option value="accident">Accident</option>
          <option value="jour_ferie">Jour férié</option>
          <option value="vacances_sans_solde">Vacances sans solde</option>
          <option value="conge_paternite">Congé paternité</option>
          <option value="conge_deces">Congé décès</option>
          <option value="cours">Cours</option>
        </select>
      </div>
      <div class="col-md-4">
        <label>Mois:</label>
        <input v-model="filtreMois" type="month" class="form-control" />
      </div>
    </div>

    <!-- Liste des demandes -->
    <div class="card">
      <div class="card-header">
        <h5>Demandes d'absences ({{ absencesFiltrees.length }})</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Type</th>
                <th>Période</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Date demande</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="absence in absencesFiltrees" :key="absence.id">
                <td><strong>{{ getUserName(absence.user_id || absence.userId) }}</strong></td>
                <td>
                  <span :class="getTypeClass(absence.type)">
                    {{ getTypeLabel(absence.type) }}
                  </span>
                </td>
                <td>{{ formatDate(absence.start_date || absence.startDate) }} - {{ formatDate(absence.end_date || absence.endDate) }}</td>
                <td>{{ absence.reason || '-' }}</td>
                <td>
                  <span :class="getStatusClass(absence.status)">
                    {{ getStatusLabel(absence.status) }}
                  </span>
                </td>
                <td>{{ formatDate(absence.created_at || absence.createdAt) }}</td>
                <td>
                  <button v-if="absence.status === 'pending'" @click="approuverAbsence(absence)" class="btn btn-success btn-sm me-1">
                    ✅ Approuver
                  </button>
                  <button v-if="absence.status === 'pending'" @click="refuserAbsence(absence)" class="btn btn-danger btn-sm me-1">
                    ❌ Refuser
                  </button>
                  <button v-if="absence.status === 'cancellation_requested'" @click="approuverAnnulation(absence)" class="btn btn-warning btn-sm me-1">
                    ✅ Approuver annulation
                  </button>
                  <button v-if="absence.status === 'cancellation_requested'" @click="refuserAnnulation(absence)" class="btn btn-secondary btn-sm">
                    ❌ Refuser annulation
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="absencesFiltrees.length === 0" class="text-center text-muted py-4">
            Aucune demande d'absence correspondant aux filtres
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

const absences = ref([]);
const collaborateurs = ref([]);
const filtreStatut = ref('');
const filtreType = ref('');
const filtreMois = ref('');

const absencesEnAttente = computed(() => 
  absences.value.filter(a => a.status === 'pending')
);

const absencesApprouvees = computed(() => 
  absences.value.filter(a => a.status === 'approved')
);

const absencesRefusees = computed(() => 
  absences.value.filter(a => a.status === 'rejected')
);

const absencesAnnulation = computed(() => 
  absences.value.filter(a => a.status === 'cancellation_requested')
);

const vacancesApprouvees = computed(() => 
  absences.value.filter(a => a.status === 'approved' && a.type === 'vacances')
);

const maladiesApprouvees = computed(() => 
  absences.value.filter(a => a.status === 'approved' && a.type === 'maladie')
);

const absencesFiltrees = computed(() => {
  let filtered = absences.value;
  
  if (filtreStatut.value) {
    filtered = filtered.filter(a => a.status === filtreStatut.value);
  }
  
  if (filtreType.value) {
    filtered = filtered.filter(a => a.type === filtreType.value);
  }
  
  if (filtreMois.value) {
    filtered = filtered.filter(a => {
      const startDate = a.start_date || a.startDate;
      const endDate = a.end_date || a.endDate;
      return startDate.startsWith(filtreMois.value) || endDate.startsWith(filtreMois.value);
    });
  }
  
  return filtered.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
});

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

const fetchCollaborateurs = async () => {
  try {
    const { data: collabs } = await supabase.from('collaborateurs').select('*');
    const { data: chefs } = await supabase.from('chefdechantiers').select('*');
    
    collaborateurs.value = [
      ...(chefs || []).map(c => ({ email: c.email, nom: `${c.nom} ${c.prenom}`, type: 'chef' })),
      ...(collabs || []).map(c => ({ email: c.email, nom: `${c.nom} ${c.prenom}`, type: 'ouvrier' }))
    ];
  } catch (error) {
    console.error('Erreur chargement collaborateurs:', error);
  }
};

const getUserName = (userId) => {
  const user = collaborateurs.value.find(c => c.email === userId);
  return user ? user.nom : userId;
};

const approuverAbsence = async (absence) => {
  if (!confirm('Approuver cette demande d\'absence ?')) return;
  
  try {
    const { error } = await supabase
      .from('absences')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'admin'
      })
      .eq('id', absence.id);
    
    if (error) throw error;
    alert('Absence approuvée');
    fetchAbsences();
  } catch (error) {
    console.error('Erreur approbation:', error);
    alert('Erreur: ' + error.message);
  }
};

const refuserAbsence = async (absence) => {
  const motif = prompt('Motif du refus (optionnel):');
  if (motif === null) return;
  
  try {
    const { error } = await supabase
      .from('absences')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: 'admin',
        rejection_reason: motif
      })
      .eq('id', absence.id);
    
    if (error) throw error;
    alert('Absence refusée');
    fetchAbsences();
  } catch (error) {
    console.error('Erreur refus:', error);
    alert('Erreur: ' + error.message);
  }
};

const approuverAnnulation = async (absence) => {
  if (!confirm('Approuver l\'annulation de cette absence ?')) return;
  
  try {
    const { error } = await supabase
      .from('absences')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'admin'
      })
      .eq('id', absence.id);
    
    if (error) throw error;
    alert('Annulation approuvée');
    fetchAbsences();
  } catch (error) {
    console.error('Erreur annulation:', error);
    alert('Erreur: ' + error.message);
  }
};

const refuserAnnulation = async (absence) => {
  try {
    const { error } = await supabase
      .from('absences')
      .update({
        status: absence.original_status || 'approved'
      })
      .eq('id', absence.id);
    
    if (error) throw error;
    alert('Annulation refusée - absence maintenue');
    fetchAbsences();
  } catch (error) {
    console.error('Erreur refus annulation:', error);
    alert('Erreur: ' + error.message);
  }
};

const getTypeLabel = (type) => {
  const labels = {
    vacances: 'Vacances',
    maladie: 'Maladie',
    accident: 'Accident',
    jour_ferie: 'Jour férié',
    vacances_sans_solde: 'Vacances sans solde',
    conge_paternite: 'Congé paternité',
    conge_deces: 'Congé décès',
    cours: 'Cours'
  };
  return labels[type] || type;
};

const getTypeClass = (type) => {
  const classes = {
    vacances: 'badge bg-success',
    maladie: 'badge bg-danger',
    accident: 'badge bg-warning',
    jour_ferie: 'badge bg-primary',
    vacances_sans_solde: 'badge bg-info',
    conge_paternite: 'badge bg-success',
    conge_deces: 'badge bg-dark',
    cours: 'badge bg-secondary'
  };
  return classes[type] || 'badge bg-secondary';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    approved: 'Approuvée',
    rejected: 'Refusée',
    cancellation_requested: 'Annulation demandée',
    cancelled: 'Annulée'
  };
  return labels[status] || status;
};

const getStatusClass = (status) => {
  const classes = {
    pending: 'badge bg-warning',
    approved: 'badge bg-success',
    rejected: 'badge bg-danger',
    cancellation_requested: 'badge bg-info',
    cancelled: 'badge bg-secondary'
  };
  return classes[status] || 'badge bg-secondary';
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

onMounted(() => {
  fetchAbsences();
  fetchCollaborateurs();
});
</script>

<style scoped>
.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>