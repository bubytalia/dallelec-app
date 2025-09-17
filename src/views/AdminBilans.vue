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
                <th>Facturé (€)</th>
                <th>Coût Heures (€)</th>
                <th>Marge (€)</th>
                <th>% de réalisation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bilan in bilansChantiers" :key="bilan.chantierId">
                <td>{{ bilan.chantierNom }}</td>
                <td>{{ bilan.clientNom }}</td>
                <td>{{ formatCurrency(bilan.devisTotal) }}</td>
                <td>{{ formatCurrency(bilan.facture) }}</td>
                <td>{{ formatCurrency(bilan.coutsHeures) }}</td>
                <td :class="bilan.marge >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(bilan.marge) }}
                </td>
                <td>
                  <span :class="getRealisationClass(bilan.pourcentageRealisation)">
                    {{ bilan.pourcentageRealisation }}%
                  </span>
                </td>
                <td>
                  <button @click="voirDetailChantier(bilan.chantierId)" class="btn btn-sm btn-info">
                    👁 Détail
                  </button>
                </td>
              </tr>
              <tr class="table-secondary fw-bold">
                <td colspan="2">TOTAUX</td>
                <td>{{ formatCurrency(totauxChantiers.devis) }}</td>
                <td>{{ formatCurrency(totauxChantiers.facture) }}</td>
                <td>{{ formatCurrency(totauxChantiers.couts) }}</td>
                <td :class="totauxChantiers.marge >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(totauxChantiers.marge) }}
                </td>
                <td>{{ totauxChantiers.pourcentageRealisation }}%</td>
                <td></td>
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
                <th>Devis (€)</th>
                <th>Facturé (€)</th>
                <th>Coût Heures (€)</th>
                <th>Marge (€)</th>
                <th>% de réalisation</th>
                <th>Nb Chantiers</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bilan in bilansMensuels" :key="bilan.mois">
                <td>{{ bilan.moisNom }}</td>
                <td>{{ formatCurrency(bilan.devis) }}</td>
                <td>{{ formatCurrency(bilan.facture) }}</td>
                <td>{{ formatCurrency(bilan.coutsHeures) }}</td>
                <td :class="bilan.marge >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(bilan.marge) }}
                </td>
                <td>
                  <span :class="getRealisationClass(bilan.pourcentageRealisation)">
                    {{ bilan.pourcentageRealisation }}%
                  </span>
                </td>
                <td>{{ bilan.nbChantiers }}</td>
              </tr>
              <tr class="table-secondary fw-bold">
                <td>TOTAUX</td>
                <td>{{ formatCurrency(totauxMensuels.devis) }}</td>
                <td>{{ formatCurrency(totauxMensuels.facture) }}</td>
                <td>{{ formatCurrency(totauxMensuels.couts) }}</td>
                <td :class="totauxMensuels.marge >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(totauxMensuels.marge) }}
                </td>
                <td>{{ totauxMensuels.pourcentageRealisation }}%</td>
                <td>{{ totauxMensuels.nbChantiers }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Bilans par Client -->
    <div v-if="showBilanType === 'clients'" class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5>Bilans par Client</h5>
        <div>
          <select v-model="selectedTechnicien" @change="calculateBilansClients" class="form-select">
            <option value="">Tous les techniciens</option>
            <option v-for="tech in availableTechniciens" :key="tech" :value="tech">{{ tech }}</option>
          </select>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Nb Chantiers</th>
                <th>Devis (€)</th>
                <th>Facturé (€)</th>
                <th>Coût Heures (€)</th>
                <th>Marge (€)</th>
                <th>% de réalisation</th>
                <th>Dernier Chantier</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bilan in bilansClients" :key="bilan.clientId">
                <td>{{ bilan.clientNom }}</td>
                <td>{{ bilan.nbChantiers }}</td>
                <td>{{ formatCurrency(bilan.devis) }}</td>
                <td>{{ formatCurrency(bilan.facture) }}</td>
                <td>{{ formatCurrency(bilan.coutsHeures) }}</td>
                <td :class="bilan.marge >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(bilan.marge) }}
                </td>
                <td>
                  <span :class="getRealisationClass(bilan.pourcentageRealisation)">
                    {{ bilan.pourcentageRealisation }}%
                  </span>
                </td>
                <td>{{ bilan.dernierChantier }}</td>
              </tr>
              <tr class="table-secondary fw-bold">
                <td>TOTAUX</td>
                <td>{{ totauxClients.nbChantiers }}</td>
                <td>{{ formatCurrency(totauxClients.devis) }}</td>
                <td>{{ formatCurrency(totauxClients.facture) }}</td>
                <td>{{ formatCurrency(totauxClients.couts) }}</td>
                <td :class="totauxClients.marge >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(totauxClients.marge) }}
                </td>
                <td>{{ totauxClients.pourcentageRealisation }}%</td>
                <td></td>
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
import { supabase } from '@/supabase';
import RetourButton from '@/components/RetourButton.vue';

const showBilanType = ref('chantiers');
const selectedYear = ref(new Date().getFullYear());
const selectedTechnicien = ref('');
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

// Totaux
const totauxChantiers = ref({ devis: 0, facture: 0, couts: 0, marge: 0, pourcentageRealisation: 0 });
const totauxMensuels = ref({ devis: 0, facture: 0, couts: 0, marge: 0, pourcentageRealisation: 0, nbChantiers: 0 });
const totauxClients = ref({ nbChantiers: 0, devis: 0, facture: 0, couts: 0, marge: 0, pourcentageRealisation: 0 });

// Années disponibles
const availableYears = computed(() => {
  const years = new Set();
  devis.value.forEach(d => {
    if (d.createdAt) {
      years.add(new Date(d.createdAt).getFullYear());
    }
  });
  return Array.from(years).sort((a, b) => b - a);
});

// Techniciens disponibles
const availableTechniciens = computed(() => {
  const techniciens = new Set();
  devis.value.forEach(d => {
    if (d.technicien) {
      techniciens.add(d.technicien);
    }
  });
  return Array.from(techniciens).sort();
});

// Chargement données
const loadData = async () => {
  try {
    // Chantiers
    const { data: chantiersData } = await supabase.from('chantiers').select('*');
    chantiers.value = chantiersData || [];

    // Devis
    const { data: devisData } = await supabase.from('devis').select('*');
    devis.value = devisData || [];

    // Factures
    const { data: facturesData } = await supabase.from('factures').select('*');
    factures.value = facturesData || [];

    // Heures
    const { data: heuresChefData } = await supabase.from('heures_chef_propres').select('*');
    heuresChef.value = heuresChefData || [];

    const { data: heuresOuvriersData } = await supabase.from('heures_ouvriers').select('*');
    heuresOuvriers.value = heuresOuvriersData || [];

    const { data: heuresInterimData } = await supabase.from('heures_chef_interim').select('*');
    heuresInterim.value = heuresInterimData || [];

    calculateKPIs();
    calculateBilansChantiers();
    loadBilansMensuels();
    calculateBilansClients();
  } catch (error) {
    console.error('Erreur chargement données:', error);
  }
};

const calculateKPIs = () => {
  // Chiffre d'affaires = factures émises (tous statuts)
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

    // Trouve les factures pour ce chantier
    const facturesChantier = factures.value.filter(f => f.chantierId === chantier.id);
    const factureTotal = facturesChantier.reduce((sum, f) => sum + (f.montantTTC || 0), 0);

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

    const marge = factureTotal - coutsHeures;
    const pourcentageRealisation = devisTotal > 0 ? Math.round((factureTotal / devisTotal) * 100) : 0;

    return {
      chantierId: chantier.id,
      chantierNom: chantier.nom,
      clientNom: chantierDevis?.nom || 'N/A',
      devisTotal,
      facture: factureTotal,
      coutsHeures,
      marge,
      pourcentageRealisation
    };
  });

  // Calcola totali
  totauxChantiers.value = {
    devis: bilansChantiers.value.reduce((sum, b) => sum + b.devisTotal, 0),
    facture: bilansChantiers.value.reduce((sum, b) => sum + b.facture, 0),
    couts: bilansChantiers.value.reduce((sum, b) => sum + b.coutsHeures, 0),
    marge: bilansChantiers.value.reduce((sum, b) => sum + b.marge, 0),
    pourcentageRealisation: bilansChantiers.value.length > 0 ? 
      Math.round(bilansChantiers.value.reduce((sum, b) => sum + b.pourcentageRealisation, 0) / bilansChantiers.value.length) : 0
  };
};

