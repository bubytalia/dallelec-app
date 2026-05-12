<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Bilans Financiers</h2>

    <!-- KPI Cards -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body text-center">
            <h5>Chiffre d'Affaires HT</h5>
            <h3>{{ formatCurrency(kpis.chiffreAffaires) }}</h3>
            <small>Total facturé HT</small>
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
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5>Bilans par Chantier</h5>
        <div class="d-flex gap-2">
          <select v-model="selectedYearChantiers" @change="calculateBilansChantiers" class="form-select" style="width:auto">
            <option value="">Toutes les années</option>
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
          </select>
          <select v-model="selectedClientChantiers" @change="calculateBilansChantiers" class="form-select" style="width:auto">
            <option value="">Tous les clients</option>
            <option v-for="cl in availableClients" :key="cl" :value="cl">{{ cl }}</option>
          </select>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Chantier</th>
                <th>Client</th>
                <th>Devis HT</th>
                <th>Facturé HT</th>
                <th>Coût Heures</th>
                <th>Marge</th>
                <th>% Marge</th>
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
                  <span :class="getMargeClass(bilan.margePourcentage)">
                    {{ bilan.margePourcentage }}%
                  </span>
                </td>
                <td>
                  <button @click="voirDetailChantier(bilan.chantierId)" class="btn btn-sm btn-info me-1">
                    👁 Détail
                  </button>
                  <button @click="voirBilancioDettagliato(bilan.chantierId)" class="btn btn-sm btn-primary">
                    📊 Bilan
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
                <td>{{ totauxChantiers.margePourcentage }}%</td>
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
                <th>Devis HT</th>
                <th>Facturé HT</th>
                <th>Coût Heures</th>
                <th>Marge</th>
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
        <select v-model="selectedYearClients" @change="calculateBilansClients" class="form-select" style="width:auto">
          <option value="">Toutes les années</option>
          <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
        </select>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Nb Chantiers</th>
                <th>Devis HT</th>
                <th>Facturé HT</th>
                <th>Coût Heures</th>
                <th>Marge</th>
                <th>% Marge</th>
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
                  <span :class="getMargeClass(bilan.margePourcentage)">
                    {{ bilan.margePourcentage }}%
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
                <td>{{ totauxClients.margePourcentage }}%</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Dashboard -->
    <div v-if="showBilanType === 'dashboard'" class="card mb-4">
      <div class="card-header">
        <h5>Dashboard - Résumé</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h6>Top 5 Clients par CA HT</h6>
            <table class="table table-sm">
              <thead><tr><th>Client</th><th>Facturé HT</th><th>Marge</th></tr></thead>
              <tbody>
                <tr v-for="c in bilansClients.slice(0, 5)" :key="c.clientNom">
                  <td>{{ c.clientNom }}</td>
                  <td>{{ formatCurrency(c.facture) }}</td>
                  <td :class="c.marge >= 0 ? 'text-success' : 'text-danger'">{{ formatCurrency(c.marge) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="col-md-6">
            <h6>Top 5 Chantiers par CA HT</h6>
            <table class="table table-sm">
              <thead><tr><th>Chantier</th><th>Facturé HT</th><th>Marge</th></tr></thead>
              <tbody>
                <tr v-for="b in [...bilansChantiers].sort((a,b) => b.facture - a.facture).slice(0, 5)" :key="b.chantierId">
                  <td>{{ b.chantierNom }}</td>
                  <td>{{ formatCurrency(b.facture) }}</td>
                  <td :class="b.marge >= 0 ? 'text-success' : 'text-danger'">{{ formatCurrency(b.marge) }}</td>
                </tr>
              </tbody>
            </table>
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

    <!-- Modal Bilancio Dettagliato -->
    <div v-if="showBilancioDettagliato" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5>Bilancio Détaillé: {{ bilancioDettagliato.chantier?.nom }}</h5>
            <button @click="showBilancioDettagliato = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div v-for="(moisData, mois) in bilancioDettagliato.heuresParMois" :key="mois" class="mb-4">
              <h6 class="bg-light p-2">{{ mois }}</h6>
              
              <!-- Facturé du mois -->
              <div class="row mb-3">
                <div class="col-md-12">
                  <div class="alert alert-info">
                    <strong>Facturé ce mois:</strong> {{ formatCurrency(moisData.factures) }}
                  </div>
                </div>
              </div>
              
              <!-- Détail des heures -->
              <div v-if="moisData.heures.length > 0" class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employé</th>
                      <th>Type</th>
                      <th>Heures</th>
                      <th>Tarif/h</th>
                      <th>Coût</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="heure in moisData.heures.sort((a,b) => new Date(a.date) - new Date(b.date))" :key="heure.date + heure.nom">
                      <td>{{ new Date(heure.date).toLocaleDateString('fr-FR') }}</td>
                      <td>{{ heure.nom }}</td>
                      <td>
                        <span :class="{
                          'badge bg-primary': heure.type === 'Chef',
                          'badge bg-success': heure.type === 'Ouvrier', 
                          'badge bg-warning': heure.type === 'Intérimaire'
                        }">
                          {{ heure.type }}
                        </span>
                      </td>
                      <td>{{ heure.heures }}h</td>
                      <td>{{ formatCurrency(heure.tarif) }}</td>
                      <td><strong>{{ formatCurrency(heure.cout) }}</strong></td>
                    </tr>
                    <tr class="table-secondary">
                      <td colspan="4"><strong>Total Coûts Mois</strong></td>
                      <td></td>
                      <td><strong>{{ formatCurrency(moisData.heures.reduce((sum, h) => sum + h.cout, 0)) }}</strong></td>
                    </tr>
                    <tr class="table-info">
                      <td colspan="4"><strong>Marge Mois</strong></td>
                      <td></td>
                      <td><strong>{{ formatCurrency(moisData.factures - moisData.heures.reduce((sum, h) => sum + h.cout, 0)) }}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-muted">Aucune heure enregistrée ce mois</div>
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
const selectedYearClients = ref('');
const selectedYearChantiers = ref('');
const selectedClientChantiers = ref('');
const showDetailChantier = ref(false);
const detailChantier = ref({});
const showBilancioDettagliato = ref(false);
const bilancioDettagliato = ref({});

// Données
const chantiers = ref([]);
const devis = ref([]);
const factures = ref([]);
const clients = ref([]);
const techniciens = ref([]);
const chefdechantiers = ref([]);
const collaborateurs = ref([]);
const interimaires = ref([]);
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
  // Usa le date delle fatture per determinare gli anni disponibili
  factures.value.forEach(f => {
    const d = f.date_facture || f.dateFacture;
    if (d) years.add(new Date(d).getFullYear());
  });
  // Aggiungi anche anni dai devis
  devis.value.forEach(d => {
    const dt = d.created_at || d.createdAt;
    if (dt) years.add(new Date(dt).getFullYear());
  });
  if (years.size === 0) years.add(new Date().getFullYear());
  return Array.from(years).sort((a, b) => b - a);
});

