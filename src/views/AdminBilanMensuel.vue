<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    <h2 class="text-center mb-4">📋 Bilan Mensuel Personnel</h2>

    <div class="row mb-4">
      <div class="col-md-4">
        <label class="form-label fw-bold">Mois:</label>
        <input v-model="selectedMonth" type="month" class="form-control" @change="calculateAndLoad" />
      </div>
      <div class="col-md-8 d-flex align-items-end gap-2">
        <div class="dropdown">
          <button class="btn btn-danger dropdown-toggle" type="button" data-bs-toggle="dropdown">📄 PDF</button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" @click.prevent="generatePDFGlobal">📋 Récapitulatif global</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" @click.prevent="showPDFModal = true">👤 Fiche individuelle...</a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Tableau récapitulatif -->
    <div class="card">
      <div class="card-header"><h5 class="mb-0">Récapitulatif - {{ formatMonth(selectedMonth) }}</h5></div>
      <div class="card-body table-responsive">
        <div v-if="bilans.length === 0" class="text-center text-muted py-4">Aucune donnée. Cliquez "Calculer".</div>
        <table v-else class="table table-sm">
          <thead>
            <tr>
              <th>Employé</th>
              <th class="text-end">H. prévues</th>
              <th class="text-end">H. travaillées</th>
              <th class="text-end">J. fériés</th>
              <th class="text-end">Abs. payées</th>
              <th class="text-end">Abs. non payées</th>
              <th class="text-end">Solde préc.</th>
              <th class="text-end fw-bold">Delta</th>
              <th class="text-end fw-bold">Solde heures</th>
              <th class="text-end">Vac. solde</th>
              <th class="text-end">Vac. acquises</th>
              <th class="text-end">Vac. prises</th>
              <th class="text-end fw-bold">Vac. nouveau</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bilans" :key="b.employee_email">
              <td><strong>{{ getEmployeName(b.employee_email) }}</strong></td>
              <td class="text-end">{{ b.heures_prevues.toFixed(2) }}</td>
              <td class="text-end">{{ b.heures_travaillees.toFixed(2) }}</td>
              <td class="text-end">{{ (b.heures_jours_feries || 0).toFixed(2) }}</td>
              <td class="text-end">{{ ((b.heures_absences_payees || 0) - (b.heures_jours_feries || 0)).toFixed(2) }}</td>
              <td class="text-end text-muted">{{ b.heures_absences_non_payees.toFixed(2) }}</td>
              <td class="text-end">{{ b.solde_precedent.toFixed(2) }}</td>
              <td class="text-end fw-bold" :class="b.delta_mois >= 0 ? 'text-success' : 'text-danger'">{{ b.delta_mois >= 0 ? '+' : '' }}{{ b.delta_mois.toFixed(2) }}</td>
              <td class="text-end fw-bold" :class="b.solde_final >= 0 ? 'text-success' : 'text-danger'">{{ b.solde_final.toFixed(2) }}</td>
              <td class="text-end">{{ (b.vac_solde_prec || 0).toFixed(2) }}</td>
              <td class="text-end text-success">+{{ (b.vac_acquises || 0).toFixed(2) }}</td>
              <td class="text-end text-danger">-{{ (b.vac_prises || 0).toFixed(2) }}</td>
              <td class="text-end fw-bold">{{ (b.vac_nouveau_solde || 0).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal PDF individuel -->
    <div v-if="showPDFModal" class="modal-overlay" @click.self="showPDFModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h5>👤 Fiche mensuelle individuelle</h5>
          <button @click="showPDFModal = false" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Employé:</label>
            <select v-model="pdfEmploye" class="form-control">
              <option value="">Sélectionner</option>
              <option v-for="emp in employes" :key="emp.email" :value="emp.email">{{ emp.nom }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showPDFModal = false" class="btn btn-secondary">Annuler</button>
          <button @click="generatePDFIndividuel" class="btn btn-danger" :disabled="!pdfEmploye">📄 Générer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { supabase } from '@/supabase';
import RetourButton from '@/components/RetourButton.vue';
import { downloadPDF, generateFicheIndividuellePDF, generateGlobalPDF } from '@/utils/pdfDownload.js';

const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const employes = ref([]);
const bilans = ref([]);
const primesMois = ref([]);
const showPDFModal = ref(false);
const pdfEmploye = ref('');

const loadEmployes = async () => {
  const { data: collaborateurs } = await supabase.from('collaborateurs').select('*');
  const { data: chefs } = await supabase.from('chefdechantiers').select('*');
  const { data: configs } = await supabase.from('solde_vacances_config').select('*');

  employes.value = [
    ...(chefs || []).filter(c => !c.excludeFromReport && c.actif !== false).map(c => ({ email: c.email, nom: `${c.nom} ${c.prenom}`, type: 'chef' })),
    ...(collaborateurs || []).filter(c => !c.excludeFromReport && c.actif !== false).map(c => ({ email: c.email, nom: `${c.nom} ${c.prenom}`, type: 'ouvrier' }))
  ].map(emp => {
    const cfg = (configs || []).find(c => c.employee_email === emp.email);
    const defaultPlanning = { 1: 8.75, 2: 8.75, 3: 8.75, 4: 8.75, 5: 5 };
    return { ...emp, heures_droit_mois: cfg?.heures_droit_mois || 0, solde_initial_vac: cfg?.solde_initial || 0, planning: cfg?.planning || defaultPlanning };
  });
};

const loadData = async () => {
  const { data } = await supabase.from('solde_heures').select('*').eq('mois', selectedMonth.value);
  const { data: vacData } = await supabase.from('solde_vacances').select('*').eq('mois', selectedMonth.value);
  const { data: primesData } = await supabase.from('primes_paiements').select('*').eq('mois_paiement', selectedMonth.value);
  primesMois.value = primesData || [];
  
  bilans.value = (data || []).map(b => {
    const vac = (vacData || []).find(v => v.employee_email === b.employee_email);
    return { ...b, vac_solde_prec: vac?.solde_precedent || 0, vac_acquises: vac?.heures_droit_mois || 0, vac_prises: vac?.heures_prises || 0, vac_nouveau_solde: vac?.solde_final || 0 };
  });
};

const getHeuresPrevuesMois = (mois, planning) => {
  const [year, month] = mois.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let total = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow >= 1 && dow <= 5) {
      total += Number(planning[dow] || 0);
    }
  }
  return total;
};

const calculateSingleMonth = async (mois) => {
  const [year, month] = mois.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const prevDate = new Date(year, month - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const { data: prevSoldes } = await supabase.from('solde_heures').select('*').eq('mois', prevMonth);
  const { data: heuresChef } = await supabase.from('heures_chef_propres').select('*').gte('date', startDate).lte('date', endDate);
  const { data: heuresInterim } = await supabase.from('heures_chef_interim').select('*').gte('date', startDate).lte('date', endDate);
  const { data: heuresOuvriers } = await supabase.from('heures_ouvriers').select('*').gte('date', startDate).lte('date', endDate);
  const { data: absences } = await supabase.from('absences').select('*').eq('status', 'approved').lte('start_date', endDate).gte('end_date', startDate);
  const { data: prevVac } = await supabase.from('solde_vacances').select('*').eq('mois', prevMonth);

  for (const emp of employes.value) {
    const heuresPrevues = getHeuresPrevuesMois(mois, emp.planning);
    const oreChef = (heuresChef || []).filter(h => h.chef_id === emp.email).reduce((s, h) => s + (h.total_heures || h.heures_normales || 0), 0);
    const oreInterim = (heuresInterim || []).filter(h => h.chef_id === emp.email).reduce((s, h) => s + (h.total_heures || 0), 0);
    const oreOuvrier = (heuresOuvriers || []).filter(h => h.ouvrier_id === emp.email).reduce((s, h) => s + (h.heures || 0), 0);
    const heuresTravaillees = oreChef + oreInterim + oreOuvrier;

    // Compter les jours effectivement travaillés
    const joursSet = new Set();
    (heuresChef || []).filter(h => h.chef_id === emp.email && (h.total_heures || h.heures_normales || 0) > 0).forEach(h => joursSet.add(h.date));
    (heuresInterim || []).filter(h => h.chef_id === emp.email && (h.total_heures || 0) > 0).forEach(h => joursSet.add(h.date));
    (heuresOuvriers || []).filter(h => h.ouvrier_id === emp.email && (h.heures || 0) > 0).forEach(h => joursSet.add(h.date));
    const joursTravailles = joursSet.size;

    let absPayees = 0, absNonPayees = 0, vacPrises = 0, joursFeries = 0;
    const empAbs = (absences || []).filter(a => a.user_id === emp.email);
    const joursDejaComptes = new Set(); // anti-doublons
    const today = new Date().toISOString().split('T')[0];
    for (const abs of empAbs) {
      const start = new Date(Math.max(new Date(abs.start_date), new Date(startDate)));
      const end = new Date(Math.min(new Date(abs.end_date), new Date(endDate)));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay();
        if (dow === 0 || dow === 6) continue; // ignorer weekends
        const dateKey = d.toISOString().split('T')[0];
        if (dateKey > today) continue; // ignorer dates futures
        if (joursDejaComptes.has(dateKey)) continue; // anti-doublon
        const hJour = Number(emp.planning[dow] || 0);
        if (hJour === 0) continue; // jour non travaillé selon planning - TOUJOURS ignorer
        joursDejaComptes.add(dateKey);
        if (abs.type === 'vacances_sans_solde') { absNonPayees += hJour; }
        else if (abs.type === 'jour_ferie') { joursFeries += hJour; absPayees += hJour; }
        else { absPayees += hJour; if (abs.type === 'vacances') vacPrises += hJour; }
      }
    }

    const prevSolde = (prevSoldes || []).find(s => s.employee_email === emp.email);
    const soldePrecedent = prevSolde ? prevSolde.solde_final : 0;
    const delta = (heuresTravaillees + absPayees) - (heuresPrevues - absNonPayees);
    const soldeFinal = soldePrecedent + delta;

    const prevVacSolde = (prevVac || []).find(v => v.employee_email === emp.email);
    const vacSoldePrecedent = prevVacSolde ? prevVacSolde.solde_final : emp.solde_initial_vac;
    const vacAcquises = emp.heures_droit_mois || 0;
    const vacNouveauSolde = vacSoldePrecedent + vacAcquises - vacPrises;

    // Upsert solde_heures
    const { data: existing } = await supabase.from('solde_heures').select('id').eq('employee_email', emp.email).eq('mois', mois).single();
    const record = { employee_email: emp.email, mois, heures_prevues: heuresPrevues, heures_travaillees: heuresTravaillees, jours_travailles: joursTravailles, heures_absences_payees: absPayees, heures_absences_non_payees: absNonPayees, heures_jours_feries: joursFeries, solde_precedent: soldePrecedent, delta_mois: delta, solde_final: soldeFinal, updated_at: new Date().toISOString() };
    if (existing) { await supabase.from('solde_heures').update(record).eq('id', existing.id); }
    else { await supabase.from('solde_heures').insert(record); }

    // Upsert solde_vacances
    const { data: existingVac } = await supabase.from('solde_vacances').select('id').eq('employee_email', emp.email).eq('mois', mois).single();
    const vacRecord = { employee_email: emp.email, user_id: emp.email, mois, solde_precedent: vacSoldePrecedent, heures_droit_mois: vacAcquises, heures_prises: vacPrises, solde_final: vacNouveauSolde, updated_at: new Date().toISOString() };
    if (existingVac) { await supabase.from('solde_vacances').update(vacRecord).eq('id', existingVac.id); }
    else { await supabase.from('solde_vacances').insert(vacRecord); }
  }
};

const calculateAndLoad = async () => {
  const [targetYear, targetMonth] = selectedMonth.value.split('-').map(Number);
  
  // Calcule depuis janvier jusqu'au mois sélectionné
  for (let m = 1; m <= targetMonth; m++) {
    const mois = `${targetYear}-${String(m).padStart(2, '0')}`;
    await calculateSingleMonth(mois);
    await nextTick(); // Libérer le thread pour garder l'UI réactive
  }
  
  await loadData();
};

const getPrimesForEmployee = (email) => primesMois.value.filter(p => p.capocantiere === email);
const getTotalBonusMois = (email) => getPrimesForEmployee(email).reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0);

