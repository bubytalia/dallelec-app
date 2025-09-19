<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Gestion des Primes - Vue Admin</h2>
    
    <!-- Filtres -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Filtres</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <label>Chef de Chantier</label>
                <select v-model="selectedChef" @change="updateFilters" class="form-select">
                  <option value="">Tous les chefs</option>
                  <option v-for="chef in availableChefs" :key="chef" :value="chef">{{ chef }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label>Mois</label>
                <select v-model="selectedMonth" @change="updateFilters" class="form-select">
                  <option value="">Tous les mois</option>
                  <option v-for="month in availableMonths" :key="month.value" :value="month.value">
                    {{ month.label }}
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <label>Année</label>
                <select v-model="selectedYear" @change="updateFilters" class="form-select">
                  <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label>Statut</label>
                <select v-model="selectedStatus" @change="updateFilters" class="form-select">
                  <option value="">Tous</option>
                  <option value="positif">Primes positives</option>
                  <option value="negatif">Primes négatives</option>
                  <option value="zero">Aucune prime</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Résumé KPI -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body text-center">
            <h5>Total Primes</h5>
            <h3>{{ formatCurrency(kpis.totalPrimes) }}</h3>
            <small>Période sélectionnée</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body text-center">
            <h5>Primes Efficacité</h5>
            <h3>{{ formatCurrency(kpis.primesEfficacite) }}</h3>
            <small>Heures gagnées</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-white">
          <div class="card-body text-center">
            <h5>Primes Régies</h5>
            <h3>{{ formatCurrency(kpis.primesRegies) }}</h3>
            <small>Heures régies</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body text-center">
            <h5>Chantiers</h5>
            <h3>{{ kpis.nbChantiers }}</h3>
            <small>Avec primes</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau détaillé -->
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5>Détail des Primes par Chantier</h5>
        <button @click="exportCSV" class="btn btn-outline-primary btn-sm">
          📊 Export CSV
        </button>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Chantier</th>
                <th>Chef</th>
                <th>Période</th>
                <th>Budget (CHF)</th>
                <th>Heures Prévues</th>
                <th>Heures Réelles</th>
                <th>Heures Gagnées</th>
                <th>Heures Régies</th>
                <th>Prime Efficacité</th>
                <th>Prime Régies</th>
                <th>Prime Totale</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prime in premesFiltered" :key="prime.chantierId">
                <td>
                  <strong>{{ prime.chantierNom }}</strong><br>
                  <small class="text-muted">{{ prime.clientNom }}</small>
                </td>
                <td>{{ prime.chefNom }}</td>
                <td>{{ getMonthName(prime.moisFacturation) }} {{ prime.anneeFacturation }}</td>
                <td>{{ formatCurrency(prime.budgetDisponible) }}</td>
                <td>{{ prime.heuresPrevues }}h</td>
                <td>{{ prime.heuresReelles }}h</td>
                <td>
                  <span :class="prime.heuresGagnees > 0 ? 'text-success fw-bold' : 'text-danger'">
                    {{ prime.heuresGagnees > 0 ? '+' : '' }}{{ prime.heuresGagnees }}h
                  </span>
                </td>
                <td>{{ prime.heuresRegies }}h</td>
                <td>
                  <span :class="prime.primeEfficacite > 0 ? 'text-success fw-bold' : 'text-muted'">
                    {{ formatCurrency(prime.primeEfficacite) }}
                  </span>
                </td>
                <td>
                  <span :class="prime.primeRegies > 0 ? 'text-warning fw-bold' : 'text-muted'">
                    {{ formatCurrency(prime.primeRegies) }}
                  </span>
                </td>
                <td>
                  <span :class="getPrimeClass(prime.primeTotale)">
                    {{ formatCurrency(prime.primeTotale) }}
                  </span>
                </td>
                <td>
                  <button @click="voirDetail(prime)" class="btn btn-sm btn-info">
                    👁 Détail
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot class="table-secondary">
              <tr>
                <td colspan="8"><strong>TOTAUX</strong></td>
                <td><strong>{{ formatCurrency(totaux.primeEfficacite) }}</strong></td>
                <td><strong>{{ formatCurrency(totaux.primeRegies) }}</strong></td>
                <td><strong>{{ formatCurrency(totaux.primeTotale) }}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Détail -->
    <div v-if="showDetail" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5>Détail Prime: {{ detailPrime.chantierNom }}</h5>
            <button @click="showDetail = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Calcul Budget</h6>
                <p><strong>Facturé:</strong> {{ formatCurrency(detailPrime.importoFatturato) }}</p>
                <p><strong>% Impresa:</strong> {{ detailPrime.percentualeImpresa }}%</p>
                <p><strong>Budget Disponible:</strong> {{ formatCurrency(detailPrime.budgetDisponible) }}</p>
              </div>
              <div class="col-md-6">
                <h6>Calcul Heures</h6>
                <p><strong>Coût Horaire Moyen:</strong> {{ formatCurrency(detailPrime.costoOrarioMedio) }}/h</p>
                <p><strong>Heures Prévues:</strong> {{ detailPrime.heuresPrevues }}h</p>
                <p><strong>Heures Réelles:</strong> {{ detailPrime.heuresReelles }}h</p>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-md-12">
                <h6>Détail Heures Réelles</h6>
                <ul>
                  <li>Chef: {{ detailPrime.heuresChef }}h × {{ formatCurrency(45) }}/h = {{ formatCurrency(detailPrime.heuresChef * 45) }}</li>
                  <li>Ouvriers: {{ detailPrime.heuresOuvriers }}h × {{ formatCurrency(41) }}/h = {{ formatCurrency(detailPrime.heuresOuvriers * 41) }}</li>
                  <li>Intérimaires: {{ detailPrime.heuresInterim }}h × {{ formatCurrency(47.5) }}/h = {{ formatCurrency(detailPrime.heuresInterim * 47.5) }}</li>
                </ul>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-md-12">
                <div class="alert" :class="detailPrime.primeTotale > 0 ? 'alert-success' : 'alert-secondary'">
                  <h6>Résultat Final</h6>
                  <p><strong>Prime Efficacité:</strong> {{ formatCurrency(detailPrime.primeEfficacite) }}</p>
                  <p><strong>Prime Régies:</strong> {{ formatCurrency(detailPrime.primeRegies) }}</p>
                  <p><strong>Prime Totale:</strong> {{ formatCurrency(detailPrime.primeTotale) }}</p>
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
import { supabase } from '@/supabase.js';
import RetourButton from '@/components/RetourButton.vue';

// Filtres
const selectedChef = ref('');
const selectedMonth = ref('');
const selectedYear = ref(new Date().getFullYear());
const selectedStatus = ref('');

// Données
const chantiers = ref([]);
const factures = ref([]);
const metrages = ref([]);
const heuresPropres = ref([]);
const heuresInterim = ref([]);
const heuresOuvriers = ref([]);
const chefdechantiers = ref([]);

// Modal
const showDetail = ref(false);
const detailPrime = ref({});

// Chargement données (même logique que ChefPremi)
const loadData = async () => {
  const [
    { data: chantiersData },
    { data: facturesData },
    { data: metragesData },
    { data: heuresProprData },
    { data: heuresIntData },
    { data: heuresOuvData },
    { data: chefsData }
  ] = await Promise.all([
    supabase.from('chantiers').select('*'),
    supabase.from('factures').select('*'),
    supabase.from('metrages').select('*'),
    supabase.from('heures_chef_propres').select('*'),
    supabase.from('heures_chef_interim').select('*'),
    supabase.from('heures_ouvriers').select('*'),
    supabase.from('chefdechantiers').select('*')
  ]);

  chantiers.value = chantiersData || [];
  factures.value = facturesData || [];
  metrages.value = metragesData || [];
  heuresPropres.value = heuresProprData || [];
  heuresInterim.value = heuresIntData || [];
  heuresOuvriers.value = heuresOuvData || [];
  chefdechantiers.value = chefsData || [];
};

// Calcolo premi (stessa logica di ChefPremi ma con info chef)
const premesCalculated = computed(() => {
  const premesData = [];
  
  chantiers.value.forEach(chantier => {
    const facturesChantier = factures.value.filter(f => String(f.chantier_id) === String(chantier.id));
    if (facturesChantier.length === 0) return;
    
    const importoTotaleFatturato = facturesChantier.reduce((sum, f) => sum + (f.montant_ttc || 0), 0);
    const percentualeImpresa = chantier.percentuale_impresa || 30;
    const budgetOreDisponibile = importoTotaleFatturato * (1 - percentualeImpresa / 100);
    
    const heuresChefChantier = heuresPropres.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.total_heures || h.heures_propres || 0), 0);
    
    const heuresInterimChantier = heuresInterim.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.total_heures || h.heures_interim || 0), 0);
    
    const heuresOuvriersChantier = heuresOuvriers.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.heures || 0), 0);

    const heuresRegiesChantier = metrages.value
      .filter(m => String(m.chantier_id) === String(chantier.id) && m.regies)
      .reduce((sum, m) => {
        const regies = typeof m.regies === 'string' ? JSON.parse(m.regies) : m.regies;
        return sum + (regies || []).reduce((regieSum, r) => regieSum + (r.heures || 0), 0);
      }, 0);
    
    const heuresImployees = heuresChefChantier + heuresInterimChantier + heuresOuvriersChantier;
    
    const tarifChef = 45;
    const tarifOuvrier = 41;
    const tarifInterim = 47.5;
    
    const costoTotaleOre = (heuresChefChantier * tarifChef) + 
                          (heuresOuvriersChantier * tarifOuvrier) + 
                          (heuresInterimChantier * tarifInterim);
    
    const costoOrarioMedio = heuresImployees > 0 ? costoTotaleOre / heuresImployees : tarifChef;
    const heuresPrevues = budgetOreDisponibile / costoOrarioMedio;
    const heuresGagnees = heuresPrevues - heuresImployees;
    const primeEfficacite = heuresGagnees > 0 ? heuresGagnees * 26 : 0;
    const primeRegies = heuresRegiesChantier * 5;
    const prime = primeEfficacite + primeRegies;
    
    // Trova chef responsabile (prova diversi campi)
    let chefResponsable = chefdechantiers.value.find(c => 
      c.id === chantier.chef_id || 
      c.id === chantier.chef_de_chantier_id ||
      c.email === chantier.chef_email
    );
    
    // Se non trovato, cerca nelle ore chi ha lavorato come chef
    if (!chefResponsable) {
      const chefDaOre = heuresPropres.value.find(h => String(h.chantier_id) === String(chantier.id));
      if (chefDaOre) {
        chefResponsable = chefdechantiers.value.find(c => 
          c.id === chefDaOre.chef_id || 
          c.email === chefDaOre.chef_id
        );
      }
    }
    
    // Periodo fatturazione
    const primaFactura = facturesChantier.sort((a, b) => new Date(a.date_facture) - new Date(b.date_facture))[0];
    const dateFacturation = new Date(primaFactura.date_facture);
    
    premesData.push({
      chantierId: chantier.id,
      chantierNom: chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ${chantier.nom}` : chantier.nom,
      clientNom: chantier.client || 'N/A',
      chefNom: chefResponsable?.nom || chefResponsable?.prenom + ' ' + chefResponsable?.nom || 'Chef inconnu',
      chefId: chantier.chef_id,
      moisFacturation: dateFacturation.getMonth() + 1,
      anneeFacturation: dateFacturation.getFullYear(),
      budgetDisponible: budgetOreDisponibile,
      heuresPrevues: Math.round(heuresPrevues * 10) / 10,
      heuresReelles: heuresImployees,
      heuresGagnees: Math.round(heuresGagnees * 10) / 10,
      heuresRegies: Math.round(heuresRegiesChantier * 10) / 10,
      primeEfficacite: Math.round(primeEfficacite * 100) / 100,
      primeRegies: Math.round(primeRegies * 100) / 100,
      primeTotale: Math.round(prime * 100) / 100,
      // Détails pour modal
      importoFatturato: importoTotaleFatturato,
      percentualeImpresa,
      costoOrarioMedio,
      heuresChef: heuresChefChantier,
      heuresOuvriers: heuresOuvriersChantier,
      heuresInterim: heuresInterimChantier
    });
  });
  
  return premesData.sort((a, b) => b.primeTotale - a.primeTotale);
});

// Filtres computed
const availableChefs = computed(() => {
  const chefs = new Set();
  premesCalculated.value.forEach(p => chefs.add(p.chefNom));
  return Array.from(chefs).sort();
});

const availableMonths = computed(() => [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' }
]);

const availableYears = computed(() => {
  const years = new Set();
  premesCalculated.value.forEach(p => years.add(p.anneeFacturation));
  return Array.from(years).sort((a, b) => b - a);
});

const premesFiltered = computed(() => {
  return premesCalculated.value.filter(prime => {
    if (selectedChef.value && prime.chefNom !== selectedChef.value) return false;
    if (selectedMonth.value && prime.moisFacturation !== selectedMonth.value) return false;
    if (selectedYear.value && prime.anneeFacturation !== selectedYear.value) return false;
    if (selectedStatus.value === 'positif' && prime.primeTotale <= 0) return false;
    if (selectedStatus.value === 'negatif' && prime.primeTotale >= 0) return false;
    if (selectedStatus.value === 'zero' && prime.primeTotale !== 0) return false;
    return true;
  });
});

// KPIs
const kpis = computed(() => ({
  totalPrimes: premesFiltered.value.reduce((sum, p) => sum + p.primeTotale, 0),
  primesEfficacite: premesFiltered.value.reduce((sum, p) => sum + p.primeEfficacite, 0),
  primesRegies: premesFiltered.value.reduce((sum, p) => sum + p.primeRegies, 0),
  nbChantiers: premesFiltered.value.length
}));

const totaux = computed(() => ({
  primeEfficacite: premesFiltered.value.reduce((sum, p) => sum + p.primeEfficacite, 0),
  primeRegies: premesFiltered.value.reduce((sum, p) => sum + p.primeRegies, 0),
  primeTotale: premesFiltered.value.reduce((sum, p) => sum + p.primeTotale, 0)
}));

// Méthodes
const updateFilters = () => {
  // Trigger reactive update
};

const voirDetail = (prime) => {
  detailPrime.value = prime;
  showDetail.value = true;
};

const exportCSV = () => {
  const headers = ['Chantier', 'Chef', 'Période', 'Budget', 'H.Prévues', 'H.Réelles', 'H.Gagnées', 'H.Régies', 'Prime Efficacité', 'Prime Régies', 'Prime Totale'];
  const rows = premesFiltered.value.map(p => [
    p.chantierNom, p.chefNom, `${getMonthName(p.moisFacturation)} ${p.anneeFacturation}`,
    p.budgetDisponible, p.heuresPrevues, p.heuresReelles, p.heuresGagnees, p.heuresRegies,
    p.primeEfficacite, p.primeRegies, p.primeTotale
  ]);
  
  const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `primes_${selectedYear.value}.csv`;
  a.click();
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF'
  }).format(amount);
};

const getPrimeClass = (amount) => {
  if (amount > 0) return 'text-success fw-bold';
  if (amount < 0) return 'text-danger fw-bold';
  return 'text-muted';
};

const getMonthName = (monthNum) => {
  const months = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return months[monthNum] || '';
};

onMounted(() => {
  loadData();
});
</script>