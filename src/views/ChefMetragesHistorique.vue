<template>
  <div class="container py-4">
    <RetourButton :onClick="retourMetrages" />

    <h2 class="text-center mb-4">Historique des Métrages</h2>

    <!-- Info cantiere -->
    <div class="alert alert-info text-center mb-4" v-if="chantierInfo">
      <div><strong>Chantier:</strong> {{ chantierInfo.nom }} - {{ chantierInfo.adresse }}</div>
      <div v-if="chantierInfo.numeroDevis"><strong>Devis:</strong> {{ chantierInfo.numeroDevis }}</div>
      <div v-if="chantierInfo.client"><strong>Client:</strong> {{ chantierInfo.client }}</div>
    </div>

    <!-- Statistiques générales -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h4 class="text-primary">{{ historiqueMetrages.length }}</h4>
            <p class="mb-0">Métrages totaux</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h4 class="text-success">{{ totalMLGeneral.toFixed(2) }}</h4>
            <p class="mb-0">ML Total posé</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h4 class="text-info">{{ totalProduits }}</h4>
            <p class="mb-0">Produits traités</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h4 class="text-warning">{{ zonesUniques.length }}</h4>
            <p class="mb-0">Zones travaillées</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabella historique -->
    <div class="card">
      <div class="card-header">
        <h5>Liste des Métrages</h5>
      </div>
      <div class="card-body">
        <div v-if="historiqueMetrages.length === 0" class="text-center text-muted py-4">
          <h5>Aucun métrage trouvé</h5>
          <p>Aucun métrage n'a encore été enregistré pour ce chantier.</p>
        </div>
        <div v-else>
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>Date</th>
                <th>Statut</th>
                <th>Zones</th>
                <th>Produits</th>
                <th>ML Total</th>
                <th>Progression</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="metrage in historiqueMetrages" :key="metrage.id">
                <td>
                  <strong>{{ formatDate(metrage.createdAt) }}</strong>
                  <br>
                  <small class="text-muted">{{ formatTime(metrage.createdAt) }}</small>
                </td>
                <td>
                  <span class="badge" :class="metrage.draft ? 'bg-warning' : 'bg-success'">
                    {{ metrage.draft ? 'Brouillon' : 'Sauvegardé' }}
                  </span>
                </td>
                <td>
                  <span v-if="metrage.zones && metrage.zones.length > 0">
                    {{ metrage.zones.join(', ') }}
                  </span>
                  <span v-else class="text-muted">Toutes</span>
                </td>
                <td>
                  <strong>{{ metrage.totalProduits || 0 }}</strong>
                  <small class="text-muted">produits</small>
                </td>
                <td>
                  <strong>{{ metrage.totalML?.toFixed(2) || '0.00' }}</strong>
                  <small class="text-muted">ML</small>
                </td>
                <td>
                  <div class="progress" style="height: 20px;">
                    <div 
                      class="progress-bar" 
                      :class="getProgressBarClass(metrage)"
                      :style="{ width: getProgressPercentage(metrage) + '%' }"
                    >
                      {{ getProgressPercentage(metrage) }}%
                    </div>
                  </div>
                </td>
                <td>
                  <button 
                    class="btn btn-sm btn-primary" 
                    @click="voirMetrage(metrage)"
                    title="Voir ce métrage"
                  >
                    👁️ Voir
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Détails métrage sélectionné -->
    <div v-if="selectedMetrage" class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5>Détails du Métrage - {{ formatDate(selectedMetrage.createdAt) }}</h5>
        <button class="btn btn-sm btn-secondary" @click="selectedMetrage = null">✕ Fermer</button>
      </div>
      <div class="card-body">
        <!-- Info métrage -->
        <div class="row mb-3">
          <div class="col-md-3">
            <strong>Date:</strong> {{ formatDate(selectedMetrage.createdAt) }}
          </div>
          <div class="col-md-3">
            <strong>Statut:</strong> 
            <span class="badge" :class="selectedMetrage.draft ? 'bg-warning' : 'bg-success'">
              {{ selectedMetrage.draft ? 'Brouillon' : 'Sauvegardé' }}
            </span>
          </div>
          <div class="col-md-3">
            <strong>Produits:</strong> {{ selectedMetrage.totalProduits || 0 }}
          </div>
          <div class="col-md-3">
            <strong>ML Total:</strong> {{ selectedMetrage.totalML?.toFixed(2) || '0.00' }} ML
          </div>
        </div>

        <!-- Produits par zone -->
        <div v-if="selectedMetrage.items && selectedMetrage.items.length > 0">
          <h6>Produits par Zone</h6>
          <div v-for="(zone, zoneIndex) in getMetrageParZone(selectedMetrage.items)" :key="zone.nom" class="mb-4">
            <h6 class="text-primary">Zone: {{ zone.nom }}</h6>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Code Article</th>
                  <th>Produit</th>
                  <th>Taille</th>
                  <th>ML Prévue</th>
                  <th>ML Posée</th>
                  <th>Total ML</th>
                  <th>Progression</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in zone.produits" :key="item.id || item.nom">
                  <td>{{ item.article }}</td>
                  <td>{{ item.nom }}</td>
                  <td>{{ item.taille }}</td>
                  <td>{{ item.mlPrevue || 0 }}</td>
                  <td>{{ item.mlPosee || 0 }}</td>
                  <td><strong>{{ item.totalML?.toFixed(2) || '0.00' }}</strong></td>
                  <td>
                    <span class="badge" :class="getItemProgressClass(item)">
                      {{ getItemProgressPercentage(item) }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="text-end">
              <strong>Total Zone: {{ getZoneTotalML(zone.produits).toFixed(2) }} ML</strong>
            </div>
          </div>
        </div>
        <div v-else class="text-muted">
          Aucun produit dans ce métrage.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { db } from '@/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import RetourButton from '@/components/RetourButton.vue';

const router = useRouter();
const route = useRoute();
const chantierId = route.params.chantierId;

const chantierInfo = ref(null);
const historiqueMetrages = ref([]);
const selectedMetrage = ref(null);

const loadChantierInfo = async () => {
  try {
    const chantierDoc = await getDoc(doc(db, 'chantiers', chantierId));
    if (chantierDoc.exists()) {
      const chantierData = chantierDoc.data();
      chantierInfo.value = {
        nom: chantierData.nom,
        adresse: chantierData.adresse
      };

      // Carica info devis se disponibile
      if (chantierData.devisId) {
        const devisDoc = await getDoc(doc(db, 'devis', chantierData.devisId));
        if (devisDoc.exists()) {
          const devisData = devisDoc.data();
          chantierInfo.value.numeroDevis = devisData.numero;
          chantierInfo.value.client = devisData.nom;
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des infos chantier:', error);
  }
};

const loadHistorique = async () => {
  try {
    const q = query(collection(db, 'metrages'), where('chantierId', '==', chantierId));
    const snapshot = await getDocs(q);
    historiqueMetrages.value = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error);
  }
};

// Computed properties pour les statistiques
const totalMLGeneral = computed(() => {
  return historiqueMetrages.value.reduce((sum, metrage) => sum + (metrage.totalML || 0), 0);
});

const totalProduits = computed(() => {
  return historiqueMetrages.value.reduce((sum, metrage) => sum + (metrage.totalProduits || 0), 0);
});

const zonesUniques = computed(() => {
  const zones = new Set();
  historiqueMetrages.value.forEach(metrage => {
    if (metrage.zones) {
      metrage.zones.forEach(zone => zones.add(zone));
    }
  });
  return Array.from(zones);
});

// Fonctions utilitarie
const formatDate = (date) => {
  return date?.toDate ? date.toDate().toLocaleDateString('fr-FR') : new Date(date).toLocaleDateString('fr-FR');
};

const formatTime = (date) => {
  return date?.toDate ? date.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const getProgressPercentage = (metrage) => {
  // Calcola una progressione basata sui ML posati vs previsti
  if (!metrage.items || metrage.items.length === 0) return 0;
  
  let totalPrevue = 0;
  let totalPosee = 0;
  
  metrage.items.forEach(item => {
    totalPrevue += item.mlPrevue || 0;
    totalPosee += item.mlPosee || 0;
  });
  
  return totalPrevue > 0 ? Math.round((totalPosee / totalPrevue) * 100) : 0;
};

const getProgressBarClass = (metrage) => {
  const percentage = getProgressPercentage(metrage);
  if (percentage === 0) return 'bg-secondary';
  if (percentage < 50) return 'bg-danger';
  if (percentage < 100) return 'bg-warning';
  return 'bg-success';
};

const voirMetrage = (metrage) => {
  selectedMetrage.value = metrage;
};

const getMetrageParZone = (items) => {
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone].push(item);
  });
  return Object.entries(grouped).map(([nom, produits]) => ({ nom, produits }));
};

const getItemProgressPercentage = (item) => {
  const prevue = item.mlPrevue || 0;
  const posee = item.mlPosee || 0;
  return prevue > 0 ? Math.round((posee / prevue) * 100) : 0;
};

const getItemProgressClass = (item) => {
  const percentage = getItemProgressPercentage(item);
  if (percentage === 0) return 'bg-secondary';
  if (percentage < 50) return 'bg-danger';
  if (percentage < 100) return 'bg-warning';
  return 'bg-success';
};

const getZoneTotalML = (produits) => {
  return produits.reduce((sum, item) => sum + (item.totalML || 0), 0);
};

const retourMetrages = () => {
  router.push('/chef/metrages');
};

onMounted(async () => {
  await Promise.all([
    loadChantierInfo(),
    loadHistorique()
  ]);
});
</script>

<style scoped>
.progress {
  border-radius: 10px;
}

.card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.table th {
  border-top: none;
}
</style>