const getEmployeName = (email) => {
  const emp = employes.value.find(e => e.email === email);
  return emp ? emp.nom : email;
};

const formatMonth = (m) => {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
};

const generatePDFGlobal = async () => {
  generateGlobalPDF({
    bilans: bilans.value,
    monthLabel: formatMonth(selectedMonth.value),
    selectedMonth: selectedMonth.value,
    getEmployeName,
    getTotalBonusMois
  });
};

const generatePDFIndividuel = async () => {
  const email = pdfEmploye.value;
  const nom = getEmployeName(email);
  const bilan = bilans.value.find(b => b.employee_email === email);
  if (!bilan) { alert('Pas de données pour cet employé'); return; }

  const [year, month] = selectedMonth.value.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const { data: heuresChef } = await supabase.from('heures_chef_propres').select('*').eq('chef_id', email).gte('date', startDate).lte('date', endDate);
  const { data: heuresInterim } = await supabase.from('heures_chef_interim').select('*').eq('chef_id', email).gte('date', startDate).lte('date', endDate);
  const { data: heuresOuvriers } = await supabase.from('heures_ouvriers').select('*').eq('ouvrier_id', email).gte('date', startDate).lte('date', endDate);
  const { data: absences } = await supabase.from('absences').select('*').eq('user_id', email).eq('status', 'approved').lte('start_date', endDate).gte('end_date', startDate);
  const { data: chantiersList } = await supabase.from('chantiers').select('id, nom');
  const getChantierNom = (id) => { const c = (chantiersList||[]).find(ch => ch.id == id); return c ? c.nom : ''; };

  const joursNoms = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const empData = employes.value.find(e => e.email === email);
  const empPlanning = empData?.planning || { 1: 8.75, 2: 8.75, 3: 8.75, 4: 8.75, 5: 5 };

  let calcHeuresTravaillees = 0, calcAbsPayees = 0, calcAbsNonPayees = 0, calcJoursFeries = 0, calcVacPrises = 0, calcHeuresPrevues = 0, calcJoursTravailles = 0;
  const joursData = [];

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateFR = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const isWeekend = dow === 0 || dow === 6;
    const heuresPlanningJour = Number(empPlanning[dow] || 0);
    if (!isWeekend && heuresPlanningJour > 0) calcHeuresPrevues += heuresPlanningJour;

    const hChef = (heuresChef || []).filter(h => h.date === dateStr);
    const hInt = (heuresInterim || []).filter(h => h.date === dateStr);
    const hOuv = (heuresOuvriers || []).filter(h => h.date === dateStr);
    const totalH = hChef.reduce((s,h) => s + (h.total_heures||h.heures_normales||0), 0) + hInt.reduce((s,h) => s + (h.total_heures||0), 0) + hOuv.reduce((s,h) => s + (h.heures||0), 0);
    const chantierRec = hChef[0] || hInt[0] || hOuv[0];
    const chantier = chantierRec ? getChantierNom(chantierRec.chantier_id) : '';
    const abs = (absences || []).find(a => a.start_date <= dateStr && a.end_date >= dateStr);

    let statut = '-', heures = '-', isAbsence = false;
    if (isWeekend) {
      // weekend
    } else if (heuresPlanningJour === 0 && totalH === 0) {
      // jour off
    } else if (abs && heuresPlanningJour > 0 && totalH === 0) {
      const types = { vacances:'Vacances', maladie:'Maladie', jour_ferie:'Jour férié', vacances_sans_solde:'Vac.s.solde', accident:'Accident', cours:'Cours' };
      statut = types[abs.type] || abs.type;
      heures = heuresPlanningJour.toFixed(2);
      isAbsence = true;
      if (abs.type === 'vacances_sans_solde') calcAbsNonPayees += heuresPlanningJour;
      else if (abs.type === 'jour_ferie') { calcJoursFeries += heuresPlanningJour; calcAbsPayees += heuresPlanningJour; }
      else { calcAbsPayees += heuresPlanningJour; if (abs.type === 'vacances') calcVacPrises += heuresPlanningJour; }
    } else if (totalH > 0) {
      statut = 'Travail';
      heures = totalH.toFixed(2);
      calcHeuresTravaillees += totalH;
      calcJoursTravailles++;
    }

    joursData.push({ jour: joursNoms[dow], date: dateFR, statut, chantier: isWeekend ? '-' : (chantier || '-'), heures, isWeekend, isAbsence });
  }

  const calcDelta = (calcHeuresTravaillees + calcAbsPayees) - (calcHeuresPrevues - calcAbsNonPayees);
  const calcSoldeHeures = bilan.solde_precedent + calcDelta;
  const calcVacNouveau = (bilan.vac_solde_prec || 0) + (bilan.vac_acquises || 0) - calcVacPrises;

  const primesEmp = getPrimesForEmployee(email).map(p => ({
    chantierNom: p.chantier_nom || 'Chantier ' + p.chantier_id,
    eff: parseFloat(p.prime_efficacite) || 0,
    reg: parseFloat(p.prime_regies) || 0,
    total: parseFloat(p.montant) || 0
  }));

  generateFicheIndividuellePDF({
    nom,
    monthLabel: formatMonth(selectedMonth.value),
    jours: joursData,
    bilan: {
      heuresPrevues: calcHeuresPrevues.toFixed(2),
      heuresTravaillees: calcHeuresTravaillees.toFixed(2),
      joursTravailles: calcJoursTravailles,
      joursFeries: calcJoursFeries.toFixed(2),
      absPayees: (calcAbsPayees - calcJoursFeries).toFixed(2),
      absNonPayees: calcAbsNonPayees.toFixed(2),
      soldePrecedent: bilan.solde_precedent.toFixed(2),
      delta: calcDelta.toFixed(2),
      soldeHeures: calcSoldeHeures.toFixed(2),
      vacSoldPrec: (bilan.vac_solde_prec || 0).toFixed(2),
      vacAcquises: (bilan.vac_acquises || 0).toFixed(2),
      vacPrises: calcVacPrises.toFixed(2),
      vacNouveau: calcVacNouveau.toFixed(2)
    },
    primes: primesEmp,
    selectedMonth: selectedMonth.value
  });
  showPDFModal.value = false;
};

onMounted(async () => {
  await loadEmployes();
  await calculateAndLoad();
});
</script>

<style scoped>
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999}
.modal-content{background:white;border-radius:10px;width:400px;max-width:90vw}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding:15px 20px;border-bottom:1px solid #dee2e6}
.modal-body{padding:20px}
.modal-footer{padding:15px 20px;border-top:1px solid #dee2e6;display:flex;justify-content:flex-end;gap:10px}
</style>