// Techniciens disponibles
const availableTechniciens = computed(() => {
  const techs = new Set();
  chantiers.value.forEach(c => {
    if (c.technicien) techs.add(c.technicien);
  });
  return Array.from(techs).sort();
});

// Clients disponibles
const availableClients = computed(() => {
  const cls = new Set();
  chantiers.value.forEach(c => {
    if (c.client) cls.add(c.client);
  });
  return Array.from(cls).sort();
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

    // Clients
    const { data: clientsData } = await supabase.from('clients').select('*');
    clients.value = clientsData || [];

    // Repertoires avec tarifs
    const { data: techniciensData } = await supabase.from('techniciens').select('*');
    techniciens.value = techniciensData || [];

    const { data: chefdechantiersData } = await supabase.from('chefdechantiers').select('*');
    chefdechantiers.value = chefdechantiersData || [];

    const { data: collaborateursData } = await supabase.from('collaborateurs').select('*');
    collaborateurs.value = collaborateursData || [];

    const { data: interimairesData } = await supabase.from('interimaires').select('*');
    interimaires.value = interimairesData || [];

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
  // Ricava HT dal TTC per coerenza (montant_ht può includere importi pre-acconti)
  const ca = factures.value.reduce((sum, f) => {
    const ttc = parseFloat(f.montant_ttc) || 0
    return sum + (ttc / 1.081)
  }, 0);

  // Coûts heures usando tarif_utilise (non retroattivo)
  const coutsChef = heuresChef.value.reduce((sum, h) => {
    const tarif = h.tarif_utilise || 45; // fallback per ore vecchie
    return sum + (h.total_heures || 0) * tarif;
  }, 0);
  
  const coutsOuvriers = heuresOuvriers.value.reduce((sum, h) => {
    const tarif = h.tarif_utilise || 25; // fallback per ore vecchie
    return sum + (h.heures || 0) * tarif;
  }, 0);
  
  const coutsInterim = heuresInterim.value.reduce((sum, h) => {
    const tarif = h.tarif_utilise || 35; // fallback per ore vecchie
    return sum + (h.total_heures || 0) * tarif;
  }, 0);

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
  const yearFilter = selectedYearChantiers.value;
  const clientFilter = selectedClientChantiers.value;

  let filteredChantiers = chantiers.value;
  if (clientFilter) {
    filteredChantiers = filteredChantiers.filter(c => c.client === clientFilter);
  }

  bilansChantiers.value = filteredChantiers.map(chantier => {
    // Trouve le devis associé
    const chantierDevis = devis.value.find(d => d.id === chantier.devis_id);
    const devisTotal = chantierDevis?.total || 0;

    // Trouve les factures pour ce chantier
    let facturesChantier = factures.value.filter(f => f.chantier_id === chantier.id);
    if (yearFilter) {
      facturesChantier = facturesChantier.filter(f => {
        const d = f.date_facture || f.dateFacture;
        return d && new Date(d).getFullYear() === yearFilter;
      });
    }
    const factureTotal = facturesChantier.reduce((sum, f) => {
      const ttc = parseFloat(f.montant_ttc) || 0
      return sum + (ttc / 1.081)
    }, 0);

    // Calcola coûts heures usando tarif_utilise (non retroattivo)
    const filterByYear = (h) => !yearFilter || (h.date && new Date(h.date).getFullYear() === yearFilter);
    const heuresChefFiltered = heuresChef.value.filter(h => String(h.chantier_id) === String(chantier.id) && filterByYear(h));
    const heuresOuvriersFiltered = heuresOuvriers.value.filter(h => String(h.chantier_id) === String(chantier.id) && filterByYear(h));
    const heuresInterimFiltered = heuresInterim.value.filter(h => String(h.chantier_id) === String(chantier.id) && filterByYear(h));

    // Calcola costi usando tariffe salvate al momento della registrazione
    const coutsChef = heuresChefFiltered.reduce((sum, h) => {
      const tarif = h.tarif_utilise || 45; // fallback per ore vecchie
      return sum + (h.total_heures || 0) * tarif;
    }, 0);
    
    const coutsOuvriers = heuresOuvriersFiltered.reduce((sum, h) => {
      const tarif = h.tarif_utilise || 25; // fallback per ore vecchie
      return sum + (h.heures || 0) * tarif;
    }, 0);
    
    const coutsInterim = heuresInterimFiltered.reduce((sum, h) => {
      const tarif = h.tarif_utilise || 35; // fallback per ore vecchie
      return sum + (h.total_heures || 0) * tarif;
    }, 0);

    const coutsHeures = coutsChef + coutsOuvriers + coutsInterim;

    const marge = factureTotal - coutsHeures;
    const margePourcentage = factureTotal > 0 ? Math.round((marge / factureTotal) * 100) : 0;

    // Trova il cliente
    const client = clients.value.find(c => c.id === chantier.client_id);
    const clientNom = client?.nom || chantier.client || 'N/A';

    return {
      chantierId: chantier.id,
      chantierNom: chantier.nom,
      clientNom,
      devisTotal,
      facture: factureTotal,
      coutsHeures,
      marge,
      margePourcentage
    };
  });

  // Calcola totali
  const totalFacture = bilansChantiers.value.reduce((sum, b) => sum + b.facture, 0);
  const totalMarge = bilansChantiers.value.reduce((sum, b) => sum + b.marge, 0);
  totauxChantiers.value = {
    devis: bilansChantiers.value.reduce((sum, b) => sum + b.devisTotal, 0),
    facture: totalFacture,
    couts: bilansChantiers.value.reduce((sum, b) => sum + b.coutsHeures, 0),
    marge: totalMarge,
    margePourcentage: totalFacture > 0 ? Math.round((totalMarge / totalFacture) * 100) : 0
  };
};

const loadBilansMensuels = () => {
  const year = selectedYear.value;
  const months = [];
  
  for (let month = 0; month < 12; month++) {
    // Factures du mois
    const monthFactures = factures.value.filter(f => {
      if (!f.date_facture && !f.dateFacture) return false;
      const date = new Date(f.date_facture || f.dateFacture);
      return date.getFullYear() === year && date.getMonth() === month;
    });

    // Devis du mois
    const monthDevis = devis.value.filter(d => {
      if (!d.created_at && !d.createdAt) return false;
      const date = new Date(d.created_at || d.createdAt);
      return date.getFullYear() === year && date.getMonth() === month && !d.draft;
    });

    const devisTotal = monthDevis.reduce((sum, d) => sum + (d.total || 0), 0);
    const factureTotal = monthFactures.reduce((sum, f) => {
      const ttc = parseFloat(f.montant_ttc) || 0
      return sum + (ttc / 1.081)
    }, 0);
    
    // Calcola coûts heures usando tarif_utilise (non retroattivo)
    const coutsHeuresMonth = [
      ...heuresChef.value.filter(h => {
        const date = new Date(h.date);
        return date.getFullYear() === year && date.getMonth() === month;
      }).map(h => (h.total_heures || 0) * (h.tarif_utilise || 45)),
      ...heuresOuvriers.value.filter(h => {
        const date = new Date(h.date);
        return date.getFullYear() === year && date.getMonth() === month;
      }).map(h => (h.heures || 0) * (h.tarif_utilise || 25)),
      ...heuresInterim.value.filter(h => {
        const date = new Date(h.date);
        return date.getFullYear() === year && date.getMonth() === month;
      }).map(h => (h.total_heures || 0) * (h.tarif_utilise || 35))
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
  const yearFilter = selectedYearClients.value;

  // Raggruppa chantiers per client (usa il campo 'client' del chantier)
  chantiers.value.forEach(chantier => {
    const clientNom = chantier.client || 'Client Inconnu';

    // Factures per questo chantier filtrate per anno
    let facturesChantier = factures.value.filter(f => String(f.chantier_id) === String(chantier.id));
    if (yearFilter) {
      facturesChantier = facturesChantier.filter(f => {
        const d = f.date_facture || f.dateFacture;
        return d && new Date(d).getFullYear() === yearFilter;
      });
    }

    // Heures filtrate per anno
    const filterByYear = (h) => {
      if (!yearFilter) return true;
      return h.date && new Date(h.date).getFullYear() === yearFilter;
    };

    const heuresChefFiltered = heuresChef.value.filter(h => String(h.chantier_id) === String(chantier.id) && filterByYear(h));
    const heuresOuvriersFiltered = heuresOuvriers.value.filter(h => String(h.chantier_id) === String(chantier.id) && filterByYear(h));
    const heuresInterimFiltered = heuresInterim.value.filter(h => String(h.chantier_id) === String(chantier.id) && filterByYear(h));

    // Se anno selezionato e nessuna fattura/ore per questo chantier, skip
    if (yearFilter && facturesChantier.length === 0 && heuresChefFiltered.length === 0 && heuresOuvriersFiltered.length === 0 && heuresInterimFiltered.length === 0) {
      return;
    }
    
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

    // Devis associato
    const chantierDevis = devis.value.find(d => String(d.id) === String(chantier.devis_id));
    if (chantierDevis) {
      client.devis += chantierDevis.total || 0;
    }

    // Factures (HT derivato da TTC)
    client.facture += facturesChantier.reduce((sum, f) => sum + (parseFloat(f.montant_ttc) || 0) / 1.081, 0);

    // Coûts heures
    const coutsChef = heuresChefFiltered.reduce((sum, h) => sum + (h.total_heures || 0) * (h.tarif_utilise || 45), 0);
    const coutsOuvriers = heuresOuvriersFiltered.reduce((sum, h) => sum + (h.heures || 0) * (h.tarif_utilise || 25), 0);
    const coutsInterim = heuresInterimFiltered.reduce((sum, h) => sum + (h.total_heures || 0) * (h.tarif_utilise || 35), 0);
    client.coutsHeures += coutsChef + coutsOuvriers + coutsInterim;

    // Dernier chantier
    const dateChantier = chantier.created_at || chantier.updated_at;
    if (dateChantier && (!client.dernierChantier || new Date(dateChantier) > new Date(client.dernierChantierDate || 0))) {
      client.dernierChantier = chantier.nom;
      client.dernierChantierDate = dateChantier;
    }
  });

  bilansClients.value = Array.from(clientsMap.values()).map(client => {
    const marge = client.facture - client.coutsHeures;
    const margePourcentage = client.facture > 0 ? Math.round((marge / client.facture) * 100) : 0;
    return { ...client, marge, margePourcentage };
  }).sort((a, b) => b.facture - a.facture);
  
  totauxClients.value = {
    nbChantiers: bilansClients.value.reduce((sum, c) => sum + c.nbChantiers, 0),
    devis: bilansClients.value.reduce((sum, c) => sum + c.devis, 0),
    facture: bilansClients.value.reduce((sum, c) => sum + c.facture, 0),
    couts: bilansClients.value.reduce((sum, c) => sum + c.coutsHeures, 0),
    marge: bilansClients.value.reduce((sum, c) => sum + c.marge, 0),
    margePourcentage: (() => {
      const totalFacture = bilansClients.value.reduce((sum, c) => sum + c.facture, 0);
      const totalMarge = bilansClients.value.reduce((sum, c) => sum + c.marge, 0);
      return totalFacture > 0 ? Math.round((totalMarge / totalFacture) * 100) : 0;
    })()
  };
};

const voirBilancioDettagliato = (chantierId) => {
  const chantier = chantiers.value.find(c => c.id === chantierId);
  if (!chantier) return;

  // Raggruppa ore per mese
  const heuresParMois = {};
  
  // Chef
  heuresChef.value
    .filter(h => String(h.chantier_id) === String(chantierId))
    .forEach(h => {
      const mois = new Date(h.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!heuresParMois[mois]) heuresParMois[mois] = { factures: 0, heures: [] };
      
      const chef = chefdechantiers.value.find(c => c.email === h.chef_id);
      const tarifChef = h.tarif_utilise || 45; // Usa tariffa salvata o fallback
      
      // Gestione nomi chef con fallback
      let nomChef = 'Chef inconnu';
      if (chef) {
        nomChef = `${chef.nom} ${chef.prenom}`;
      } else if (h.chef_id === 'junior.repellin@dallelec.ch') {
        nomChef = 'Repellin Junior';
      } else if (h.chef_id === 'dylan.laplane@dallelec.ch') {
        nomChef = 'Laplane Dylan';
      } else if (h.chef_id === 'tony.maullier@dallelec.com') {
        nomChef = 'Maullier Tony';
      }
      
      heuresParMois[mois].heures.push({
        date: h.date,
        nom: nomChef,
        type: 'Chef',
        heures: h.total_heures || 0,
        tarif: tarifChef,
        cout: (h.total_heures || 0) * tarifChef
      });
    });
  
  // Ouvriers
  heuresOuvriers.value
    .filter(h => String(h.chantier_id) === String(chantierId))
    .forEach(h => {
      const mois = new Date(h.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!heuresParMois[mois]) heuresParMois[mois] = { factures: 0, heures: [] };
      
      const ouvrier = collaborateurs.value.find(c => c.id === h.ouvrier_id || c.email === h.ouvrier_id);
      const tarifOuvrier = h.tarif_utilise || 25; // Usa tariffa salvata o fallback
      heuresParMois[mois].heures.push({
        date: h.date,
        nom: h.ouvrier_nom || ouvrier?.nom || 'Ouvrier inconnu',
        type: 'Ouvrier',
        heures: h.heures || 0,
        tarif: tarifOuvrier,
        cout: (h.heures || 0) * tarifOuvrier
      });
    });
  
  // Interim
  heuresInterim.value
    .filter(h => String(h.chantier_id) === String(chantierId))
    .forEach(h => {
      const mois = new Date(h.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!heuresParMois[mois]) heuresParMois[mois] = { factures: 0, heures: [] };
      
      const interim = interimaires.value.find(i => 
        i.nom === h.interinaire_nom || 
        (i.nom + ' ' + i.prenom) === h.interinaire_nom ||
        (i.prenom + ' ' + i.nom) === h.interinaire_nom
      );
      const tarifInterim = h.tarif_utilise || 35; // Usa tariffa salvata o fallback
      heuresParMois[mois].heures.push({
        date: h.date,
        nom: h.interinaire_nom || 'Intérimaire inconnu',
        type: 'Intérimaire',
        heures: h.total_heures || 0,
        tarif: tarifInterim,
        cout: (h.total_heures || 0) * tarifInterim
      });
    });
  
  // Factures par mois
  factures.value
    .filter(f => String(f.chantier_id) === String(chantierId))
    .forEach(f => {
      const mois = new Date(f.date_facture || f.dateFacture).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!heuresParMois[mois]) heuresParMois[mois] = { factures: 0, heures: [] };
      heuresParMois[mois].factures += (parseFloat(f.montant_ttc) || 0) / 1.081;
    });
  
  bilancioDettagliato.value = {
    chantier,
    heuresParMois
  };
  
  showBilancioDettagliato.value = true;
};

const voirDetailChantier = (chantierId) => {
  const chantier = chantiers.value.find(c => c.id === chantierId);
  const chantierDevis = devis.value.find(d => d.id === chantier?.devis_id);
  
  if (!chantier) return;

  // Calcola costi usando tarif_utilise (non retroattivo)
  const heuresChefData = heuresChef.value.filter(h => String(h.chantier_id) === String(chantierId));
  const heuresOuvriersData = heuresOuvriers.value.filter(h => String(h.chantier_id) === String(chantierId));
  const heuresInterimData = heuresInterim.value.filter(h => String(h.chantier_id) === String(chantierId));

  const heuresChefTotal = heuresChefData.reduce((sum, h) => sum + (h.total_heures || h.heures_normales || 0), 0);
  const heuresOuvriersTotal = heuresOuvriersData.reduce((sum, h) => sum + (h.heures || 0), 0);
  const heuresInterimTotal = heuresInterimData.reduce((sum, h) => sum + (h.total_heures || h.heures_normales || 0), 0);

  const coutsChef = heuresChefData.reduce((sum, h) => sum + (h.total_heures || h.heures_normales || 0) * (h.tarif_utilise || 45), 0);
  const coutsOuvriers = heuresOuvriersData.reduce((sum, h) => sum + (h.heures || 0) * (h.tarif_utilise || 35), 0);
  const coutsInterim = heuresInterimData.reduce((sum, h) => sum + (h.total_heures || h.heures_normales || 0) * (h.tarif_utilise || 35), 0);
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
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF'
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

const getMargeClass = (pourcentage) => {
  if (pourcentage >= 30) return 'badge bg-success';
  if (pourcentage >= 15) return 'badge bg-info';
  if (pourcentage >= 0) return 'badge bg-warning';
  return 'badge bg-danger';
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