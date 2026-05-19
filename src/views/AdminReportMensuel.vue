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
      Aucune donnée pour {{ formatMonth(selectedMonth) }}. Lancez d'abord le calcul depuis le Bilan Mensuel.
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
  employes.value = [
    ...(chefs || []).filter(c => !c.excludeFromReport && c.actif !== false).map(c => ({ email: c.email, nom: `${c.nom} ${c.prenom}` })),
    ...(collaborateurs || []).filter(c => !c.excludeFromReport && c.actif !== false).map(c => ({ email: c.email, nom: `${c.nom} ${c.prenom}` }))
  ];
};

const loadData = async () => {
  loaded.value = false;
  const { data } = await supabase.from('solde_heures').select('*').eq('mois', selectedMonth.value);
  const { data: vacData } = await supabase.from('solde_vacances').select('*').eq('mois', selectedMonth.value);

  bilans.value = (data || []).map(b => {
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
    body{font-family:Arial,sans-serif;padding:10px 15px;margin:0;font-size:9px}
    .page{page-break-after:always;padding:10px 0}
    .page:last-child{page-break-after:avoid}
    .header{text-align:center;margin-bottom:10px;border-bottom:2px solid #333;padding-bottom:8px}
    .header h1{font-size:14px;margin:0}
    .header p{margin:2px 0;font-size:10px;color:#555}
    .emp-title{font-size:12px;font-weight:bold;margin:10px 0 8px;padding:5px;background:#f0f0f0;border-left:4px solid #333}
    .two-cols{display:flex;gap:15px;margin-top:8px}
    .col-box{flex:1;border:2px solid #333;padding:10px;border-radius:4px}
    .col-box h3{font-size:11px;margin:0 0 8px;border-bottom:1px solid #ccc;padding-bottom:4px}
    .col-box table{width:100%;border-collapse:collapse}
    .col-box td{padding:3px 0;font-size:9.5px}
    .col-box td:last-child{text-align:right;font-weight:bold}
    .result{font-size:12px;font-weight:bold;margin-top:6px;padding-top:6px;border-top:2px solid #333}
    .pos{color:green}.neg{color:red}
    .footer{text-align:center;font-size:8px;color:#999;margin-top:10px;border-top:1px solid #ddd;padding-top:5px}
    @media print{body{margin:0;padding:5mm}@page{size:A4 portrait;margin:8mm}.page{page-break-after:always}}
  </style></head><body>`;

  // 2 employés par page
  for (let i = 0; i < bilans.value.length; i += 2) {
    html += `<div class="page">`;
    html += `<div class="header"><h1>DALLELEC Sàrl - Rapport Mensuel</h1><p>${monthLabel} — Document pour le commercialiste</p></div>`;

    for (let j = i; j < Math.min(i + 2, bilans.value.length); j++) {
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
