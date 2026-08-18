<template>
  <div class="container py-4">
    <RetourButton to="/chef" />
    
    <h2 class="text-center mb-4">Mes Primes</h2>

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

    <!-- Détail par chantier -->
    <div v-for="chantier in chantiersFiltered" :key="chantier.chantierId" class="card mb-3">
      <div class="card-header"
           :class="chantier.primeTotale > 0 ? 'bg-light' : ''">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>{{ chantier.chantierNom }}</strong>
            <small class="text-muted ms-2">{{ chantier.clientNom }}</small>
            <span v-if="chantier.isChefSecondaire" class="badge bg-info text-dark ms-2" style="font-size:10px">50% - Chef secondaire</span>
            <span v-else-if="chantier.diviseur === 2" class="badge bg-secondary ms-2" style="font-size:10px">50% - Chef principal</span>
          </div>
          <span class="badge" :class="chantier.primeTotale > 0 ? 'bg-success' : 'bg-secondary'">
            {{ formatCurrency(chantier.primeTotale) }}
          </span>
        </div>
        <div v-if="chantier.metresCDC > 0 || chantier.heuresPrevuesDevis > 0" class="d-flex gap-3 mt-2">
          <template v-if="chantier.typePose === 'rail_energie' || chantier.typePose === 'canaux_au_sol'">
            <small><strong>⏱ Heures MO prévues:</strong> {{ chantier.heuresPrevuesDevis.toFixed(1) }} h</small>
          </template>
          <template v-else>
            <small><strong>📐 CDC (avec suppl.):</strong> {{ chantier.metresCDC.toFixed(1) }} m</small>
            <small><strong>⏱ MO prévue:</strong> {{ chantier.heuresPrevuesDevis.toFixed(1) }} h</small>
            <small><strong>📊 m/h:</strong> {{ chantier.metresParHeure.toFixed(2) }}</small>
          </template>
        </div>
      </div>
      <div class="card-body" v-if="!chantier.enCours">
        <div class="row">
          <!-- Colonne gauche: données -->
          <div class="col-md-6">
            <table class="table table-sm mb-0">
              <tr>
                <td>Heures prévues <small class="text-muted">(base normale)</small></td>
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
import { getHeures } from '@/composables/useHeures.js';

const selectedMonth = ref('');
const selectedYear = ref('');
const currentUserEmail = ref('');
const primesPaiements = ref([]);

// Données
const chantiers = ref([]);
const factures = ref([]);
const metrages = ref([]);
const devisData = ref([]);
const resocontiPercentuali = ref([]);
const heuresPropres = ref([]);
const heuresInterimData = ref([]);
const heuresOuvriersData = ref([]);

