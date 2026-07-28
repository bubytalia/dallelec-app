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
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prime in chef.primes" :key="prime.chantierId" :class="prime.payee ? 'table-success' : ''">
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
                  <small v-if="!prime.enAttivo && prime.heuresRegies > 0" class="d-block text-danger">
                    (non éligible)
                  </small>
                </td>
                <td>
                  <span :class="prime.primeTotale > 0 ? 'text-success fw-bold' : 'text-muted'">
                    {{ formatCurrency(prime.primeTotale) }}
                  </span>
                </td>
                <td>
                  <span v-if="prime.payee" class="badge bg-success">
                    ✅ Payé {{ getMonthLabel(prime.moisPaiement) }}
                  </span>
                  <span v-else-if="prime.hasAcconto" class="badge bg-info text-dark">
                    💰 Acompte {{ formatCurrency(prime.montantAcconto) }} - Solde {{ formatCurrency(prime.soldeRestant) }}
                  </span>
                  <span v-else-if="prime.primeTotale > 0" class="badge bg-warning text-dark">
                    ⏳ À payer
                  </span>
                  <span v-else class="badge bg-secondary">-</span>
                </td>
                <td>
                  <button @click="voirDetail(prime)" class="btn btn-sm btn-outline-info me-1">👁</button>
                  <button v-if="prime.primeTotale > 0 && !prime.payee" @click="ouvrirPaiement(prime)" class="btn btn-sm btn-outline-success" title="Payer / Acompte">
                    💰
                  </button>
                  <button v-if="prime.payee || prime.hasAcconto" @click="annulerPaiement(prime)" class="btn btn-sm btn-outline-danger" title="Annuler paiement">
                    ↩
                  </button>
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
                <p><strong>Facturé TTC total:</strong> {{ formatCurrency(detailPrime.importoFatturato) }}</p>
                <p><strong>Montant régies (déduit):</strong> -{{ formatCurrency(detailPrime.montantRegies) }}</p>
                <p><strong>Facturé hors régies:</strong> {{ formatCurrency(detailPrime.fatturatHorsRegies) }}</p>
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
                  <p v-if="detailPrime.heuresRegies > 0 && detailPrime.enAttivo">
                    ✅ <strong>{{ detailPrime.heuresRegies }}h régies</strong> → Prime régies: {{ formatCurrency(detailPrime.primeRegies) }}
                  </p>
                  <p v-else-if="detailPrime.heuresRegies > 0 && !detailPrime.enAttivo">
                    ❌ <strong>{{ detailPrime.heuresRegies }}h régies</strong> → Non éligible (chantier pas en attivo)
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
    <!-- Modal Paiement -->
    <div v-if="showPaiementModal" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5>Enregistrer Paiement Prime</h5>
            <button @click="showPaiementModal = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <p><strong>Prime totale:</strong> {{ formatCurrency(paiementForm.montant) }}</p>
            <div v-if="paiementForm.hasAcconto" class="alert alert-info py-2">
              Acompte déjà payé: <strong>{{ formatCurrency(paiementForm.montantAcconto) }}</strong> — Solde restant: <strong>{{ formatCurrency(paiementForm.soldeRestant) }}</strong>
            </div>
            <div class="mb-3">
              <label class="form-label">Type de paiement</label>
              <select v-model="paiementForm.typePaiement" class="form-select">
                <option value="acconto">Acompte (montant partiel)</option>
                <option value="solde">Solde (paiement final)</option>
              </select>
            </div>
            <div v-if="paiementForm.typePaiement === 'acconto'" class="mb-3">
              <label class="form-label">Montant de l'acompte (CHF)</label>
              <input type="number" v-model="paiementForm.montantAccontoInput" class="form-control" step="0.01" min="0" :max="paiementForm.montant" />
            </div>
            <div v-else class="mb-3">
              <label class="form-label">Montant payé (CHF)</label>
              <input type="number" v-model="paiementForm.montantSolde" class="form-control" step="0.01" />
            </div>
            <div class="mb-3">
              <label class="form-label">Mois de la fiche de paie</label>
              <input type="month" v-model="paiementForm.moisPaiement" class="form-control" />
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showPaiementModal = false" class="btn btn-secondary">Annuler</button>
            <button @click="enregistrerPaiement" class="btn btn-success" :disabled="!paiementForm.moisPaiement">
              ✅ Confirmer paiement
            </button>
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
import { getHeures } from '@/composables/useHeures.js';

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
const primesPaiements = ref([]);

