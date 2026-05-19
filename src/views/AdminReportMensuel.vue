<template>
  <div class="container py-5">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Report Mensuel - Commercialiste</h2>
    
    <!-- Selezione mese -->
    <div class="row mb-4">
      <div class="col-md-6 mx-auto">
        <div class="card">
          <div class="card-header"><h5>Sélection du mois</h5></div>
          <div class="card-body">
            <div class="mb-3">
              <label>Mois:</label>
              <input v-model="selectedMonth" type="month" class="form-control" @change="loadData" />
            </div>
            <button @click="exportToPDF" class="btn btn-danger" :disabled="bilans.length === 0">📄 Exporter PDF (tous les employés)</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Aperçu -->
    <div v-if="bilans.length > 0" class="card">
      <div class="card-header"><h5 class="mb-0">Aperçu - {{ formatMonth(selectedMonth) }} ({{ bilans.length }} employés)</h5></div>
      <div class="card-body table-responsive">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Employé</th>
              <th class="text-end">H. prévues</th>
              <th class="text-end">H. travaillées</th>
              <th class="text-end">Abs. payées</th>
              <th class="text-end">Delta</th>
              <th class="text-end">Solde heures</th>
              <th class="text-end">Vac. solde</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bilans" :key="b.employee_email">
              <td><strong>{{ getEmployeName(b.employee_email) }}</strong></td>
              <td class="text-end">{{ b.heures_prevues.toFixed(2) }}</td>
              <td class="text-end">{{ b.heures_travaillees.toFixed(2) }}</td>
              <td class="text-end">{{ (b.heures_absences_payees || 0).toFixed(2) }}</td>
              <td class="text-end" :class="b.delta_mois >= 0 ? 'text-success' : 'text-danger'">{{ b.delta_mois >= 0 ? '+' : '' }}{{ b.delta_mois.toFixed(2) }}</td>
              <td class="text-end fw-bold" :class="b.solde_final >= 0 ? 'text-success' : 'text-danger'">{{ b.solde_final.toFixed(2) }}</td>
              <td class="text-end fw-bold">{{ (b.vac_nouveau_solde || 0).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="loaded" class="alert alert-info text-center">
      Aucune donnée pour {{ formatMonth(selectedMonth) }}.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/supabase';
import RetourButton from '@/components/RetourButton.vue';

const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const bilans = ref([]);
const employes = ref([]);
const loaded = ref(false);

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

    let absPayees = 0, absNonPayees = 0, vacPrises = 0, joursFeries = 0;
    const empAbs = (absences || []).filter(a => a.user_id === emp.email);
    for (const abs of empAbs) {
      const start = new Date(Math.max(new Date(abs.start_date), new Date(startDate)));
      const end = new Date(Math.min(new Date(abs.end_date), new Date(endDate)));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay();
        if (dow === 0 || dow === 6) continue;
        const hJour = abs.heures || Number(emp.planning[dow] || 0);
        if (hJour === 0) continue;
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

    const { data: existing } = await supabase.from('solde_heures').select('id').eq('employee_email', emp.email).eq('mois', mois).single();
    const record = { employee_email: emp.email, mois, heures_prevues: heuresPrevues, heures_travaillees: heuresTravaillees, heures_absences_payees: absPayees, heures_absences_non_payees: absNonPayees, heures_jours_feries: joursFeries, solde_precedent: soldePrecedent, delta_mois: delta, solde_final: soldeFinal, updated_at: new Date().toISOString() };
    if (existing) { await supabase.from('solde_heures').update(record).eq('id', existing.id); }
    else { await supabase.from('solde_heures').insert(record); }

    const { data: existingVac } = await supabase.from('solde_vacances').select('id').eq('employee_email', emp.email).eq('mois', mois).single();
    const vacRecord = { employee_email: emp.email, user_id: emp.email, mois, solde_precedent: vacSoldePrecedent, heures_droit_mois: vacAcquises, heures_prises: vacPrises, solde_final: vacNouveauSolde, updated_at: new Date().toISOString() };
    if (existingVac) { await supabase.from('solde_vacances').update(vacRecord).eq('id', existingVac.id); }
    else { await supabase.from('solde_vacances').insert(vacRecord); }
  }
};

const loadData = async () => {
  loaded.value = false;

  // Vérifier si les données existent déjà
  const { data } = await supabase.from('solde_heures').select('*').eq('mois', selectedMonth.value);

  // Si pas de données, calculer automatiquement depuis janvier
  if (!data || data.length === 0) {
    const [targetYear, targetMonth] = selectedMonth.value.split('-').map(Number);
    for (let m = 1; m <= targetMonth; m++) {
      const mois = `${targetYear}-${String(m).padStart(2, '0')}`;
      await calculateSingleMonth(mois);
    }
  }

  // Charger les données
  const { data: finalData } = await supabase.from('solde_heures').select('*').eq('mois', selectedMonth.value);
  const { data: vacData } = await supabase.from('solde_vacances').select('*').eq('mois', selectedMonth.value);

  bilans.value = (finalData || []).map(b => {
    const vac = (vacData || []).find(v => v.employee_email === b.employee_email);
    return {
      ...b,
      vac_solde_prec: vac?.solde_precedent || 0,
      vac_acquises: vac?.heures_droit_mois || 0,
      vac_prises: vac?.heures_prises || 0,
      vac_nouveau_solde: vac?.solde_final || 0
    };
  });
  loaded.value = true;
};

const getEmployeName = (email) => {
  const emp = employes.value.find(e => e.email === email);
  return emp ? emp.nom : email;
};

const formatMonth = (m) => {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
};

const exportToPDF = () => {
  const monthLabel = formatMonth(selectedMonth.value);

  let html = `<html><head><title>Report Commercialiste - ${monthLabel}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:8px 12px;margin:0;font-size:8px}
    .page{page-break-after:always;padding:5px 0}
    .page:last-child{page-break-after:avoid}
    .header{text-align:center;margin-bottom:6px;border-bottom:1.5px solid #333;padding-bottom:5px}
    .header h1{font-size:12px;margin:0}
    .header p{margin:1px 0;font-size:9px;color:#555}
    .emp-title{font-size:10px;font-weight:bold;margin:6px 0 4px;padding:3px 5px;background:#f0f0f0;border-left:3px solid #333}
    .two-cols{display:flex;gap:10px;margin-top:4px}
    .col-box{flex:1;border:1.5px solid #333;padding:6px;border-radius:3px}
    .col-box h3{font-size:9px;margin:0 0 4px;border-bottom:1px solid #ccc;padding-bottom:2px}
    .col-box table{width:100%;border-collapse:collapse}
    .col-box td{padding:1.5px 0;font-size:8px}
    .col-box td:last-child{text-align:right;font-weight:bold}
    .result{font-size:10px;font-weight:bold;margin-top:4px;padding-top:4px;border-top:1.5px solid #333}
    .pos{color:green}.neg{color:red}
    .footer{text-align:center;font-size:7px;color:#999;margin-top:6px;border-top:1px solid #ddd;padding-top:3px}
    @media print{body{margin:0;padding:5mm}@page{size:A4 portrait;margin:6mm}.page{page-break-after:always}}
  </style></head><body>`;

  // 3 employés par page
  for (let i = 0; i < bilans.value.length; i += 3) {
    html += `<div class="page">`;
    html += `<div class="header"><h1>DALLELEC Sàrl - Rapport Mensuel</h1><p>${monthLabel} — Document pour le commercialiste</p></div>`;

    for (let j = i; j < Math.min(i + 3, bilans.value.length); j++) {
      const b = bilans.value[j];
      const nom = getEmployeName(b.employee_email);
      const deltaClass = b.delta_mois >= 0 ? 'pos' : 'neg';
      const soldeClass = b.solde_final >= 0 ? 'pos' : 'neg';

      html += `<div class="emp-title">👤 ${nom}</div>`;
      html += `<div class="two-cols">`;

      // Box Heures
      html += `<div class="col-box"><h3>📊 Bilan Heures</h3><table>
        <tr><td>Heures prévues</td><td>${b.heures_prevues.toFixed(2)}h</td></tr>
        <tr><td>Heures travaillées</td><td>${b.heures_travaillees.toFixed(2)}h</td></tr>
        <tr><td>Jours fériés payés</td><td>${(b.heures_jours_feries || 0).toFixed(2)}h</td></tr>
        <tr><td>Autres absences payées</td><td>${((b.heures_absences_payees || 0) - (b.heures_jours_feries || 0)).toFixed(2)}h</td></tr>
        <tr><td>Absences non payées</td><td>${b.heures_absences_non_payees.toFixed(2)}h</td></tr>
        <tr><td>Solde précédent</td><td>${b.solde_precedent.toFixed(2)}h</td></tr>
        <tr><td>Delta mois</td><td class="${deltaClass}">${b.delta_mois >= 0 ? '+' : ''}${b.delta_mois.toFixed(2)}h</td></tr>
      </table><div class="result ${soldeClass}">Solde heures: ${b.solde_final.toFixed(2)}h</div></div>`;

      // Box Vacances
      html += `<div class="col-box"><h3>🏖️ Bilan Vacances</h3><table>
        <tr><td>Solde précédent</td><td>${(b.vac_solde_prec || 0).toFixed(2)}h</td></tr>
        <tr><td>Acquises ce mois</td><td class="pos">+${(b.vac_acquises || 0).toFixed(2)}h</td></tr>
        <tr><td>Prises ce mois</td><td class="neg">-${(b.vac_prises || 0).toFixed(2)}h</td></tr>
      </table><div class="result">Nouveau solde: ${(b.vac_nouveau_solde || 0).toFixed(2)}h</div></div>`;

      html += `</div>`; // two-cols
    }

    html += `<div class="footer">Document généré le ${new Date().toLocaleDateString('fr-FR')} — DALLELEC Sàrl — À joindre au bulletin de salaire</div>`;
    html += `</div>`; // page
  }

  html += `</body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
};

onMounted(async () => {
  await loadEmployes();
  await loadData();
});
</script>
