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
        <button @click="calculateAndLoad" class="btn btn-success">⚙️ Recalculer depuis janvier</button>
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
              <td class="text-end">{{ b.heures_absences_payees.toFixed(2) }}</td>
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
import { ref, onMounted } from 'vue';
import { supabase } from '@/supabase';
import RetourButton from '@/components/RetourButton.vue';

const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const employes = ref([]);
const bilans = ref([]);
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
    return { ...emp, heures_droit_mois: cfg?.heures_droit_mois || 0, solde_initial_vac: cfg?.solde_initial || 0 };
  });
};

const loadData = async () => {
  const { data } = await supabase.from('solde_heures').select('*').eq('mois', selectedMonth.value);
  // Charger aussi solde vacances
  const { data: vacData } = await supabase.from('solde_vacances').select('*').eq('mois', selectedMonth.value);
  
  bilans.value = (data || []).map(b => {
    const vac = (vacData || []).find(v => v.employee_email === b.employee_email);
    return { ...b, vac_solde_prec: vac?.solde_precedent || 0, vac_acquises: vac?.heures_droit_mois || 0, vac_prises: vac?.heures_prises || 0, vac_nouveau_solde: vac?.solde_final || 0 };
  });
};

const getHeuresPrevuesMois = (mois) => {
  const [year, month] = mois.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let total = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow >= 1 && dow <= 4) total += 8.75;
    else if (dow === 5) total += 5;
  }
  return total;
};