const loadBilansMensuels = () => {
  const year = selectedYear.value;
  const months = [];
  
  for (let month = 0; month < 12; month++) {
    // Factures du mois
    const monthFactures = factures.value.filter(f => {
      if (!f.dateFacture) return false;
      const date = new Date(f.dateFacture);
      return date.getFullYear() === year && date.getMonth() === month;
    });

    // Devis du mois
    const monthDevis = devis.value.filter(d => {
      if (!d.createdAt) return false;
      const date = new Date(d.createdAt);
      return date.getFullYear() === year && date.getMonth() === month && !d.draft;
    });

    const devisTotal = monthDevis.reduce((sum, d) => sum + (d.total || 0), 0);
    const factureTotal = monthFactures.reduce((sum, f) => sum + (f.montantTTC || 0), 0);
    
    // Calcola coûts heures per il mese (dalle heures enregistrées)
    const tarifChef = 45, tarifOuvrier = 25, tarifInterim = 35;
    
    const coutsHeuresMonth = [
      ...heuresChef.value.filter(h => {
        const date = new Date(h.date);
        return date.getFullYear() === year && date.getMonth() === month;
      }).map(h => (h.heuresPropres || 0) * tarifChef),
      ...heuresOuvriers.value.filter(h => {
        const date = new Date(h.date);
        return date.getFullYear() === year && date.getMonth() === month;
      }).map(h => (h.heures || 0) * tarifOuvrier),
      ...heuresInterim.value.filter(h => {
        const date = new Date(h.date);
        return date.getFullYear() === year && date.getMonth() === month;
      }).map(h => (h.heuresInterim || 0) * tarifInterim)
    ].reduce((sum, cost) => sum + cost, 0);

    const marge = factureTotal - coutsHeuresMonth;
    const pourcentageRealisation = devisTotal > 0 ? Math.round((factureTotal / devisTotal) * 100) : 0;

    months.push({
      mois: month,
      moisNom: new Date(year, month).toLocaleDateString('fr-FR', { month: 'long' }),
      devis: devisTotal,
      facture: factureTotal,
      coutsHeures: coutsHeuresMonth,
      marge,
      pourcentageRealisation,
      nbChantiers: monthDevis.length
    });
  }
  
  bilansMensuels.value = months;
  
  // Calcola totali mensuels
  totauxMensuels.value = {
    devis: months.reduce((sum, m) => sum + m.devis, 0),
    facture: months.reduce((sum, m) => sum + m.facture, 0),
    couts: months.reduce((sum, m) => sum + m.coutsHeures, 0),
    marge: months.reduce((sum, m) => sum + m.marge, 0),
    pourcentageRealisation: months.length > 0 ? 
      Math.round(months.reduce((sum, m) => sum + m.pourcentageRealisation, 0) / months.length) : 0,
    nbChantiers: months.reduce((sum, m) => sum + m.nbChantiers, 0)
  };
};

