<template>
  <div class="container py-5">
    <RetourButton to="/chef" />
    
    <h2 class="text-center mb-4">Gestion des Primes</h2>
    
    <!-- Filtro temporale -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5>Primes par période</h5>
            <div class="d-flex gap-2">
              <select v-model="selectedMonth" @change="updatePeriod" class="form-select">
                <option value="">Tous les mois</option>
                <option v-for="month in availableMonths" :key="month.value" :value="month.value">
                  {{ month.label }}
                </option>
              </select>
              <select v-model="selectedYear" @change="updatePeriod" class="form-select">
                <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Riepilogo generale premi -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Résumé des primes {{ selectedMonth ? getMonthName(selectedMonth) : '' }} {{ selectedYear }}</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-primary">{{ totalHeuresPrevuesFiltered.toFixed(1) }}h</h4>
                  <p>Total heures prévues</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-info">{{ totalHeuresImployeesFiltered.toFixed(1) }}h</h4>
                  <p>Total heures employées</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 :class="totalHeuresGagneesFiltered > 0 ? 'text-success' : 'text-danger'">{{ totalHeuresGagneesFiltered > 0 ? '+' : '' }}{{ totalHeuresGagneesFiltered.toFixed(1) }}h</h4>
                  <p>Heures gagnées</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 :class="totalPrimeFiltered > 0 ? 'text-success' : 'text-muted'">{{ (totalPrimeFiltered / 26).toFixed(1) }}h</h4>
                  <p>Prime totale (heures)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dettaglio per cantiere -->
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Détail par chantier</h5>
          </div>
          <div class="card-body">
            <div v-if="chantiersAvecMetrages.length === 0" class="text-center text-muted">
              Aucun chantier avec métrages enregistrés
            </div>
            <div v-else>
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Chantier</th>
                    <th>Heures prévues</th>
                    <th>Heures employées</th>
                    <th>Heures gagnées</th>
                    <th>Heures régies</th>
                    <th>Prime efficacité</th>
                    <th>Prime régies</th>
                    <th>Prime totale</th>
                    <th>Période</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="chantier in chantiersFiltered" :key="chantier.id">
                    <td>
                      <strong>{{ chantier.nom }}</strong><br>
                      <small class="text-muted">{{ chantier.adresse }}</small>
                    </td>
                    <td>{{ chantier.heuresPrevues }}h</td>
                    <td>{{ chantier.heuresImployees }}h</td>
                    <td>
                      <span :class="chantier.heuresGagnees > 0 ? 'text-success fw-bold' : 'text-danger'">
                        {{ chantier.heuresGagnees > 0 ? '+' : '' }}{{ chantier.heuresGagnees }}h
                      </span>
                    </td>
                    <td>
                      <span class="text-warning fw-bold">
                        {{ chantier.heuresRegies }}h
                      </span>
                    </td>
                    <td>
                      <span :class="chantier.primeEfficacite > 0 ? 'text-success fw-bold' : 'text-muted'">
                        {{ chantier.primeEfficacite.toFixed(2) }} CHF
                      </span>
                    </td>
                    <td>
                      <span :class="chantier.primeRegies > 0 ? 'text-warning fw-bold' : 'text-muted'">
                        {{ chantier.primeRegies.toFixed(2) }} CHF
                      </span>
                    </td>
                    <td>
                      <span :class="chantier.prime > 0 ? 'text-success fw-bold' : 'text-muted'">
                        {{ chantier.prime.toFixed(2) }} CHF
                      </span>
                    </td>
                    <td>{{ getMonthName(chantier.moisFacturation) }} {{ chantier.anneeFacturation }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="table-primary">
                    <td><strong>Total</strong></td>
                    <td><strong>{{ totalHeuresPrevuesFiltered.toFixed(1) }}h</strong></td>
                    <td><strong>{{ totalHeuresImployeesFiltered.toFixed(1) }}h</strong></td>
                    <td><strong>{{ totalHeuresGagneesFiltered.toFixed(1) }}h</strong></td>
                    <td><strong>{{ totalHeuresRegiesFiltered.toFixed(1) }}h</strong></td>
                    <td><strong>{{ totalPrimeEfficaciteFiltered.toFixed(2) }} CHF</strong></td>
                    <td><strong>{{ totalPrimeRegiesFiltered.toFixed(2) }} CHF</strong></td>
                    <td><strong>{{ totalPrimeFiltered.toFixed(2) }} CHF</strong></td>
                    <td></td>
                  </tr>
                </tfoot>

              </table>
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

const chantiers = ref([]);
const devis = ref([]);
const factures = ref([]);
const metrages = ref([]);
const heuresPropres = ref([]);
const heuresInterim = ref([]);
const heuresOuvriers = ref([]);
const collaborateurs = ref([]);
const interimaires = ref([]);
const selectedMonth = ref('');
const selectedYear = ref(new Date().getFullYear());

const fetchChantiers = async () => {
  const { data } = await supabase.from('chantiers').select('*');
  chantiers.value = data || [];
};

const fetchDevis = async () => {
  const { data } = await supabase.from('devis').select('*');
  devis.value = data || [];
};

const fetchMetrages = async () => {
  const { data } = await supabase.from('metrages').select('*');
  metrages.value = data || [];
};

const fetchHeuresPropres = async () => {
  const { data } = await supabase.from('heures_chef_propres').select('*');
  heuresPropres.value = data || [];
};

const fetchHeuresInterim = async () => {
  const { data } = await supabase.from('heures_chef_interim').select('*');
  heuresInterim.value = data || [];
};

const fetchHeuresOuvriers = async () => {
  try {
    let { data, error } = await supabase.from('heures_ouvriers').select('*');
    if (error) {
      const result = await supabase.from('heures').select('*');
      data = result.data;
    }
    heuresOuvriers.value = data || [];
  } catch (error) {
    heuresOuvriers.value = [];
  }
};

const fetchFactures = async () => {
  const { data } = await supabase.from('factures').select('*');
  factures.value = data || [];
};

const fetchCollaborateurs = async () => {
  const { data } = await supabase.from('collaborateurs').select('*');
  collaborateurs.value = data || [];
};

const fetchInterimaires = async () => {
  const { data } = await supabase.from('interimaires').select('*');
  interimaires.value = data || [];
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

const getMonthName = (monthNum) => {
  if (!monthNum) return '';
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return months[monthNum - 1] || '';
};

const updatePeriod = () => {
  // Trigger reactive update
};

// Mois disponibili
const availableMonths = computed(() => {
  return [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];
});

// Anni disponibili
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 2; year <= currentYear + 1; year++) {
    years.push(year);
  }
  return years;
});