const calculateSingleMonth = async (mois) => {
  const [year, month] = mois.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  const heuresPrevues = getHeuresPrevuesMois(mois);

  const prevDate = new Date(year, month - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const { data: prevSoldes } = await supabase.from('solde_heures').select('*').eq('mois', prevMonth);
  const { data: heuresChef } = await supabase.from('heures_chef_propres').select('*').gte('date', startDate).lte('date', endDate);
  const { data: heuresInterim } = await supabase.from('heures_chef_interim').select('*').gte('date', startDate).lte('date', endDate);
  const { data: heuresOuvriers } = await supabase.from('heures_ouvriers').select('*').gte('date', startDate).lte('date', endDate);
  const { data: absences } = await supabase.from('absences').select('*').eq('status', 'approved').lte('start_date', endDate).gte('end_date', startDate);
  const { data: prevVac } = await supabase.from('solde_vacances').select('*').eq('mois', prevMonth);

  for (const emp of employes.value) {
    const oreChef = (heuresChef || []).filter(h => h.chef_id === emp.email).reduce((s, h) => s + (h.total_heures || h.heures_normales || 0), 0);
    const oreInterim = (heuresInterim || []).filter(h => h.chef_id === emp.email).reduce((s, h) => s + (h.total_heures || 0), 0);
    const oreOuvrier = (heuresOuvriers || []).filter(h => h.ouvrier_id === emp.email).reduce((s, h) => s + (h.heures || 0), 0);
    const heuresTravaillees = oreChef + oreInterim + oreOuvrier;

    let absPayees = 0, absNonPayees = 0, vacPrises = 0;
    const empAbs = (absences || []).filter(a => a.user_id === emp.email);
    for (const abs of empAbs) {
      const start = new Date(Math.max(new Date(abs.start_date), new Date(startDate)));
      const end = new Date(Math.min(new Date(abs.end_date), new Date(endDate)));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay();
        if (dow === 0 || dow === 6) continue;
        const h = abs.heures || ((dow >= 1 && dow <= 4) ? 8.75 : 5);
        if (abs.type === 'vacances_sans_solde') { absNonPayees += h; }
        else { absPayees += h; if (abs.type === 'vacances') vacPrises += h; }
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
    const record = { employee_email: emp.email, mois, heures_prevues: heuresPrevues, heures_travaillees: heuresTravaillees, heures_absences_payees: absPayees, heures_absences_non_payees: absNonPayees, solde_precedent: soldePrecedent, delta_mois: delta, solde_final: soldeFinal, updated_at: new Date().toISOString() };
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
  }
  
  await loadData();
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

const generatePDFGlobal = () => {
  const monthLabel = formatMonth(selectedMonth.value);
  let html = `<html><head><title>Bilan Mensuel - ${monthLabel}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:20px;font-size:11px}
    .header{text-align:center;margin-bottom:20px}
    .header h2{margin:0;font-size:16px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #ddd;padding:5px;text-align:right}
    th{background:#f5f5f5;font-size:10px}
    td:first-child,th:first-child{text-align:left}
    .pos{color:green}.neg{color:red}
    .footer{margin-top:20px;font-size:9px;color:#999;text-align:center}
    @media print{body{margin:0}}
  </style></head><body>
  <div class="header"><h2>DALLELEC Sàrl</h2><p>Bilan Mensuel Personnel - ${monthLabel}</p></div>
  <table><thead><tr>
    <th>Employé</th><th>H.prévues</th><th>H.travaillées</th><th>Abs.payées</th><th>Abs.non payées</th><th>Solde préc.</th><th>Delta</th><th>Solde heures</th><th>Vac.préc.</th><th>Vac.acq.</th><th>Vac.prises</th><th>Vac.solde</th>
  </tr></thead><tbody>`;
  for (const b of bilans.value) {
    const dCls = b.delta_mois >= 0 ? 'pos' : 'neg';
    const sCls = b.solde_final >= 0 ? 'pos' : 'neg';
    html += `<tr><td>${getEmployeName(b.employee_email)}</td><td>${b.heures_prevues.toFixed(2)}</td><td>${b.heures_travaillees.toFixed(2)}</td><td>${b.heures_absences_payees.toFixed(2)}</td><td>${b.heures_absences_non_payees.toFixed(2)}</td><td>${b.solde_precedent.toFixed(2)}</td><td class="${dCls}">${b.delta_mois >= 0?'+':''}${b.delta_mois.toFixed(2)}</td><td class="${sCls}"><strong>${b.solde_final.toFixed(2)}</strong></td><td>${(b.vac_solde_prec||0).toFixed(2)}</td><td class="pos">+${(b.vac_acquises||0).toFixed(2)}</td><td class="neg">-${(b.vac_prises||0).toFixed(2)}</td><td><strong>${(b.vac_nouveau_solde||0).toFixed(2)}</strong></td></tr>`;
  }
  html += `</tbody></table><div class="footer">Document généré le ${new Date().toLocaleDateString('fr-FR')} - DALLELEC Sàrl</div></body></html>`;
  const w = window.open('', '_blank'); w.document.write(html); w.document.close(); w.print();
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

  // Charger détail journalier
  const { data: heuresChef } = await supabase.from('heures_chef_propres').select('*').eq('chef_id', email).gte('date', startDate).lte('date', endDate);
  const { data: heuresInterim } = await supabase.from('heures_chef_interim').select('*').eq('chef_id', email).gte('date', startDate).lte('date', endDate);
  const { data: heuresOuvriers } = await supabase.from('heures_ouvriers').select('*').eq('ouvrier_id', email).gte('date', startDate).lte('date', endDate);
  const { data: absences } = await supabase.from('absences').select('*').eq('user_id', email).eq('status', 'approved').lte('start_date', endDate).gte('end_date', startDate);
  const { data: chantiersList } = await supabase.from('chantiers').select('id, nom');
  const getChantierNom = (id) => { const c = (chantiersList||[]).find(ch => ch.id == id); return c ? c.nom : ''; };

  const monthLabel = formatMonth(selectedMonth.value);
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

  let html = `<html><head><title>Fiche ${nom} - ${monthLabel}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:30px;font-size:11px}
    .header{text-align:center;margin-bottom:20px}
    .header h1{font-size:18px;margin:0}
    .header p{color:#666;margin:3px 0}
    .emp-name{font-size:14px;font-weight:bold;margin:15px 0}
    table{width:100%;border-collapse:collapse;margin:10px 0}
    th,td{border:1px solid #ddd;padding:5px}
    th{background:#f5f5f5}
    .weekend{background:#f0f0f0;color:#999}
    .absence{background:#fff3cd}
    .recap{margin-top:20px;display:flex;gap:30px}
    .recap-box{flex:1;border:1px solid #ddd;padding:15px;border-radius:5px}
    .recap-box h4{margin:0 0 10px;font-size:12px}
    .pos{color:green}.neg{color:red}
    .result{font-size:14px;font-weight:bold;margin-top:10px;padding-top:8px;border-top:2px solid #333}
    .footer{margin-top:30px;font-size:9px;color:#999;text-align:center}
    @media print{body{margin:0}}
  </style></head><body>
  <div class="header"><h1>DALLELEC Sàrl</h1><p>Fiche mensuelle - ${monthLabel}</p></div>
  <div class="emp-name">👤 ${nom}</div>
  <table><thead><tr><th style="width:80px">Jour</th><th style="width:90px">Date</th><th>Statut</th><th>Chantier</th><th style="width:60px">Heures</th></tr></thead><tbody>`;

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateFR = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const isWeekend = dow === 0 || dow === 6;

    // Chercher heures
    const hChef = (heuresChef || []).filter(h => h.date === dateStr);
    const hInterim = (heuresInterim || []).filter(h => h.date === dateStr);
    const hOuv = (heuresOuvriers || []).filter(h => h.date === dateStr);
    const totalH = hChef.reduce((s,h) => s + (h.total_heures||h.heures_normales||0), 0) + hInterim.reduce((s,h) => s + (h.total_heures||0), 0) + hOuv.reduce((s,h) => s + (h.heures||0), 0);
    const chantierRec = hChef[0] || hInterim[0] || hOuv[0];
    const chantier = chantierRec ? getChantierNom(chantierRec.chantier_id) : '';

    // Chercher absence
    const abs = (absences || []).find(a => a.start_date <= dateStr && a.end_date >= dateStr);

    let statut = '', rowClass = '', heures = '';
    if (isWeekend) {
      statut = '-'; rowClass = 'weekend'; heures = '-';
    } else if (abs) {
      const types = { vacances:'Vacances', maladie:'Maladie', jour_ferie:'Jour férié', vacances_sans_solde:'Vac. sans solde', accident:'Accident', cours:'Cours' };
      statut = types[abs.type] || abs.type;
      rowClass = 'absence';
      heures = abs.heures ? abs.heures.toFixed(2) : ((dow >= 1 && dow <= 4) ? '8.75' : '5.00');
    } else if (totalH > 0) {
      statut = 'Travail';
      heures = totalH.toFixed(2);
    } else {
      statut = '-'; heures = '-';
    }

    html += `<tr class="${rowClass}"><td>${jours[dow]}</td><td>${dateFR}</td><td>${statut}</td><td>${isWeekend ? '-' : chantier || '-'}</td><td style="text-align:right">${heures}</td></tr>`;
  }

  html += `</tbody></table>
  <div class="recap">
    <div class="recap-box">
      <h4>📊 Bilan Heures</h4>
      <p>Heures prévues: <strong>${bilan.heures_prevues.toFixed(2)}h</strong></p>
      <p>Heures travaillées: <strong>${bilan.heures_travaillees.toFixed(2)}h</strong></p>
      <p>Absences payées: <strong>${bilan.heures_absences_payees.toFixed(2)}h</strong></p>
      <p>Absences non payées: <strong>${bilan.heures_absences_non_payees.toFixed(2)}h</strong></p>
      <p>Solde précédent: ${bilan.solde_precedent.toFixed(2)}h</p>
      <p>Delta mois: <span class="${bilan.delta_mois >= 0 ? 'pos' : 'neg'}">${bilan.delta_mois >= 0?'+':''}${bilan.delta_mois.toFixed(2)}h</span></p>
      <div class="result ${bilan.solde_final >= 0 ? 'pos' : 'neg'}">Solde heures: ${bilan.solde_final.toFixed(2)}h</div>
    </div>
    <div class="recap-box">
      <h4>🏖️ Bilan Vacances</h4>
      <p>Solde précédent: <strong>${(bilan.vac_solde_prec||0).toFixed(2)}h</strong></p>
      <p>Acquises ce mois: <span class="pos">+${(bilan.vac_acquises||0).toFixed(2)}h</span></p>
      <p>Prises ce mois: <span class="neg">-${(bilan.vac_prises||0).toFixed(2)}h</span></p>
      <div class="result">Nouveau solde: ${(bilan.vac_nouveau_solde||0).toFixed(2)}h</div>
    </div>
  </div>
  <div class="footer">Document généré le ${new Date().toLocaleDateString('fr-FR')} - DALLELEC Sàrl - À joindre au bulletin de salaire</div>
  </body></html>`;

  const w = window.open('', '_blank'); w.document.write(html); w.document.close(); w.print();
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