const calculateBilansClients = () => {
  const clientsMap = new Map();
  const tarifChef = 45, tarifOuvrier = 25, tarifInterim = 35;

  // Filtra devis per technicien se selezionato
  const filteredDevis = selectedTechnicien.value ? 
    devis.value.filter(d => !d.draft && d.technicien === selectedTechnicien.value) :
    devis.value.filter(d => !d.draft);

  filteredDevis.forEach(d => {
    const clientNom = d.nom || 'Client Inconnu';
    
    if (!clientsMap.has(clientNom)) {
      clientsMap.set(clientNom, {
        clientId: clientNom,
        clientNom,
        nbChantiers: 0,
        devis: 0,
        facture: 0,
        coutsHeures: 0,
        dernierChantier: null
      });
    }

    const client = clientsMap.get(clientNom);
    client.nbChantiers++;
    client.devis += d.total || 0;
    
    // Trova chantier associato per calcolare facture e costi
    const chantierAssocie = chantiers.value.find(c => c.devisId === d.id);
    if (chantierAssocie) {
      // Factures per questo chantier
      const facturesChantier = factures.value.filter(f => f.chantierId === chantierAssocie.id);
      client.facture += facturesChantier.reduce((sum, f) => sum + (f.montantTTC || 0), 0);
      
      // Costi heures per questo chantier
      const heuresChef = heuresChef.value.filter(h => h.chantierId === chantierAssocie.id)
        .reduce((sum, h) => sum + (h.heuresPropres || 0), 0) * tarifChef;
      const heuresOuvriers = heuresOuvriers.value.filter(h => h.chantierId === chantierAssocie.id)
        .reduce((sum, h) => sum + (h.heures || 0), 0) * tarifOuvrier;
      const heuresInterim = heuresInterim.value.filter(h => h.chantierId === chantierAssocie.id)
        .reduce((sum, h) => sum + (h.heuresInterim || 0), 0) * tarifInterim;
      
      client.coutsHeures += heuresChef + heuresOuvriers + heuresInterim;
    }
    
    if (!client.dernierChantier || (d.createdAt && new Date(d.createdAt) > new Date(client.dernierChantier))) {
      client.dernierChantier = d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : 'N/A';
    }
  });

  bilansClients.value = Array.from(clientsMap.values()).map(client => {
    const marge = client.facture - client.coutsHeures;
    const pourcentageRealisation = client.devis > 0 ? Math.round((client.facture / client.devis) * 100) : 0;
    
    return {
      ...client,
      marge,
      pourcentageRealisation
    };
  });
  
  // Calcola totali clients
  totauxClients.value = {
    nbChantiers: bilansClients.value.reduce((sum, c) => sum + c.nbChantiers, 0),
    devis: bilansClients.value.reduce((sum, c) => sum + c.devis, 0),
    facture: bilansClients.value.reduce((sum, c) => sum + c.facture, 0),
    couts: bilansClients.value.reduce((sum, c) => sum + c.coutsHeures, 0),
    marge: bilansClients.value.reduce((sum, c) => sum + c.marge, 0),
    pourcentageRealisation: bilansClients.value.length > 0 ? 
      Math.round(bilansClients.value.reduce((sum, c) => sum + c.pourcentageRealisation, 0) / bilansClients.value.length) : 0
  };
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

const getRealisationClass = (pourcentage) => {
  if (pourcentage >= 100) return 'badge bg-success';
  if (pourcentage >= 75) return 'badge bg-info';
  if (pourcentage >= 50) return 'badge bg-warning';
  if (pourcentage > 0) return 'badge bg-danger';
  return 'badge bg-secondary';
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