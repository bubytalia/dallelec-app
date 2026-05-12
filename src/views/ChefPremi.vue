<template>
  <div class="container py-4">
    <RetourButton to="/chef" />
    
    <h2 class="text-center mb-4">Mes Primes</h2>

    <!-- Filtres -->
    <div class="row mb-4">
      <div class="col-md-6">
        <label class="form-label">Mois</label>
        <select v-model="selectedMonth" class="form-select">
          <option value="">Tous les mois</option>
          <option v-for="month in availableMonths" :key="month.value" :value="month.value">
            {{ month.label }}
          </option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Année</label>
        <select v-model="selectedYear" class="form-select">
          <option value="">Toutes les années</option>
          <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
        </select>
      </div>
    </div>

    <!-- Résumé -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card bg-success text-white">
          <div class="card-body text-center">
            <h5>Prime Totale</h5>
            <h3>{{ formatCurrency(totalPrime) }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card bg-primary text-white">
          <div class="card-body text-center">
            <h5>Heures Gagnées</h5>
            <h3>{{ totalHeuresGagnees > 0 ? '+' : '' }}{{ totalHeuresGagnees.toFixed(1) }}h</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card bg-warning text-white">
          <div class="card-body text-center">
            <h5>Heures Régies</h5>
            <h3>{{ totalHeuresRegies.toFixed(1) }}h</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Détail par chantier -->
    <div v-for="chantier in chantiersFiltered" :key="chantier.chantierId" class="card mb-3">
      <div class="card-header d-flex justify-content-between align-items-center"
           :class="chantier.primeTotale > 0 ? 'bg-light' : ''">
        <div>
          <strong>{{ chantier.chantierNom }}</strong>
          <small class="text-muted ms-2">{{ chantier.clientNom }}</small>
        </div>
        <span class="badge" :class="chantier.primeTotale > 0 ? 'bg-success' : 'bg-secondary'">
          {{ formatCurrency(chantier.primeTotale) }}
        </span>
      </div>
      <div class="card-body">
        <div class="row">
          <!-- Colonne gauche: données -->
          <div class="col-md-6">
            <table class="table table-sm mb-0">
              <tr>
                <td>Heures prévues</td>
                <td class="text-end">{{ chantier.heuresPrevues }}h</td>
              </tr>
              <tr>
                <td>Heures réelles employées</td>
                <td class="text-end">{{ chantier.heuresReelles }}h</td>
              </tr>
              <tr>
                <td>Heures gagnées</td>
                <td class="text-end">
                  <span :class="chantier.heuresGagnees > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'">
                    {{ chantier.heuresGagnees > 0 ? '+' : '' }}{{ chantier.heuresGagnees }}h
                  </span>
                </td>
              </tr>
              <tr>
                <td>Heures régies</td>
                <td class="text-end">{{ chantier.heuresRegies }}h</td>
              </tr>
            </table>
          </div>
          <!-- Colonne droite: résultat -->
          <div class="col-md-6">
            <div v-if="chantier.primeTotale > 0" class="alert alert-success mb-0">
              <p v-if="chantier.payee" class="mb-1">
                💰 <strong>Payé en {{ getMonthLabel(chantier.moisPaiement) }}</strong>
              </p>
              <p v-if="chantier.primeEfficacite > 0" class="mb-1">
                ✅ Prime efficacité: <strong>{{ formatCurrency(chantier.primeEfficacite) }}</strong>
                <br><small>{{ chantier.heuresGagnees }}h gagnées</small>
              </p>
              <p v-if="chantier.primeRegies > 0" class="mb-1">
                ✅ Prime régies: <strong>{{ formatCurrency(chantier.primeRegies) }}</strong>
                <br><small>{{ chantier.heuresRegies }}h régies</small>
              </p>
              <hr class="my-2">
              <p class="mb-0 fw-bold">Total: {{ formatCurrency(chantier.primeTotale) }}</p>
            </div>
            <div v-else class="alert alert-warning mb-0">
              <p class="mb-1">❌ <strong>Pas de prime</strong></p>
              <p class="mb-1 text-muted">
                <small>
                  Heures employées ({{ chantier.heuresReelles }}h) supérieures aux heures prévues ({{ chantier.heuresPrevues }}h).
                  <br>Excès: {{ Math.abs(chantier.heuresGagnees) }}h
                </small>
              </p>
              <p v-if="chantier.heuresRegies > 0" class="mb-0 text-muted">
                <small>⚠️ {{ chantier.heuresRegies }}h régies non éligibles</small>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="chantiersFiltered.length === 0" class="alert alert-info text-center">
      Aucun chantier avec facturation trouvé pour la période sélectionnée.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/supabase.js';
import RetourButton from '@/components/RetourButton.vue';

const selectedMonth = ref('');
const selectedYear = ref('');
const currentUserEmail = ref('');
const primesPaiements = ref([]);

// Données
const chantiers = ref([]);
const factures = ref([]);
const metrages = ref([]);
const resocontiPercentuali = ref([]);
const heuresPropres = ref([]);
const heuresInterimData = ref([]);
const heuresOuvriersData = ref([]);

const loadData = async () => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  currentUserEmail.value = user?.email || '';

  const [ch, fa, me, hp, hi, ho] = await Promise.all([
    supabase.from('chantiers').select('*'),
    supabase.from('factures').select('*'),
    supabase.from('metrages').select('*'),
    supabase.from('heures_chef_propres').select('*'),
    supabase.from('heures_chef_interim').select('*'),
    supabase.from('heures_ouvriers').select('*')
  ]);

  chantiers.value = ch.data || [];
  factures.value = fa.data || [];
  metrages.value = me.data || [];
  heuresPropres.value = hp.data || [];
  heuresInterimData.value = hi.data || [];
  heuresOuvriersData.value = ho.data || [];

  // Resoconti
  const { data: rp } = await supabase.from('resoconti_percentuali').select('*');
  resocontiPercentuali.value = rp || [];

  // Paiements
  const { data: pp } = await supabase.from('primes_paiements').select('*');
  primesPaiements.value = pp || [];
};