const loadData = async () => {
  // Get current user - usa localStorage come fonte primaria (più affidabile)
  const { data: { user } } = await supabase.auth.getUser();
  currentUserEmail.value = user?.email || localStorage.getItem('userEmail') || '';

  const [ch, fa, me, hp, hi, ho, dv] = await Promise.all([
    supabase.from('chantiers').select('*, chef_secondaire').neq('type', 'interne'),
    supabase.from('factures').select('*'),
    supabase.from('metrages').select('*'),
    supabase.from('heures_chef_propres').select('*').order('date', { ascending: false }).limit(10000),
    supabase.from('heures_chef_interim').select('*').order('date', { ascending: false }).limit(10000),
    supabase.from('heures_ouvriers').select('*').order('date', { ascending: false }).limit(10000),
    supabase.from('devis').select('id,total,produits,discount,type_pose')
  ]);

  chantiers.value = ch.data || [];
  factures.value = fa.data || [];
  metrages.value = me.data || [];
  devisData.value = dv.data || [];
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

// Calcul CDC et heures prévues depuis le devis
const getDevisIndicators = (chantier) => {
  const devis = devisData.value.find(d => d.id == chantier.devis_id);
  if (!devis || !devis.produits) return { metresCDC: 0, heuresPrevuesDevis: 0, metresParHeure: 0, typePose: '' };

  const typePose = devis.type_pose || '';

  // Metri: pour rail d'énergie, pas de suppléments (utilise ml), pour CDC utilise totalML
  let metres = 0;
  if (typePose === 'rail_energie' || typePose === 'canaux_au_sol') {
    metres = devis.produits.reduce((sum, p) => sum + (Number(p.totalML) || Number(p.ml) || 0), 0);
  } else {
    metres = devis.produits
      .filter(p => {
        const nom = (p.nom || '').toLowerCase();
        return nom.includes('chemin de c') || nom.includes('echelle') || nom.includes('échelle') || nom.includes('canale a grille') || nom.includes('canal g');
      })
      .reduce((sum, p) => sum + (Number(p.totalML) || 0), 0);
  }

  // Heures MO prévues
  const totalDevis = Number(devis.total) || 0;
  const percentualeImpresa = chantier.percentuale_impresa || 30;
  const budgetMO = totalDevis * (1 - percentualeImpresa / 100);
  const costoOrarioMedio = 45;
  const heuresPrevuesDevis = costoOrarioMedio > 0 ? budgetMO / costoOrarioMedio : 0;

  const metresParHeure = heuresPrevuesDevis > 0 ? metres / heuresPrevuesDevis : 0;

  return { metresCDC: metres, heuresPrevuesDevis, metresParHeure, typePose };
};

// Calcul primes pour les chantiers du chef connecté
const mesChantiersPrimes = computed(() => {
  const mesChantiers = chantiers.value.filter(c =>
    c.capocantiere === currentUserEmail.value || c.chef_secondaire === currentUserEmail.value
  );

  return mesChantiers.map(chantier => {
    const facturesChantier = factures.value.filter(f => String(f.chantier_id) === String(chantier.id) && !f.is_acconto);
    
    // Indicateurs devis
    const indicators = getDevisIndicators(chantier);

    // Cantiere sans factures: afficher seulement les indicateurs
    if (facturesChantier.length === 0) {
      if (indicators.metresCDC === 0 && indicators.heuresPrevuesDevis === 0) return null;
      return {
        chantierId: chantier.id,
        chantierNom: chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ${chantier.nom}` : chantier.nom,
        clientNom: chantier.client || 'N/A',
        moisFacturation: new Date().getMonth() + 1,
        anneeFacturation: new Date().getFullYear(),
        enCours: true,
        heuresPrevues: 0, heuresReelles: 0, heuresGagnees: 0, heuresRegies: 0,
        primeEfficacite: 0, primeRegies: 0, primeTotale: 0,
        enAttivo: false, payee: false, moisPaiement: '',
        metresCDC: indicators.metresCDC,
        heuresPrevuesDevis: indicators.heuresPrevuesDevis,
        metresParHeure: indicators.metresParHeure,
        typePose: indicators.typePose
      };
    }

    const importoTotaleFatturato = facturesChantier.reduce((sum, f) => sum + (parseFloat(f.montant_ht_brut) || parseFloat(f.montant_ttc) || 0), 0);

    // Régies: heures et montant facturé
    const regiesData = getRegiesData(chantier.id);
    const montantRegiesTTC = regiesData.montant * 1.081;

    // Fatturato HORS régies
    const fatturatHorsRegies = importoTotaleFatturato - montantRegiesTTC;

    const percentualeImpresa = chantier.percentuale_impresa || 30;
    const budgetOreDisponibile = fatturatHorsRegies * (1 - percentualeImpresa / 100);

    // Heures: TUTTE le ore del cantiere (tutti i chef + ouvriers)
    const hpChantier = heuresPropres.value.filter(h => String(h.chantier_id) === String(chantier.id));
    const heuresChef = hpChantier.reduce((sum, h) => sum + getHeures(h), 0);

    const heuresInterim = heuresInterimData.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + getHeures(h), 0);

    const heuresOuvriers = heuresOuvriersData.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.heures || 0), 0);

    const heuresRegies = regiesData.heures;
    const heuresTotales = heuresChef + heuresInterim + heuresOuvriers;
    const heuresReelles = heuresTotales - heuresRegies;

    const tarifChef = 45, tarifOuvrier = 41, tarifInterim = 47.5;
    
    const coutChef = hpChantier
      .reduce((sum, h) => sum + getHeures(h) * tarifChef * (1 + (h.supplement_pourcentage || 0) / 100), 0);
    
    const coutInterim = heuresInterimData.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + getHeures(h) * tarifInterim * (1 + (h.supplement_pourcentage || 0) / 100), 0);
    
    const coutOuvriers = heuresOuvriersData.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.heures || 0) * tarifOuvrier * (1 + (h.supplement_pourcentage || 0) / 100), 0);
    
    const coutTotal = coutChef + coutOuvriers + coutInterim;
    const costoOrarioMedio = heuresTotales > 0 ? coutTotal / heuresTotales : tarifChef;

    const heuresPrevues = costoOrarioMedio > 0 ? budgetOreDisponibile / costoOrarioMedio : 0;
    const heuresGagnees = heuresPrevues - heuresReelles;

    const primeEfficaciteTotal = heuresGagnees > 0 ? heuresGagnees * 26 : 0;
    const enAttivo = heuresGagnees > 0;
    const primeRegiesTotal = enAttivo ? heuresRegies * 5 : 0;
    const primeTotaleTotal = primeEfficaciteTotal + primeRegiesTotal;

    // Diviseur: 2 si chef secondaire, 1 sinon
    const diviseur = chantier.chef_secondaire ? 2 : 1;
    const primeEfficacite = Math.round((primeEfficaciteTotal / diviseur) * 100) / 100;
    const primeRegies = Math.round((primeRegiesTotal / diviseur) * 100) / 100;
    const primeTotale = Math.round((primeTotaleTotal / diviseur) * 100) / 100;

    // Période
    const primaFactura = [...facturesChantier].sort((a, b) => new Date(a.date_facture) - new Date(b.date_facture))[0];
    const dateFacturation = primaFactura?.date_facture ? new Date(primaFactura.date_facture) : new Date();

    // Paiement (cherche pour l'email du chef connecté)
    const paiement = primesPaiements.value.find(pp =>
      String(pp.chantier_id) === String(chantier.id) && pp.capocantiere === currentUserEmail.value
    );

    // Badge chef secondaire
    const isChefSecondaire = chantier.chef_secondaire === currentUserEmail.value;

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
      primeEfficacite,
      primeRegies,
      primeTotale,
      enAttivo,
      payee: !!paiement,
      moisPaiement: paiement?.mois_paiement || '',
      isChefSecondaire,
      diviseur,
      metresCDC: indicators.metresCDC,
      heuresPrevuesDevis: indicators.heuresPrevuesDevis,
      metresParHeure: indicators.metresParHeure,
      typePose: indicators.typePose
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
