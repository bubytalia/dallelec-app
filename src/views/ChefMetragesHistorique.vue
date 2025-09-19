<template>
  <div class="container py-4">
    <RetourButton to="/chef" />
    
    <h2 class="text-center mb-4">Historique Métrages</h2>
    
    <!-- Filtres -->
    <div class="row mb-4">
      <div class="col-md-6">
        <select v-model="filtreChantier" class="form-select" @change="loadMetrages">
          <option value="">Tous les chantiers</option>
          <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
            {{ chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '' }}{{ chantier.nom }}
          </option>
        </select>
      </div>
      <div class="col-md-6">
        <select v-model="filtreStatut" class="form-select" @change="loadMetrages">
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="approved">Approuvé</option>
          <option value="rejected">Refusé</option>
        </select>
      </div>
    </div>

    <!-- Liste métrages -->
    <div class="card">
      <div class="card-header">
        <h5>Métrages soumis</h5>
      </div>
      <div class="card-body">
        <div v-if="metrages.length === 0" class="text-center text-muted py-4">
          Aucun métrage trouvé
        </div>
        <div v-else class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Chantier</th>
                <th>Période</th>
                <th>Total ML</th>
                <th>Régies</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="metrage in metragesFiltres" :key="metrage.id">
                <td>{{ formatDate(metrage.created_at) }}</td>
                <td>{{ getChantierName(metrage.chantier_id) }}</td>
                <td>
                  <span v-if="metrage.type === 'resoconto'" class="badge bg-info me-1">📊 Percentuel</span>
                  <span v-else class="badge bg-secondary me-1">📏 Métrage</span>
                  {{ formatPeriode(metrage) }}
                </td>
                <td>
                  <span v-if="metrage.type === 'resoconto'">
                    {{ Object.keys(metrage.avancementi || {}).join(', ') }}
                  </span>
                  <span v-else>
                    {{ (metrage.total_ml || 0).toFixed(2) }} ML
                  </span>
                </td>
                <td>{{ (metrage.regies?.length || 0) }} régies</td>
                <td>
                  <span class="badge" :class="getStatutClass(metrage.status)">
                    {{ getStatutLabel(metrage.status) }}
                  </span>
                  <div v-if="metrage.status === 'rejected' && metrage.rejection_reason" class="small text-danger mt-1">
                    {{ metrage.rejection_reason }}
                  </div>
                </td>
                <td>
                  <button @click="voirDetail(metrage)" class="btn btn-sm btn-info me-1">
                    👁 Voir détail
                  </button>
                  <button @click="eliminerMetrage(metrage)" class="btn btn-sm btn-danger" title="Supprimer ce métrage">
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Détail Métrage -->
    <div v-if="showDetail" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5>Détail Métrage - {{ getChantierName(detailMetrage.chantier_id) }}</h5>
            <button @click="showDetail = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <!-- Informations générales -->
            <div class="row mb-4">
              <div class="col-md-6">
                <h6>Informations</h6>
                <p><strong>Chantier:</strong> {{ getChantierName(detailMetrage.chantier_id) }}</p>
                <p><strong>Date soumission:</strong> {{ formatDate(detailMetrage.created_at) }}</p>
                <p><strong>Période:</strong> {{ formatPeriode(detailMetrage) }}</p>
                <p><strong>Total ML:</strong> {{ (detailMetrage.total_ml || 0).toFixed(2) }} ML</p>
              </div>
              <div class="col-md-6">
                <h6>Statut Admin</h6>
                <span class="badge fs-6" :class="getStatutClass(detailMetrage.status)">
                  {{ getStatutLabel(detailMetrage.status) }}
                </span>
                <div v-if="detailMetrage.approved_at" class="mt-2">
                  <small class="text-success">Approuvé le {{ formatDate(detailMetrage.approved_at) }}</small>
                </div>
                <div v-if="detailMetrage.rejected_at" class="mt-2">
                  <small class="text-danger">Refusé le {{ formatDate(detailMetrage.rejected_at) }}</small>
                  <div v-if="detailMetrage.rejection_reason" class="text-danger">
                    <strong>Motif:</strong> {{ detailMetrage.rejection_reason }}
                  </div>
                </div>
                <div v-if="detailMetrage.facture_numero" class="mt-2">
                  <small class="text-info">Facturé: {{ detailMetrage.facture_numero }}</small>
                </div>
              </div>
            </div>

            <!-- Métrages par zone -->
            <div v-if="detailMetrage.items && detailMetrage.items.length > 0">
              <h6>Métrages par zone</h6>
              <div v-for="(items, zone) in itemsByZone" :key="zone" class="mb-4">
                <h6 class="bg-light p-2">Zone: {{ zone }}</h6>
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Produit</th>
                      <th>Taille</th>
                      <th>ML Posé</th>
                      <th>Suppléments</th>
                      <th>Total ML</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in items" :key="item.article">
                      <td>{{ item.article }}</td>
                      <td>{{ item.nom }}</td>
                      <td>{{ item.taille }}</td>
                      <td>{{ (item.mlPosee || 0).toFixed(2) }}</td>
                      <td>
                        <div v-if="item.supplements && item.supplements.length > 0">
                          <div v-for="supp in item.supplements" :key="supp.supplement" class="small">
                            {{ supp.supplement }}: {{ supp.qtePosee || supp.qte }}
                          </div>
                        </div>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td><strong>{{ (item.totalML || 0).toFixed(2) }}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Régies -->
            <div v-if="detailMetrage.regies && detailMetrage.regies.length > 0" class="mt-4">
              <h6>Régies</h6>
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Heures</th>
                    <th>Prix/h</th>
                    <th>Total</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="regie in detailMetrage.regies" :key="regie.zone + regie.description">
                    <td>{{ regie.zone }}</td>
                    <td>{{ regie.heures }}h</td>
                    <td>{{ regie.prixHeure }} CHF</td>
                    <td><strong>{{ (regie.heures * regie.prixHeure).toFixed(2) }} CHF</strong></td>
                    <td>{{ regie.description }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="table-warning">
                    <td colspan="3"><strong>Total Régies:</strong></td>
                    <td><strong>{{ totalRegies.toFixed(2) }} CHF</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showDetail = false" class="btn btn-secondary">Fermer</button>
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

const metrages = ref([]);
const resocontiPercentuali = ref([]);
const chantiers = ref([]);
const filtreChantier = ref('');
const filtreStatut = ref('');
const showDetail = ref(false);
const detailMetrage = ref({});

const metragesFiltres = computed(() => {
  // Combina métrages e resoconti percentuali
  const allItems = [
    ...metrages.value.map(m => ({ ...m, type: 'metrage' })),
    ...resocontiPercentuali.value.map(r => ({ ...r, type: 'resoconto' }))
  ];
  
  let filtered = allItems;
  
  if (filtreChantier.value) {
    filtered = filtered.filter(m => m.chantier_id == filtreChantier.value);
  }
  
  if (filtreStatut.value) {
    filtered = filtered.filter(m => m.status === filtreStatut.value);
  }
  
  return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
});

const itemsByZone = computed(() => {
  if (!detailMetrage.value.items) return {};
  
  const grouped = {};
  detailMetrage.value.items.forEach(item => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone].push(item);
  });
  
  return grouped;
});