// Calcul montant régies pour un chantier
const getRegiesData = (chantierId) => {
  let heures = 0;
  let montant = 0;

  // Régies depuis métrages
  metrages.value
    .filter(m => String(m.chantier_id) === String(chantierId) && m.regies)
    .forEach(m => {
      const regies = typeof m.regies === 'string' ? JSON.parse(m.regies) : m.regies;
      (regies || []).forEach(r => {
        heures += r.heures || 0;
        montant += (r.heures || 0) * (r.prixHeure || 0);
      });
    });

  // Régies depuis resoconti percentuali
  resocontiPercentuali.value
    .filter(r => String(r.chantier_id) === String(chantierId) && r.regies && r.status === 'approved')
    .forEach(r => {
      const regies = typeof r.regies === 'string' ? JSON.parse(r.regies) : r.regies;
      (regies || []).forEach(rg => {
        heures += rg.heures || 0;
        montant += (rg.heures || 0) * (rg.prixHeure || 0);
      });
    });

  // Régies depuis factures manuelles (regies_manuelles)
  factures.value
    .filter(f => String(f.chantier_id) === String(chantierId) && f.regies_manuelles)
    .forEach(f => {
      const regies = typeof f.regies_manuelles === 'string' ? JSON.parse(f.regies_manuelles) : f.regies_manuelles;
      (regies || []).forEach(r => {
        heures += r.heures || 0;
        montant += (r.heures || 0) * (r.prixHeure || 0);
      });
    });

  return { heures, montant };
};

