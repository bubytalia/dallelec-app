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
              <div class="col-md-4">
                <label>Chef de Chantier</label>
                <select v-model="selectedChef" class="form-select">
                  <option value="">Tous les chefs</option>
                  <option v-for="chef in availableChefs" :key="chef.email" :value="chef.email">
                    {{ chef.prenom }} {{ chef.nom }}
                  </option>
                </select>
              </div>
              <div class="col-md-4">
                <label>Mois</label>
                <select v-model="selectedMonth" class="form-select">
                  <option value="">Tous les mois</option>
                  <option v-for="month in availableMonths" :key="month.value" :value="month.value">
                    {{ month.label }}
                  </option>
                </select>
              </div>
              <div class="col-md-4">
                <label>Année</label>
                <select v-model="selectedYear" class="form-select">
                  <option value="">Toutes les années</option>
                  <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
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
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body text-center">
            <h5>Primes Efficacité</h5>
            <h3>{{ formatCurrency(kpis.primesEfficacite) }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-white">
          <div class="card-body text-center">
            <h5>Primes Régies</h5>
            <h3>{{ formatCurrency(kpis.primesRegies) }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body text-center">
            <h5>Chantiers</h5>
            <h3>{{ kpis.nbChantiers }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Détail par Chef -->
    <div v-for="chef in chefsWithPrimes" :key="chef.email" class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">{{ chef.prenom }} {{ chef.nom }}</h5>
        <span class="badge" :class="chef.totalPrime > 0 ? 'bg-success' : 'bg-secondary'">
          Total: {{ formatCurrency(chef.totalPrime) }}
        </span>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped table-sm">
            <thead>
              <tr>
                <th>Chantier</th>
                <th>Client</th>
                <th>Budget (CHF)</th>
                <th>H. Prévues</th>
                <th>H. Réelles</th>
                <th>H. Gagnées</th>
                <th>H. Régies</th>
                <th>Prime Eff.</th>
                <th>Prime Rég.</th>
                <th>Prime Totale</th>
                <th>Détail</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prime in chef.primes" :key="prime.chantierId">
                <td><strong>{{ prime.chantierNom }}</strong></td>
                <td>{{ prime.clientNom }}</td>
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
                  <span :class="prime.primeEfficacite > 0 ? 'text-success' : 'text-muted'">
                    {{ formatCurrency(prime.primeEfficacite) }}
                  </span>
                </td>
                <td>
                  <span :class="prime.primeRegies > 0 ? 'text-warning' : 'text-muted'">
                    {{ formatCurrency(prime.primeRegies) }}
                  </span>
                </td>
                <td>
                  <span :class="prime.primeTotale > 0 ? 'text-success fw-bold' : 'text-muted'">
                    {{ formatCurrency(prime.primeTotale) }}
                  </span>
                </td>
                <td>
                  <button @click="voirDetail(prime)" class="btn btn-sm btn-outline-info">👁</button>
                </td>
              </tr>
            </tbody>
            <tfoot class="table-secondary">
              <tr>
                <td colspan="7"><strong>Total {{ chef.prenom }} {{ chef.nom }}</strong></td>
                <td><strong>{{ formatCurrency(chef.totalEfficacite) }}</strong></td>
                <td><strong>{{ formatCurrency(chef.totalRegies) }}</strong></td>
                <td><strong>{{ formatCurrency(chef.totalPrime) }}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <div v-if="chefsWithPrimes.length === 0" class="alert alert-info text-center">
      Aucune donnée de prime disponible pour les filtres sélectionnés.
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
                <p><strong>Facturé TTC:</strong> {{ formatCurrency(detailPrime.importoFatturato) }}</p>
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
                  <li>Chef: {{ detailPrime.heuresChef }}h × 45 CHF/h = {{ formatCurrency(detailPrime.heuresChef * 45) }}</li>
                  <li>Ouvriers: {{ detailPrime.heuresOuvriers }}h × 41 CHF/h = {{ formatCurrency(detailPrime.heuresOuvriers * 41) }}</li>
                  <li>Intérimaires: {{ detailPrime.heuresInterim }}h × 47.5 CHF/h = {{ formatCurrency(detailPrime.heuresInterim * 47.5) }}</li>
                </ul>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-md-12">
                <div class="alert" :class="detailPrime.primeTotale > 0 ? 'alert-success' : 'alert-warning'">
                  <h6>Résultat</h6>
                  <p v-if="detailPrime.heuresGagnees > 0">
                    ✅ <strong>{{ detailPrime.heuresGagnees }}h gagnées</strong> → Prime efficacité: {{ formatCurrency(detailPrime.primeEfficacite) }}
                  </p>
                  <p v-else>
                    ❌ <strong>{{ Math.abs(detailPrime.heuresGagnees) }}h en excès</strong> → Pas de prime efficacité
                    <br><small class="text-muted">Il faudrait réduire de {{ Math.abs(detailPrime.heuresGagnees) }}h pour atteindre le budget</small>
                  </p>
                  <p v-if="detailPrime.heuresRegies > 0">
                    ✅ <strong>{{ detailPrime.heuresRegies }}h régies</strong> → Prime régies: {{ formatCurrency(detailPrime.primeRegies) }}
                  </p>
                  <hr>
                  <p class="mb-0"><strong>Prime Totale: {{ formatCurrency(detailPrime.primeTotale) }}</strong></p>
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
const selectedYear = ref('');

// Données
const chantiers = ref([]);
const factures = ref([]);
const metrages = ref([]);
const resocontiPercentuali = ref([]);
const heuresPropres = ref([]);
const heuresInterimData = ref([]);
const heuresOuvriersData = ref([]);
const chefdechantiers = ref([]);

// Modal
const showDetail = ref(false);
const detailPrime = ref({});

// Chargement données
const loadData = async () => {
  try {
    const [ch, fa, me, hp, hi, ho, cdc] = await Promise.all([
      supabase.from('chantiers').select('*'),
      supabase.from('factures').select('*'),
      supabase.from('metrages').select('*'),
      supabase.from('heures_chef_propres').select('*'),
      supabase.from('heures_chef_interim').select('*'),
      supabase.from('heures_ouvriers').select('*'),
      supabase.from('chefdechantiers').select('*')
    ]);

    chantiers.value = ch.data || [];
    factures.value = fa.data || [];
    metrages.value = me.data || [];
    heuresPropres.value = hp.data || [];
    heuresInterimData.value = hi.data || [];
    heuresOuvriersData.value = ho.data || [];
    chefdechantiers.value = cdc.data || [];

    // Resoconti (table might not exist)
    const { data: rp } = await supabase.from('resoconti_percentuali').select('*');
    resocontiPercentuali.value = rp || [];
  } catch (error) {
    console.error('Erreur chargement données primes:', error);
  }
};

// Calcul primes par chantier
const premesCalculated = computed(() => {
  return chantiers.value.map(chantier => {
    const facturesChantier = factures.value.filter(f => String(f.chantier_id) === String(chantier.id));
    if (facturesChantier.length === 0) return null;

    const importoTotaleFatturato = facturesChantier.reduce((sum, f) => sum + (parseFloat(f.montant_ttc) || 0), 0);
    const percentualeImpresa = chantier.percentuale_impresa || 30;
    const budgetOreDisponibile = importoTotaleFatturato * (1 - percentualeImpresa / 100);

    // Heures par type
    const heuresChef = heuresPropres.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.total_heures || 0), 0);

    const heuresInterim = heuresInterimData.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.total_heures || 0), 0);

    const heuresOuvriers = heuresOuvriersData.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.heures || 0), 0);

    // Heures régies
    const heuresRegiesMetrages = metrages.value
      .filter(m => String(m.chantier_id) === String(chantier.id) && m.regies)
      .reduce((sum, m) => {
        const regies = typeof m.regies === 'string' ? JSON.parse(m.regies) : m.regies;
        return sum + (regies || []).reduce((rs, r) => rs + (r.heures || 0), 0);
      }, 0);

    const heuresRegiesResoconti = resocontiPercentuali.value
      .filter(r => String(r.chantier_id) === String(chantier.id) && r.regies && r.status === 'approved')
      .reduce((sum, r) => {
        const regies = typeof r.regies === 'string' ? JSON.parse(r.regies) : r.regies;
        return sum + (regies || []).reduce((rs, rg) => rs + (rg.heures || 0), 0);
      }, 0);

    const heuresRegies = heuresRegiesMetrages + heuresRegiesResoconti;
    const heuresReelles = heuresChef + heuresInterim + heuresOuvriers;

    // Coût horaire moyen pondéré
    const tarifChef = 45, tarifOuvrier = 41, tarifInterim = 47.5;
    const coutTotal = (heuresChef * tarifChef) + (heuresOuvriers * tarifOuvrier) + (heuresInterim * tarifInterim);
    const costoOrarioMedio = heuresReelles > 0 ? coutTotal / heuresReelles : tarifChef;

    // Heures prévues et gagnées
    const heuresPrevues = costoOrarioMedio > 0 ? budgetOreDisponibile / costoOrarioMedio : 0;
    const heuresGagnees = heuresPrevues - heuresReelles;

    // Primes
    const primeEfficacite = heuresGagnees > 0 ? heuresGagnees * 26 : 0;
    const primeRegies = heuresRegies * 5;
    const primeTotale = primeEfficacite + primeRegies;

    // Période (basée sur la première facture)
    const primaFactura = [...facturesChantier].sort((a, b) => new Date(a.date_facture) - new Date(b.date_facture))[0];
    const dateFacturation = primaFactura?.date_facture ? new Date(primaFactura.date_facture) : new Date();

    return {
      chantierId: chantier.id,
      chantierNom: chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ${chantier.nom}` : chantier.nom,
      clientNom: chantier.client || 'N/A',
      capocantiere: chantier.capocantiere || '',
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
      // Détails modal
      importoFatturato: importoTotaleFatturato,
      percentualeImpresa,
      costoOrarioMedio: Math.round(costoOrarioMedio * 100) / 100,
      heuresChef: Math.round(heuresChef * 10) / 10,
      heuresOuvriers: Math.round(heuresOuvriers * 10) / 10,
      heuresInterim: Math.round(heuresInterim * 10) / 10
    };
  }).filter(Boolean);
});

// Filtrage
const premesFiltered = computed(() => {
  return premesCalculated.value.filter(p => {
    if (selectedChef.value && p.capocantiere !== selectedChef.value) return false;
    if (selectedMonth.value && p.moisFacturation !== selectedMonth.value) return false;
    if (selectedYear.value && p.anneeFacturation !== selectedYear.value) return false;
    return true;
  });
});

// Grouper par chef
const chefsWithPrimes = computed(() => {
  const map = new Map();

  premesFiltered.value.forEach(prime => {
    const email = prime.capocantiere;
    if (!map.has(email)) {
      const chef = chefdechantiers.value.find(c => c.email === email);
      map.set(email, {
        email,
        nom: chef?.nom || email.split('@')[0],
        prenom: chef?.prenom || '',
        primes: [],
        totalEfficacite: 0,
        totalRegies: 0,
        totalPrime: 0
      });
    }
    const entry = map.get(email);
    entry.primes.push(prime);
    entry.totalEfficacite += prime.primeEfficacite;
    entry.totalRegies += prime.primeRegies;
    entry.totalPrime += prime.primeTotale;
  });

  return Array.from(map.values()).sort((a, b) => b.totalPrime - a.totalPrime);
});

// Filtres disponibles
const availableChefs = computed(() => {
  const emails = new Set(premesCalculated.value.map(p => p.capocantiere).filter(Boolean));
  return Array.from(emails).map(email => {
    const chef = chefdechantiers.value.find(c => c.email === email);
    return { email, nom: chef?.nom || email.split('@')[0], prenom: chef?.prenom || '' };
  }).sort((a, b) => a.nom.localeCompare(b.nom));
});

const availableMonths = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' }
];

const availableYears = computed(() => {
  const years = new Set(premesCalculated.value.map(p => p.anneeFacturation));
  return Array.from(years).sort((a, b) => b - a);
});

// KPIs
const kpis = computed(() => ({
  totalPrimes: premesFiltered.value.reduce((sum, p) => sum + p.primeTotale, 0),
  primesEfficacite: premesFiltered.value.reduce((sum, p) => sum + p.primeEfficacite, 0),
  primesRegies: premesFiltered.value.reduce((sum, p) => sum + p.primeRegies, 0),
  nbChantiers: premesFiltered.value.length
}));

// Méthodes
const voirDetail = (prime) => {
  detailPrime.value = prime;
  showDetail.value = true;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount || 0);
};

onMounted(() => { loadData(); });
</script>

<style scoped>
.modal { z-index: 1050; }
</style>