// Computed per calcolare i dati dei premi secondo la formula corretta
const chantiersAvecMetrages = computed(() => {
  const chantiersData = [];
  
  chantiers.value.forEach(chantier => {
    // 1. Trova factures per questo cantiere (quantità posate fatturate)
    const facturesChantier = factures.value.filter(f => f.chantier_id === chantier.id);
    if (facturesChantier.length === 0) return;
    
    const importoTotaleFatturato = facturesChantier.reduce((sum, f) => sum + (f.montant_ttc || 0), 0);
    
    // 2. Importo - % impresa (percentuale configurabile per cantiere)
    const percentualeImpresa = chantier.percentuale_impresa || 30; // Default 30%
    const budgetOreDisponibile = importoTotaleFatturato * (1 - percentualeImpresa / 100);
    
    // 3. Calcola ore impiegate reali (ESCLUSE le regie) e costo orario medio
    if (chantier.nom === 'torre di pisa') {
      console.log('🔍 DEBUG cantiere torre di pisa:');
      console.log('Chantier ID:', chantier.id);
      console.log('Heures propres totali:', heuresPropres.value.length);
      console.log('Sample heures propres:', JSON.stringify(heuresPropres.value.slice(0, 2), null, 2));
      console.log('Heures ouvriers totali:', heuresOuvriers.value.length);
      console.log('Sample heures ouvriers:', JSON.stringify(heuresOuvriers.value.slice(0, 2), null, 2));
    }
    
    const heuresChefFiltered = heuresPropres.value.filter(h => String(h.chantier_id) === String(chantier.id));
    if (chantier.nom === 'torre di pisa') {
      console.log('Heures chef filtrate:', heuresChefFiltered.length, heuresChefFiltered);
    }
    const heuresChefChantier = heuresChefFiltered.reduce((sum, h) => sum + (h.total_heures || h.heures_propres || 0), 0);
    
    const heuresInterimChantier = heuresInterim.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.total_heures || h.heures_interim || 0), 0);
    
    const heuresOuvriersFiltered = heuresOuvriers.value.filter(h => String(h.chantier_id) === String(chantier.id));
    if (chantier.nom === 'torre di pisa') {
      console.log('Heures ouvriers filtrate:', heuresOuvriersFiltered.length, heuresOuvriersFiltered);
    }
    const heuresOuvriersChantier = heuresOuvriersFiltered.reduce((sum, h) => sum + (h.heures || 0), 0);
    
    // Calcola ore regie da métrages e resoconti (SEPARATE per premi)
    const heuresRegiesChantier = [...metrages.value]
      .filter(m => (m.chantier_id === chantier.id || m.chantierId === chantier.id) && m.regies)
      .reduce((sum, m) => {
        const regies = typeof m.regies === 'string' ? JSON.parse(m.regies) : m.regies;
        return sum + (regies || []).reduce((regieSum, r) => regieSum + (r.heures || 0), 0);
      }, 0);
    
    const heuresImployees = heuresChefChantier + heuresInterimChantier + heuresOuvriersChantier;
    
    if (chantier.nom === 'torre di pisa') {
      console.log('⏰ Ore trovate per torre di pisa:');
      console.log('Chef:', heuresChefChantier, 'Interim:', heuresInterimChantier, 'Ouvriers:', heuresOuvriersChantier);
      console.log('Total:', heuresImployees);
    }
    
    // 4. Calcola costo orario medio ponderato dei dipendenti intervenuti
    const tarifChef = 45; // CHF/h
    const tarifOuvrier = 41; // CHF/h (come da tabella bilans)
    const tarifInterim = 47.5; // CHF/h (come da tabella bilans)
    
    const costoTotaleOre = (heuresChefChantier * tarifChef) + 
                          (heuresOuvriersChantier * tarifOuvrier) + 
                          (heuresInterimChantier * tarifInterim);
    
    const costoOrarioMedio = heuresImployees > 0 ? costoTotaleOre / heuresImployees : tarifChef;
    
    // 5. Ore previste teoriche = Budget disponibile / Costo orario medio
    const heuresPrevues = budgetOreDisponibile / costoOrarioMedio;
    
    // 6. Calcolo premio: se ore reali < ore previste → premio + premio regie
    const heuresGagnees = heuresPrevues - heuresImployees;
    const primeEfficacite = heuresGagnees > 0 ? heuresGagnees * 26 : 0; // 26 CHF/h solo se positivo
    
    // 7. Premio regie: 5 CHF per ogni ora di regie (se cantiere attivo)
    const primeRegies = heuresRegiesChantier * 5; // 5 CHF/h per regie
    
    const prime = primeEfficacite + primeRegies;
    
    // Trova ultima attività
    const dernierMetrage = metrages.value
      .filter(m => m.chantier_id === chantier.id || m.chantierId === chantier.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    const derniereHeure = [...heuresPropres.value, ...heuresInterim.value, ...heuresOuvriers.value]
      .filter(h => h.chantier_id === chantier.id || h.chantierId === chantier.id)
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))[0];
    
    const derniereMiseAJour = new Date(dernierMetrage?.created_at || derniereHeure?.date || derniereHeure?.created_at || new Date());
    
    // Determina mese e anno di fatturazione (dalla prima fattura)
    const primaFactura = facturesChantier.sort((a, b) => new Date(a.date_facture) - new Date(b.date_facture))[0];
    const dateFacturation = new Date(primaFactura.date_facture);
    const moisFacturation = dateFacturation.getMonth() + 1;
    const anneeFacturation = dateFacturation.getFullYear();
    
    chantiersData.push({
      id: chantier.id,
      nom: chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ${chantier.nom}` : chantier.nom,
      adresse: chantier.adresse,
      heuresPrevues: Math.round(heuresPrevues * 10) / 10,
      heuresImployees,
      heuresGagnees: Math.round(heuresGagnees * 10) / 10,
      heuresRegies: Math.round(heuresRegiesChantier * 10) / 10,
      primeEfficacite: Math.round(primeEfficacite * 100) / 100,
      primeRegies: Math.round(primeRegies * 100) / 100,
      prime: Math.round(prime * 100) / 100,
      moisFacturation,
      anneeFacturation,
      derniereMiseAJour
    });
  });
  
  return chantiersData.sort((a, b) => new Date(b.derniereMiseAJour) - new Date(a.derniereMiseAJour));
});

// Cantieri filtrati per periodo
const chantiersFiltered = computed(() => {
  return chantiersAvecMetrages.value.filter(chantier => {
    if (selectedYear.value && chantier.anneeFacturation !== selectedYear.value) return false;
    if (selectedMonth.value && chantier.moisFacturation !== selectedMonth.value) return false;
    return true;
  });
});

// Totali filtrati
const totalHeuresPrevuesFiltered = computed(() => {
  return chantiersFiltered.value.reduce((sum, c) => sum + c.heuresPrevues, 0);
});

const totalHeuresImployeesFiltered = computed(() => {
  return chantiersFiltered.value.reduce((sum, c) => sum + c.heuresImployees, 0);
});

const totalHeuresGagneesFiltered = computed(() => {
  return chantiersFiltered.value.reduce((sum, c) => sum + c.heuresGagnees, 0);
});

const totalPrimeFiltered = computed(() => {
  return chantiersFiltered.value.reduce((sum, c) => sum + c.prime, 0);
});

const totalHeuresRegiesFiltered = computed(() => {
  return chantiersFiltered.value.reduce((sum, c) => sum + c.heuresRegies, 0);
});

const totalPrimeEfficaciteFiltered = computed(() => {
  return chantiersFiltered.value.reduce((sum, c) => sum + c.primeEfficacite, 0);
});

const totalPrimeRegiesFiltered = computed(() => {
  return chantiersFiltered.value.reduce((sum, c) => sum + c.primeRegies, 0);
});

const totalHeuresPrevues = computed(() => {
  return chantiersAvecMetrages.value.reduce((sum, c) => sum + c.heuresPrevues, 0);
});

const totalHeuresImployees = computed(() => {
  return chantiersAvecMetrages.value.reduce((sum, c) => sum + c.heuresImployees, 0);
});

const totalHeuresGagnees = computed(() => {
  return chantiersAvecMetrages.value.reduce((sum, c) => sum + c.heuresGagnees, 0);
});

const totalPrime = computed(() => {
  return chantiersAvecMetrages.value.reduce((sum, c) => sum + c.prime, 0);
});

onMounted(async () => {
  await Promise.all([
    fetchChantiers(),
    fetchDevis(),
    fetchFactures(),
    fetchMetrages(),
    fetchHeuresPropres(),
    fetchHeuresInterim(),
    fetchHeuresOuvriers(),
    fetchCollaborateurs(),
    fetchInterimaires()
  ]);
});
</script>

<style scoped>
.card {
  margin-bottom: 1rem;
}
</style>
