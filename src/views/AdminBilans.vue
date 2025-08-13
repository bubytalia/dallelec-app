<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Bilans Financiers</h2>

    <!-- KPI Cards -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body text-center">
            <h5>Chiffre d'Affaires</h5>
            <h3>{{ formatCurrency(kpis.chiffreAffaires) }}</h3>
            <small>Total devis approuvés</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-white">
          <div class="card-body text-center">
            <h5>Coûts Totaux</h5>
            <h3>{{ formatCurrency(kpis.coutsTotaux) }}</h3>
            <small>Heures + Intérimaires</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body text-center">
            <h5>Marge Brute</h5>
            <h3>{{ formatCurrency(kpis.margeBrute) }}</h3>
            <small>{{ kpis.margePourcentage }}%</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body text-center">
            <h5>Chantiers Actifs</h5>
            <h3>{{ kpis.chantiersActifs }}</h3>
            <small>En cours</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Bilans -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Types de Bilans</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3 mb-3">
                <button @click="showBilanType = 'chantiers'" 
                        :class="['btn w-100', showBilanType === 'chantiers' ? 'btn-primary' : 'btn-outline-primary']">
                  📊 Bilans par Chantier
                </button>
              </div>
              <div class="col-md-3 mb-3">
                <button @click="showBilanType = 'mensuel'" 
                        :class="['btn w-100', showBilanType === 'mensuel' ? 'btn-primary' : 'btn-outline-primary']">
                  📅 Bilans Mensuels
                </button>
              </div>
              <div class="col-md-3 mb-3">
                <button @click="showBilanType = 'clients'" 
                        :class="['btn w-100', showBilanType === 'clients' ? 'btn-primary' : 'btn-outline-primary']">
                  👥 Bilans par Client
                </button>
              </div>
              <div class="col-md-3 mb-3">
                <button @click="showBilanType = 'dashboard'" 
                        :class="['btn w-100', showBilanType === 'dashboard' ? 'btn-primary' : 'btn-outline-primary']">
                  📈 Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bilans par Chantier -->
    <div v-if="showBilanType === 'chantiers'" class="card mb-4">
      <div class="card-header">
        <h5>Bilans par Chantier</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Chantier</th>
                <th>Client</th>
                <th>Devis (€)</th>
                <th>Coûts Heures (€)</th>
                <th>Marge (€)</th>
                <th>Marge (%)</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bilan in bilansChantiers" :key="bilan.chantierId">
                <td>{{ bilan.chantierNom }}</td>
                <td>{{ bilan.clientNom }}</td>
                <td>{{ formatCurrency(bilan.devisTotal) }}</td>
                <td>{{ formatCurrency(bilan.coutsHeures) }}</td>
                <td :class="bilan.marge >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(bilan.marge) }}
                </td>
                <td :class="bilan.margePourcentage >= 0 ? 'text-success' : 'text-danger'">
                  {{ bilan.margePourcentage }}%
                </td>
                <td>
                  <span :class="getStatutClass(bilan.statut)">
                    {{ bilan.statut }}
                  </span>
                </td>
                <td>
                  <button @click="voirDetailChantier(bilan.chantierId)" class="btn btn-sm btn-info">
                    👁 Détail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Bilans Mensuels -->
    <div v-if="showBilanType === 'mensuel'" class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5>Bilans Mensuels</h5>
        <div>
          <select v-model="selectedYear" @change="loadBilansMensuels" class="form-select">
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Mois</th>
                <th>Chiffre d'Affaires</th>
                <th>Coûts Heures</th>
                <th>Marge</th>
                <th>Marge %</th>
                <th>Nb Chantiers</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bilan in bilansMensuels" :key="bilan.mois">
                <td>{{ bilan.moisNom }}</td>
                <td>{{ formatCurrency(bilan.chiffreAffaires) }}</td>
                <td>{{ formatCurrency(bilan.coutsHeures) }}</td>
                <td :class="bilan.marge >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(bilan.marge) }}
                </td>
                <td :class="bilan.margePourcentage >= 0 ? 'text-success' : 'text-danger'">
                  {{ bilan.margePourcentage }}%
                </td>
                <td>{{ bilan.nbChantiers }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Bilans par Client -->
    <div v-if="showBilanType === 'clients'" class="card mb-4">
      <div class="card-header">
        <h5>Bilans par Client</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Nb Chantiers</th>
                <th>Chiffre d'Affaires</th>
                <th>Marge Totale</th>
                <th>Marge Moyenne %</th>
                <th>Dernier Chantier</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bilan in bilansClients" :key="bilan.clientId">
                <td>{{ bilan.clientNom }}</td>
                <td>{{ bilan.nbChantiers }}</td>
                <td>{{ formatCurrency(bilan.chiffreAffaires) }}</td>
                <td :class="bilan.margeTotale >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(bilan.margeTotale) }}
                </td>
                <td :class="bilan.margeMoyenne >= 0 ? 'text-success' : 'text-danger'">
                  {{ bilan.margeMoyenne }}%
                </td>
                <td>{{ bilan.dernierChantier }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Dashboard Graphiques -->
    <div v-if="showBilanType === 'dashboard'" class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Évolution Mensuelle</h5>
          </div>
          <div class="card-body">
            <canvas ref="chartEvolution" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Répartition par Client</h5>
          </div>
          <div class="card-body">
            <canvas ref="chartClients" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Détail Chantier Modal -->
    <div v-if="showDetailChantier" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5>Détail Chantier: {{ detailChantier.nom }}</h5>
            <button @click="showDetailChantier = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Informations Générales</h6>
                <p><strong>Client:</strong> {{ detailChantier.client }}</p>
                <p><strong>Adresse:</strong> {{ detailChantier.adresse }}</p>
                <p><strong>Devis Total:</strong> {{ formatCurrency(detailChantier.devisTotal) }}</p>
              </div>
              <div class="col-md-6">
                <h6>Coûts Détaillés</h6>
                <p><strong>Heures Chef:</strong> {{ detailChantier.heuresChef }}h ({{ formatCurrency(detailChantier.coutsChef) }})</p>
                <p><strong>Heures Ouvriers:</strong> {{ detailChantier.heuresOuvriers }}h ({{ formatCurrency(detailChantier.coutsOuvriers) }})</p>
                <p><strong>Heures Intérimaires:</strong> {{ detailChantier.heuresInterim }}h ({{ formatCurrency(detailChantier.coutsInterim) }})</p>
                <p><strong>Total Coûts:</strong> {{ formatCurrency(detailChantier.coutsTotaux) }}</p>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-md-12">
                <h6>Résultat</h6>
                <div class="alert" :class="detailChantier.marge >= 0 ? 'alert-success' : 'alert-danger'">
                  <strong>Marge:</strong> {{ formatCurrency(detailChantier.marge) }} ({{ detailChantier.margePourcentage }}%)
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
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

const showBilanType = ref('chantiers');
const selectedYear = ref(new Date().getFullYear());
const showDetailChantier = ref(false);
const detailChantier = ref({});

// Données
const chantiers = ref([]);
const devis = ref([]);
const factures = ref([]);
const heuresChef = ref([]);
const heuresOuvriers = ref([]);
const heuresInterim = ref([]);

// KPIs
const kpis = ref({
  chiffreAffaires: 0,
  coutsTotaux: 0,
  margeBrute: 0,
  margePourcentage: 0,
  chantiersActifs: 0
});

// Bilans
const bilansChantiers = ref([]);
const bilansMensuels = ref([]);
const bilansClients = ref([]);

// Années disponibles
const availableYears = computed(() => {
  const years = new Set();
  devis.value.forEach(d => {
    if (d.createdAt) {
      years.add(d.createdAt.toDate().getFullYear());
    }
  });
  return Array.from(years).sort((a, b) => b - a);
});

// Chargement données
const loadData = async () => {
  try {
    // Chantiers
    const chantiersSnap = await getDocs(collection(db, 'chantiers'));
    chantiers.value = chantiersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Devis
    const devisSnap = await getDocs(collection(db, 'devis'));
    devis.value = devisSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Factures
    const facturesSnap = await getDocs(collection(db, 'factures'));
    factures.value = facturesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Heures
    const heuresChefSnap = await getDocs(collection(db, 'heures_chef_propres'));
    heuresChef.value = heuresChefSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const heuresOuvriersSnap = await getDocs(collection(db, 'heures_ouvriers'));
    heuresOuvriers.value = heuresOuvriersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const heuresInterimSnap = await getDocs(collection(db, 'heures_chef_interim'));
    heuresInterim.value = heuresInterimSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    calculateKPIs();
    calculateBilansChantiers();
    loadBilansMensuels();
    calculateBilansClients();
  } catch (error) {
    console.error('Erreur chargement données:', error);
  }
};

const calculateKPIs = () => {
  // Chiffre d'affaires (factures émises)
  const factures = ref([]);
  
  // Carica factures se non già caricate
  const loadFactures = async () => {
    try {
      const facturesSnap = await getDocs(collection(db, 'factures'));
      factures.value = facturesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    }
  };
  
  loadFactures();
  
  // Chiffre d'affaires = factures émises (tous statuts sauf brouillon)
  const ca = factures.value.reduce((sum, f) => sum + (f.montantTTC || 0), 0);

  // Coûts heures (tarifs moyens)
  const tarifChef = 45; // €/h
  const tarifOuvrier = 25; // €/h
  const tarifInterim = 35; // €/h

  const coutsChef = heuresChef.value.reduce((sum, h) => sum + (h.heuresPropres || 0) * tarifChef, 0);
  const coutsOuvriers = heuresOuvriers.value.reduce((sum, h) => sum + (h.heures || 0) * tarifOuvrier, 0);
  const coutsInterim = heuresInterim.value.reduce((sum, h) => sum + (h.heuresInterim || 0) * tarifInterim, 0);

  const coutsTotaux = coutsChef + coutsOuvriers + coutsInterim;
  const margeBrute = ca - coutsTotaux;
  const margePourcentage = ca > 0 ? Math.round((margeBrute / ca) * 100) : 0;

  kpis.value = {
    chiffreAffaires: ca,
    coutsTotaux,
    margeBrute,
    margePourcentage,
    chantiersActifs: chantiers.value.length
  };
};

const calculateBilansChantiers = () => {
  const tarifChef = 45;
  const tarifOuvrier = 25;
  const tarifInterim = 35;

  bilansChantiers.value = chantiers.value.map(chantier => {
    // Trouve le devis associé
    const chantierDevis = devis.value.find(d => d.id === chantier.devisId);
    const devisTotal = chantierDevis?.total || 0;

    // Calcola coûts heures
    const heuresChefChantier = heuresChef.value
      .filter(h => h.chantierId === chantier.id)
      .reduce((sum, h) => sum + (h.heuresPropres || 0), 0);

    const heuresOuvriersChantier = heuresOuvriers.value
      .filter(h => h.chantierId === chantier.id)
      .reduce((sum, h) => sum + (h.heures || 0), 0);

    const heuresInterimChantier = heuresInterim.value
      .filter(h => h.chantierId === chantier.id)
      .reduce((sum, h) => sum + (h.heuresInterim || 0), 0);

    const coutsHeures = (heuresChefChantier * tarifChef) + 
                       (heuresOuvriersChantier * tarifOuvrier) + 
                       (heuresInterimChantier * tarifInterim);

    const marge = devisTotal - coutsHeures;
    const margePourcentage = devisTotal > 0 ? Math.round((marge / devisTotal) * 100) : 0;

    return {
      chantierId: chantier.id,
      chantierNom: chantier.nom,
      clientNom: chantierDevis?.nom || 'N/A',
      devisTotal,
      coutsHeures,
      marge,
      margePourcentage,
      statut: chantierDevis?.draft ? 'Brouillon' : 'Confirmé'
    };
  });
};

const loadBilansMensuels = () => {
  const year = selectedYear.value;
  const months = [];
  
  for (let month = 0; month < 12; month++) {
    const monthDevis = devis.value.filter(d => {
      if (!d.createdAt) return false;
      const date = d.createdAt.toDate();
      return date.getFullYear() === year && date.getMonth() === month && !d.draft;
    });

    const chiffreAffaires = monthDevis.reduce((sum, d) => sum + (d.total || 0), 0);
    
    // Calcola coûts heures per il mese (approssimativo)
    const coutsHeures = chiffreAffaires * 0.6; // Stima 60% costi
    const marge = chiffreAffaires - coutsHeures;
    const margePourcentage = chiffreAffaires > 0 ? Math.round((marge / chiffreAffaires) * 100) : 0;

    months.push({
      mois: month,
      moisNom: new Date(year, month).toLocaleDateString('fr-FR', { month: 'long' }),
      chiffreAffaires,
      coutsHeures,
      marge,
      margePourcentage,
      nbChantiers: monthDevis.length
    });
  }
  
  bilansMensuels.value = months;
};

const calculateBilansClients = () => {
  const clientsMap = new Map();

  devis.value.filter(d => !d.draft).forEach(d => {
    const clientNom = d.nom || 'Client Inconnu';
    
    if (!clientsMap.has(clientNom)) {
      clientsMap.set(clientNom, {
        clientId: clientNom,
        clientNom,
        nbChantiers: 0,
        chiffreAffaires: 0,
        margeTotale: 0,
        dernierChantier: null
      });
    }

    const client = clientsMap.get(clientNom);
    client.nbChantiers++;
    client.chiffreAffaires += d.total || 0;
    client.margeTotale += (d.total || 0) * 0.4; // Stima 40% marge
    
    if (!client.dernierChantier || (d.createdAt && d.createdAt.toDate() > new Date(client.dernierChantier))) {
      client.dernierChantier = d.createdAt?.toDate().toLocaleDateString('fr-FR') || 'N/A';
    }
  });

  bilansClients.value = Array.from(clientsMap.values()).map(client => ({
    ...client,
    margeMoyenne: client.chiffreAffaires > 0 ? Math.round((client.margeTotale / client.chiffreAffaires) * 100) : 0
  }));
};

const voirDetailChantier = (chantierId) => {
  const chantier = chantiers.value.find(c => c.id === chantierId);
  const chantierDevis = devis.value.find(d => d.id === chantier?.devisId);
  
  if (!chantier) return;

  const tarifChef = 45;
  const tarifOuvrier = 25;
  const tarifInterim = 35;

  const heuresChefTotal = heuresChef.value
    .filter(h => h.chantierId === chantierId)
    .reduce((sum, h) => sum + (h.heuresPropres || 0), 0);

  const heuresOuvriersTotal = heuresOuvriers.value
    .filter(h => h.chantierId === chantierId)
    .reduce((sum, h) => sum + (h.heures || 0), 0);

  const heuresInterimTotal = heuresInterim.value
    .filter(h => h.chantierId === chantierId)
    .reduce((sum, h) => sum + (h.heuresInterim || 0), 0);

  const coutsChef = heuresChefTotal * tarifChef;
  const coutsOuvriers = heuresOuvriersTotal * tarifOuvrier;
  const coutsInterim = heuresInterimTotal * tarifInterim;
  const coutsTotaux = coutsChef + coutsOuvriers + coutsInterim;

  const devisTotal = chantierDevis?.total || 0;
  const marge = devisTotal - coutsTotaux;
  const margePourcentage = devisTotal > 0 ? Math.round((marge / devisTotal) * 100) : 0;

  detailChantier.value = {
    nom: chantier.nom,
    client: chantierDevis?.nom || 'N/A',
    adresse: chantier.adresse,
    devisTotal,
    heuresChef: heuresChefTotal,
    heuresOuvriers: heuresOuvriersTotal,
    heuresInterim: heuresInterimTotal,
    coutsChef,
    coutsOuvriers,
    coutsInterim,
    coutsTotaux,
    marge,
    margePourcentage
  };

  showDetailChantier.value = true;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const getStatutClass = (statut) => {
  return statut === 'Confirmé' ? 'badge bg-success' : 'badge bg-warning';
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.modal {
  z-index: 1050;
}

.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn {
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
}
</style>