// Calcul primes pour les chantiers du chef connecté
const mesChantiersPrimes = computed(() => {
  const mesChantiers = chantiers.value.filter(c => c.capocantiere === currentUserEmail.value);

  return mesChantiers.map(chantier => {
    const facturesChantier = factures.value.filter(f => String(f.chantier_id) === String(chantier.id));
    if (facturesChantier.length === 0) return null;

    const importoTotaleFatturato = facturesChantier.reduce((sum, f) => sum + (parseFloat(f.montant_ttc) || 0), 0);

    // Régies: heures et montant facturé
    const regiesData = getRegiesData(chantier.id);
    const montantRegiesTTC = regiesData.montant * 1.081;

    // Fatturato HORS régies
    const fatturatHorsRegies = importoTotaleFatturato - montantRegiesTTC;

    const percentualeImpresa = chantier.percentuale_impresa || 30;
    const budgetOreDisponibile = fatturatHorsRegies * (1 - percentualeImpresa / 100);

    const heuresChef = heuresPropres.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.total_heures || 0), 0);

    const heuresInterim = heuresInterimData.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.total_heures || 0), 0);

    const heuresOuvriers = heuresOuvriersData.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.heures || 0), 0);

    const heuresRegies = regiesData.heures;
    const heuresTotales = heuresChef + heuresInterim + heuresOuvriers;
    const heuresReelles = heuresTotales - heuresRegies;

    const tarifChef = 45, tarifOuvrier = 41, tarifInterim = 47.5;
    const coutTotal = (heuresChef * tarifChef) + (heuresOuvriers * tarifOuvrier) + (heuresInterim * tarifInterim);
    const costoOrarioMedio = heuresTotales > 0 ? coutTotal / heuresTotales : tarifChef;

    const heuresPrevues = costoOrarioMedio > 0 ? budgetOreDisponibile / costoOrarioMedio : 0;
    const heuresGagnees = heuresPrevues - heuresReelles;

    const primeEfficacite = heuresGagnees > 0 ? heuresGagnees * 26 : 0;
    const enAttivo = heuresGagnees > 0;
    const primeRegies = enAttivo ? heuresRegies * 5 : 0;
    const primeTotale = primeEfficacite + primeRegies;

    // Période
    const primaFactura = [...facturesChantier].sort((a, b) => new Date(a.date_facture) - new Date(b.date_facture))[0];
    const dateFacturation = primaFactura?.date_facture ? new Date(primaFactura.date_facture) : new Date();

    // Paiement
    const paiement = primesPaiements.value.find(pp => pp.chantier_id === chantier.id && pp.capocantiere === chantier.capocantiere);

    return {
      chantierId: chantier.id,
      chantierNom: chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ${chantier.nom}` : chantier.nom,
      clientNom: chantier.client || 'N/A',
      moisFacturation: dateFacturation.getMonth() + 1,
      anneeFacturation: dateFacturation.getFullYear(),
      budgetDisponible: Math.round(budgetOreDisponibile * 100) / 100,
      heuresPrevues: Math.round(heuresPrevues * 10) / 10,
      heuresReelles: Math.round(heuresReelles * 10) / 10,
      heuresGagnees: Math.round(heuresGagnees * 10) / 10,
      heuresRegies: Math.round(heuresRegies * 10) / 10,
      primeEfficacite: Math.round(primeEfficacite * 100) / 100,
      primeRegies: Math.round(primeRegies * 100) / 100,
      primeTotale: Math.round(primeTotale * 100) / 100,
      enAttivo,
      payee: !!paiement,
      moisPaiement: paiement?.mois_paiement || ''
    };
  }).filter(Boolean);
});

// Filtrage
const chantiersFiltered = computed(() => {
  return mesChantiersPrimes.value.filter(c => {
    if (selectedMonth.value && c.moisFacturation !== selectedMonth.value) return false;
    if (selectedYear.value && c.anneeFacturation !== selectedYear.value) return false;
    return true;
  }).sort((a, b) => b.primeTotale - a.primeTotale);
});

// Totaux
const totalPrime = computed(() => chantiersFiltered.value.reduce((sum, c) => sum + c.primeTotale, 0));
const totalHeuresGagnees = computed(() => chantiersFiltered.value.reduce((sum, c) => sum + c.heuresGagnees, 0));
const totalHeuresRegies = computed(() => chantiersFiltered.value.reduce((sum, c) => sum + c.heuresRegies, 0));

// Filtres
const availableMonths = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' }
];

const availableYears = computed(() => {
  const years = new Set(mesChantiersPrimes.value.map(c => c.anneeFacturation));
  return Array.from(years).sort((a, b) => b - a);
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount || 0);
};

const getMonthLabel = (moisStr) => {
  if (!moisStr) return '';
  const [y, m] = moisStr.split('-');
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${months[parseInt(m)-1]} ${y}`;
};

onMounted(() => { loadData(); });
</script>

<style scoped>
.card-header.bg-light { border-left: 4px solid #198754; }
</style>