// Modal
const showDetail = ref(false);
const detailPrime = ref({});
const showPaiementModal = ref(false);
const paiementForm = ref({ chantierId: null, capocantiere: '', montant: 0, moisPaiement: '', typePaiement: 'solde', montantAcconto: 0 });

// Chargement données
const loadData = async () => {
  try {
    const [ch, fa, me, hp, hi, ho, cdc] = await Promise.all([
      supabase.from('chantiers').select('*, chef_secondaire').neq('type', 'interne'),
      supabase.from('factures').select('*'),
      supabase.from('metrages').select('*'),
      supabase.from('heures_chef_propres').select('*').order('date', { ascending: false }).limit(5000),
      supabase.from('heures_chef_interim').select('*').order('date', { ascending: false }).limit(5000),
      supabase.from('heures_ouvriers').select('*').order('date', { ascending: false }).limit(5000),
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

    // Paiements primes
    const { data: pp } = await supabase.from('primes_paiements').select('*');
    primesPaiements.value = pp || [];
  } catch (error) {
    console.error('Erreur chargement données primes:', error);
  }
};

// Calcul montant régies facturées pour un chantier
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

// Calcul primes par chantier - génère une entrée par chef (capocantiere + chef_secondaire si présent)
const premesCalculated = computed(() => {
  const result = [];
  chantiers.value.forEach(chantier => {
    const facturesChantier = factures.value.filter(f => String(f.chantier_id) === String(chantier.id) && !f.is_acconto);
    if (facturesChantier.length === 0) return null;

    // Fatturato: usa montant_ht_brut (imponibile reale prima della detrazione) se disponibile
    const importoTotaleFatturato = facturesChantier.reduce((sum, f) => sum + (parseFloat(f.montant_ht_brut) || parseFloat(f.montant_ttc) || 0), 0);

    // Régies: heures et montant facturé
    const regiesData = getRegiesData(chantier.id);
    const montantRegiesTTC = regiesData.montant * 1.081; // TTC

    // Fatturato HORS régies (base pour le calcul du budget)
    const fatturatHorsRegies = importoTotaleFatturato - montantRegiesTTC;

    const percentualeImpresa = chantier.percentuale_impresa || 30;
    const budgetOreDisponibile = fatturatHorsRegies * (1 - percentualeImpresa / 100);

    // Heures par type (TOUTES les heures travaillées sur le chantier)
    const capocantiere = chantier.capocantiere || '';
    const hpChantier = heuresPropres.value.filter(h => String(h.chantier_id) === String(chantier.id));
    const heuresChef = hpChantier.reduce((sum, h) => sum + getHeures(h), 0);

    const heuresInterim = heuresInterimData.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + getHeures(h), 0);

    const heuresOuvriers = heuresOuvriersData.value
      .filter(h => String(h.chantier_id) === String(chantier.id))
      .reduce((sum, h) => sum + (h.heures || 0), 0);

    const heuresRegies = regiesData.heures;
    // Heures réelles HORS régies (les régies ne pèsent pas sur le budget)
    const heuresTotales = heuresChef + heuresInterim + heuresOuvriers;
    const heuresReelles = heuresTotales - heuresRegies;

    // Coût horaire moyen pondéré
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
    const costoOrarioMedio = heuresReelles > 0 ? coutTotal / heuresTotales : tarifChef;

    // Heures prévues et gagnées
    const heuresPrevues = costoOrarioMedio > 0 ? budgetOreDisponibile / costoOrarioMedio : 0;
    const heuresGagnees = heuresPrevues - heuresReelles;

    // Primes: régies payées SEULEMENT si cantiere en attivo
    const primeEfficacite = heuresGagnees > 0 ? heuresGagnees * 26 : 0;
    const enAttivo = heuresGagnees > 0;
    const primeRegies = enAttivo ? heuresRegies * 5 : 0;
    const primeTotale = primeEfficacite + primeRegies;

    // Période (basée sur la première facture)
    const primaFactura = [...facturesChantier].sort((a, b) => new Date(a.date_facture) - new Date(b.date_facture))[0];
    const dateFacturation = primaFactura?.date_facture ? new Date(primaFactura.date_facture) : new Date();

    // Chefs impliqués: capocantiere + chef_secondaire si présent
    const chefsList = [capocantiere];
    if (chantier.chef_secondaire) chefsList.push(chantier.chef_secondaire);
    const diviseur = chefsList.length; // 1 ou 2

    chefsList.forEach(chefEmail => {
      // Statut paiement pour ce chef
      const paiement = primesPaiements.value.find(pp => String(pp.chantier_id) === String(chantier.id) && pp.capocantiere === chefEmail);
      const montantAcconto = parseFloat(paiement?.montant_acconto) || 0;
      const primeTotaleChef = Math.round((primeTotale / diviseur) * 100) / 100;
      const soldeRestant = Math.round((primeTotaleChef - montantAcconto) * 100) / 100;

      result.push({
        chantierId: chantier.id,
        chantierNom: chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ${chantier.nom}` : chantier.nom,
        clientNom: chantier.client || 'N/A',
        capocantiere: chefEmail,
        moisFacturation: dateFacturation.getMonth() + 1,
        anneeFacturation: dateFacturation.getFullYear(),
        budgetDisponible: Math.round(budgetOreDisponibile * 100) / 100,
        heuresPrevues: Math.round(heuresPrevues * 10) / 10,
        heuresReelles: Math.round(heuresReelles * 10) / 10,
        heuresGagnees: Math.round(heuresGagnees * 10) / 10,
        heuresRegies: Math.round(heuresRegies * 10) / 10,
        primeEfficacite: Math.round((primeEfficacite / diviseur) * 100) / 100,
        primeRegies: Math.round((primeRegies / diviseur) * 100) / 100,
        primeTotale: primeTotaleChef,
        enAttivo,
        // Paiement
        payee: !!paiement && paiement.type_paiement === 'solde',
        moisPaiement: paiement?.mois_paiement || '',
        montantAcconto,
        soldeRestant,
        hasAcconto: montantAcconto > 0,
        // Détails modal
        importoFatturato: importoTotaleFatturato,
        montantRegies: regiesData.montant,
        fatturatHorsRegies: Math.round(fatturatHorsRegies * 100) / 100,
        percentualeImpresa,
        costoOrarioMedio: Math.round(costoOrarioMedio * 100) / 100,
        heuresChef: Math.round(heuresChef * 10) / 10,
        heuresOuvriers: Math.round(heuresOuvriers * 10) / 10,
        heuresInterim: Math.round(heuresInterim * 10) / 10
      });
    });
  });
  return result;
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

const ouvrirPaiement = (prime) => {
  paiementForm.value = {
    chantierId: prime.chantierId,
    capocantiere: prime.capocantiere,
    montant: prime.primeTotale,
    moisPaiement: '',
    typePaiement: prime.hasAcconto ? 'solde' : 'acconto',
    montantAccontoInput: 0,
    montantSolde: prime.hasAcconto ? prime.soldeRestant : prime.primeTotale,
    montantAcconto: prime.montantAcconto,
    soldeRestant: prime.soldeRestant,
    hasAcconto: prime.hasAcconto
  };
  showPaiementModal.value = true;
};

const enregistrerPaiement = async () => {
  const { chantierId, capocantiere, montant, moisPaiement, typePaiement, montantAccontoInput, montantSolde, montantAcconto } = paiementForm.value;
  if (!moisPaiement) return;

  const primeDetail = premesCalculated.value.find(p => p.chantierId === chantierId && p.capocantiere === capocantiere);
  
  const montantPagato = typePaiement === 'acconto' ? parseFloat(montantAccontoInput) || 0 : parseFloat(montantSolde) || montant;
  const nuovoAcconto = typePaiement === 'acconto' ? (montantAcconto + montantPagato) : 0;

  await supabase.from('primes_paiements').upsert({
    chantier_id: chantierId,
    capocantiere,
    montant: typePaiement === 'solde' ? montantPagato : montant,
    mois_paiement: moisPaiement,
    type_paiement: typePaiement,
    montant_acconto: nuovoAcconto,
    prime_efficacite: primeDetail?.primeEfficacite || 0,
    prime_regies: primeDetail?.primeRegies || 0,
    chantier_nom: primeDetail?.chantierNom || ''
  }, { onConflict: 'chantier_id,capocantiere' });

  const { data } = await supabase.from('primes_paiements').select('*');
  primesPaiements.value = data || [];
  showPaiementModal.value = false;
};

const annulerPaiement = async (prime) => {
  await supabase.from('primes_paiements')
    .delete()
    .eq('chantier_id', prime.chantierId)
    .eq('capocantiere', prime.capocantiere);

  const { data } = await supabase.from('primes_paiements').select('*');
  primesPaiements.value = data || [];
};

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
.modal { z-index: 1050; }
</style>