const totalRegies = computed(() => {
  if (!detailMetrage.value.regies) return 0;
  return detailMetrage.value.regies.reduce((sum, r) => sum + (r.heures * r.prixHeure), 0);
});

const loadChantiers = async () => {
  const userEmail = localStorage.getItem('userEmail');
  console.log('🔍 Email from localStorage:', userEmail);
  
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .select('*')
      .eq('capocantiere', userEmail)
      .order('nom');
    
    if (error) throw error;
    chantiers.value = data || [];
  } catch (error) {
    console.error('Erreur chargement chantiers:', error);
  }
};

const loadMetrages = async () => {
  const userEmail = localStorage.getItem('userEmail');
  
  try {
    // Carica métrages dei chantiers del chef
    const chantierIds = chantiers.value.map(c => c.id);
    
    if (chantierIds.length === 0) {
      metrages.value = [];
      resocontiPercentuali.value = [];
      return;
    }
    
    // Carica métrages
    const { data: metragesData, error: metragesError } = await supabase
      .from('metrages')
      .select('*')
      .in('chantier_id', chantierIds)
      .eq('draft', false)
      .order('created_at', { ascending: false });
    
    if (metragesError) throw metragesError;
    metrages.value = metragesData || [];
    
    // Carica resoconti percentuali
    const { data: resocontiData, error: resocontiError } = await supabase
      .from('resoconti_percentuali')
      .select('*')
      .in('chantier_id', chantierIds)
      .eq('draft', false)
      .order('created_at', { ascending: false });
    
    if (resocontiError) throw resocontiError;
    resocontiPercentuali.value = resocontiData || [];
    
  } catch (error) {
    console.error('Erreur chargement données:', error);
    metrages.value = [];
    resocontiPercentuali.value = [];
  }
};

const voirDetail = (metrage) => {
  detailMetrage.value = metrage;
  showDetail.value = true;
};

const eliminerMetrage = async (metrage) => {
  if (!confirm(`Supprimer définitivement ce métrage du ${formatDate(metrage.created_at)} ?\n\nCette action est irréversible.`)) return;
  
  try {
    const { error } = await supabase
      .from('metrages')
      .delete()
      .eq('id', metrage.id);
    
    if (error) throw error;
    
    alert('Métrage supprimé avec succès');
    await loadMetrages();
  } catch (error) {
    console.error('Erreur suppression métrage:', error);
    alert('Erreur: ' + error.message);
  }
};

const getChantierName = (id) => {
  const chantier = chantiers.value.find(c => c.id == id);
  if (!chantier) return 'N/A';
  const numero = chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '';
  return `${numero}${chantier.nom}`;
};

const getStatutLabel = (status) => {
  // Se non ha status definito, è in attesa
  if (!status) return 'En attente';
  
  const labels = {
    en_attente: 'En attente',
    approved: 'Approuvé',
    rejected: 'Refusé'
  };
  return labels[status] || 'En attente';
};

const getStatutClass = (status) => {
  // Se non ha status definito, è in attesa
  if (!status) return 'bg-warning';
  
  const classes = {
    en_attente: 'bg-warning',
    approved: 'bg-success',
    rejected: 'bg-danger'
  };
  return classes[status] || 'bg-warning';
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

const formatPeriode = (item) => {
  // Per resoconti percentuali
  if (item.type === 'resoconto' && item.periode_month) {
    return item.periode_month;
  }
  
  // Per métrages
  if (item.periode_debut && item.periode_fin) {
    return `${item.periode_debut} - ${item.periode_fin}`;
  }
  if (item.periode_debut) {
    return `Du ${item.periode_debut}`;
  }
  return '-';
};

onMounted(async () => {
  await loadChantiers();
  await loadMetrages();
});
</script>

<style scoped>
.modal {
  z-index: 1050;
}
</style>