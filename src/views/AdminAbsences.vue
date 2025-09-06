<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Gestion des Absences</h2>

    <!-- Statistiques -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-warning text-white text-center">
          <div class="card-body">
            <h6>En Attente</h6>
            <h4>{{ absencesEnAttente.length }}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white text-center">
          <div class="card-body">
            <h6>Approuvées</h6>
            <h4>{{ absencesApprouvees.length }}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-danger text-white text-center">
          <div class="card-body">
            <h6>Refusées</h6>
            <h4>{{ absencesRefusees.length }}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white text-center">
          <div class="card-body">
            <h6>Annulations</h6>
            <h4>{{ absencesAnnulation.length }}</h4>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des demandes -->
    <div class="card">
      <div class="card-header">
        <h5>Demandes d'absences</h5>
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
              <tr v-for="absence in absences" :key="absence.id">
                <td><strong>{{ absence.user_id || absence.userId }}</strong></td>
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
          
          <div v-if="absences.length === 0" class="text-center text-muted py-4">
            Aucune demande d'absence
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
    vacances_sans_solde: 'Vacances sans solde',
    cours: 'Cours'
  };
  return labels[type] || type;
};

const getTypeClass = (type) => {
  const classes = {
    vacances: 'badge bg-success',
    maladie: 'badge bg-danger',
    accident: 'badge bg-warning',
    vacances_sans_solde: 'badge bg-info',
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

onMounted(fetchAbsences);
</script>

<style scoped>
.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>