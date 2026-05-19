<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">🏖️ Gestion Solde Vacances</h2>

    <!-- Selezione mese -->
    <div class="row mb-4">
      <div class="col-md-4">
        <label class="form-label fw-bold">Mois:</label>
        <input v-model="selectedMonth" type="month" class="form-control" @change="loadData" />
      </div>
      <div class="col-md-4 d-flex align-items-end">
        <button @click="loadData" class="btn btn-primary me-2">📊 Charger</button>
        <button @click="calculateMonth" class="btn btn-success me-2">⚙️ Calculer mois</button>
        <button @click="calculateYear" class="btn btn-warning me-2">📅 Calculer toute l'année</button>
      </div>
      <div class="col-md-4 d-flex align-items-end">
        <div class="dropdown">
          <button class="btn btn-danger dropdown-toggle" type="button" data-bs-toggle="dropdown">📄 Générer PDF</button>
          <ul class="dropdown-menu">
            <li><h6 class="dropdown-header">Entreprise (tous)</h6></li>
            <li><a class="dropdown-item" href="#" @click.prevent="generatePDFEntreprise('mois')">📋 Mensuel - {{ formatMonth(selectedMonth) }}</a></li>
            <li><a class="dropdown-item" href="#" @click.prevent="generatePDFEntreprise('annuel')">📋 Récapitulatif annuel {{ selectedMonth.split('-')[0] }}</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><h6 class="dropdown-header">Individuel (par employé)</h6></li>
            <li><a class="dropdown-item" href="#" @click.prevent="showPDFIndividuelModal = true">👤 Fiche individuelle...</a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Configuration heures/mois par employé -->
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">⚙️ Configuration droits vacances</h5>
        <button @click="showConfig = !showConfig" class="btn btn-sm btn-outline-secondary">
          {{ showConfig ? 'Masquer' : 'Afficher' }}
        </button>
      </div>
      <div v-if="showConfig" class="card-body">
        <p class="text-muted small">Heures de vacances acquises par mois selon le contrat de chaque employé.</p>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Employé</th>
              <th style="width:150px">Heures/mois (contrat)</th>
              <th style="width:150px">Solde initial (h)</th>
              <th style="width:100px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employes" :key="emp.email">
              <td>{{ emp.nom }}</td>
              <td>
                <input v-model.number="emp.heures_droit_mois" type="number" step="0.01" class="form-control form-control-sm" />
              </td>
              <td>
                <input v-model.number="emp.solde_initial" type="number" step="0.01" class="form-control form-control-sm" />
              </td>
              <td>
                <button @click="saveConfig(emp)" class="btn btn-sm btn-primary">💾</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tableau solde mensuel -->
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">📊 Solde Vacances - {{ formatMonth(selectedMonth) }}</h5>
      </div>
      <div class="card-body">
        <div v-if="soldes.length === 0" class="text-center text-muted py-4">
          Aucune donnée pour ce mois. Cliquez sur "Calculer" pour générer.
        </div>
        <table v-else class="table">
          <thead>
            <tr>
              <th>Employé</th>
              <th class="text-end">Solde précédent</th>
              <th class="text-end">Heures acquises</th>
              <th class="text-end">Vacances prises</th>
              <th class="text-end fw-bold">Solde final</th>
              <th style="width:80px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="solde in soldes" :key="solde.id">
              <td><strong>{{ getEmployeName(solde.employee_email) }}</strong></td>
              <td class="text-end">{{ solde.solde_precedent.toFixed(2) }}h</td>
              <td class="text-end text-success">+{{ solde.heures_droit_mois.toFixed(2) }}h</td>
              <td class="text-end text-danger">-{{ solde.heures_prises.toFixed(2) }}h</td>
              <td class="text-end fw-bold" :class="solde.solde_final < 0 ? 'text-danger' : 'text-success'">
                {{ solde.solde_final.toFixed(2) }}h
              </td>
              <td>
                <button @click="editSolde(solde)" class="btn btn-sm btn-outline-warning">✏️</button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="table-light">
              <td><strong>TOTAL</strong></td>
              <td class="text-end">{{ totalSoldePrecedent.toFixed(2) }}h</td>
              <td class="text-end text-success">+{{ totalAcquises.toFixed(2) }}h</td>
              <td class="text-end text-danger">-{{ totalPrises.toFixed(2) }}h</td>
              <td class="text-end fw-bold">{{ totalSoldeFinal.toFixed(2) }}h</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Historique -->
    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">📅 Historique par employé</h5>
        <select v-model="selectedEmployeHistory" class="form-control form-control-sm" style="width:250px" @change="loadHistory">
          <option value="">Sélectionner un employé</option>
          <option v-for="emp in employes" :key="emp.email" :value="emp.email">{{ emp.nom }}</option>
        </select>
      </div>
      <div v-if="historique.length > 0" class="card-body">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Mois</th>
              <th class="text-end">Solde précédent</th>
              <th class="text-end">Acquises</th>
              <th class="text-end">Prises</th>
              <th class="text-end">Solde final</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in historique" :key="h.id">
              <td>{{ formatMonth(h.mois) }}</td>
              <td class="text-end">{{ h.solde_precedent.toFixed(2) }}h</td>
              <td class="text-end text-success">+{{ h.heures_droit_mois.toFixed(2) }}h</td>
              <td class="text-end text-danger">-{{ h.heures_prises.toFixed(2) }}h</td>
              <td class="text-end fw-bold">{{ h.solde_final.toFixed(2) }}h</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal edit -->
    <div v-if="editModalShow" class="modal-overlay" @click.self="editModalShow = false">
      <div class="modal-content">
        <div class="modal-header">
          <h5>✏️ Modifier solde - {{ getEmployeName(editItem.employee_email) }}</h5>
          <button @click="editModalShow = false" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Solde précédent (h):</label>
            <input v-model.number="editItem.solde_precedent" type="number" step="0.01" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label">Heures acquises (h):</label>
            <input v-model.number="editItem.heures_droit_mois" type="number" step="0.01" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label">Vacances prises (h):</label>
            <input v-model.number="editItem.heures_prises" type="number" step="0.01" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label">Notes:</label>
            <input v-model="editItem.notes" type="text" class="form-control" />
          </div>
          <p class="fw-bold">Solde final: {{ (editItem.solde_precedent + editItem.heures_droit_mois - editItem.heures_prises).toFixed(2) }}h</p>
        </div>
        <div class="modal-footer">
          <button @click="editModalShow = false" class="btn btn-secondary">Annuler</button>
          <button @click="saveEditSolde" class="btn btn-primary">Enregistrer</button>
        </div>
      </div>
    </div>
    <!-- Modal PDF individuel -->
    <div v-if="showPDFIndividuelModal" class="modal-overlay" @click.self="showPDFIndividuelModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h5>👤 PDF Individuel</h5>
          <button @click="showPDFIndividuelModal = false" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Employé:</label>
            <select v-model="pdfIndividuelEmail" class="form-control">
              <option value="">Sélectionner</option>
              <option v-for="emp in employes" :key="emp.email" :value="emp.email">{{ emp.nom }}</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Type:</label>
            <select v-model="pdfIndividuelType" class="form-control">
              <option value="mois">Mensuel - {{ formatMonth(selectedMonth) }}</option>
              <option value="annuel">Récapitulatif annuel {{ selectedMonth.split('-')[0] }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showPDFIndividuelModal = false" class="btn btn-secondary">Annuler</button>
          <button @click="generatePDFIndividuel" class="btn btn-danger" :disabled="!pdfIndividuelEmail">📄 Générer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/supabase';
import RetourButton from '@/components/RetourButton.vue';

const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const employes = ref([]);
const soldes = ref([]);
const showConfig = ref(false);
const editModalShow = ref(false);
const editItem = ref({});
const selectedEmployeHistory = ref('');
const historique = ref([]);

const showPDFIndividuelModal = ref(false);
const pdfIndividuelEmail = ref('');
const pdfIndividuelType = ref('mois');

// Totaux
const totalSoldePrecedent = computed(() => soldes.value.reduce((s, r) => s + r.solde_precedent, 0));
const totalAcquises = computed(() => soldes.value.reduce((s, r) => s + r.heures_droit_mois, 0));
const totalPrises = computed(() => soldes.value.reduce((s, r) => s + r.heures_prises, 0));
const totalSoldeFinal = computed(() => soldes.value.reduce((s, r) => s + r.solde_final, 0));

const loadEmployes = async () => {
  const { data: collaborateurs } = await supabase.from('collaborateurs').select('*');
  const { data: chefs } = await supabase.from('chefdechantiers').select('*');
  
  const allEmployes = [
    ...(chefs || []).filter(c => !c.excludeFromReport && c.actif !== false).map(c => ({ email: c.email, nom: `${c.nom} ${c.prenom}`, type: 'chef' })),
    ...(collaborateurs || []).filter(c => !c.excludeFromReport && c.actif !== false).map(c => ({ email: c.email, nom: `${c.nom} ${c.prenom}`, type: 'ouvrier' }))
  ];

  // Carica config esistente
  const { data: configs } = await supabase.from('solde_vacances_config').select('*');
  
  employes.value = allEmployes.map(emp => {
    const cfg = (configs || []).find(c => c.employee_email === emp.email);
    return {
      ...emp,
      heures_droit_mois: cfg?.heures_droit_mois || 0,
      solde_initial: cfg?.solde_initial || 0
    };
  });
};

const loadData = async () => {
  const { data } = await supabase
    .from('solde_vacances')
    .select('*')
    .eq('mois', selectedMonth.value)
    .order('employee_email');
  
  soldes.value = data || [];
};

const calculateMonth = async () => {
  const [year, month] = selectedMonth.value.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  // Mese precedente
  const prevDate = new Date(year, month - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  // Carica soldi mese precedente
  const { data: prevSoldes } = await supabase
    .from('solde_vacances')
    .select('*')
    .eq('mois', prevMonth);

  // Carica assenze vacances approvate nel mese
  const { data: absences } = await supabase
    .from('absences')
    .select('*')
    .eq('status', 'approved')
    .eq('type', 'vacances')
    .gte('start_date', startDate)
    .lte('start_date', endDate);

  // Calcola per ogni impiegato
  for (const emp of employes.value) {
    // Solde precedente: dal mese prima o dal solde_initial
    const prevSolde = (prevSoldes || []).find(s => s.employee_email === emp.email);
    const soldePrecedent = prevSolde ? prevSolde.solde_final : emp.solde_initial;

    // Ore maturate
    const heuresDroit = emp.heures_droit_mois || 0;

    // Vacanze prese nel mese (usa le ore salvate nell'absence)
    let heuresPrises = 0;
    const empAbsences = (absences || []).filter(a => a.user_id === emp.email);
    for (const abs of empAbsences) {
      const start = new Date(Math.max(new Date(abs.start_date), new Date(startDate)));
      const end = new Date(Math.min(new Date(abs.end_date), new Date(endDate)));
      let current = new Date(start);
      while (current <= end) {
        const dow = current.getDay();
        if (dow !== 0 && dow !== 6) {
          // Utilise les heures sauvegardées ou calcule selon le jour
          const heuresJour = abs.heures || ((dow >= 1 && dow <= 4) ? 8.75 : 5);
          heuresPrises += heuresJour;
        }
        current.setDate(current.getDate() + 1);
      }
    }

    const soldeFinal = soldePrecedent + heuresDroit - heuresPrises;

    // Upsert
    const existing = soldes.value.find(s => s.employee_email === emp.email);
    if (existing) {
      await supabase.from('solde_vacances').update({
        solde_precedent: soldePrecedent,
        heures_droit_mois: heuresDroit,
        heures_prises: heuresPrises,
        solde_final: soldeFinal,
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
    } else {
      await supabase.from('solde_vacances').insert({
        employee_email: emp.email,
        user_id: emp.email,
        mois: selectedMonth.value,
        solde_precedent: soldePrecedent,
        heures_droit_mois: heuresDroit,
        heures_prises: heuresPrises,
        solde_final: soldeFinal
      });
    }
  }

  await loadData();
  alert('Calcul terminé!');
};

const saveConfig = async (emp) => {
  const { data: existing } = await supabase
    .from('solde_vacances_config')
    .select('id')
    .eq('employee_email', emp.email)
    .single();

  if (existing) {
    await supabase.from('solde_vacances_config').update({
      heures_droit_mois: emp.heures_droit_mois,
      solde_initial: emp.solde_initial
    }).eq('id', existing.id);
  } else {
    await supabase.from('solde_vacances_config').insert({
      employee_email: emp.email,
      heures_droit_mois: emp.heures_droit_mois,
      solde_initial: emp.solde_initial
    });
  }
  alert('Configuration sauvegardée!');
};

const editSolde = (solde) => {
  editItem.value = { ...solde };
  editModalShow.value = true;
};

const saveEditSolde = async () => {
  const soldeFinal = editItem.value.solde_precedent + editItem.value.heures_droit_mois - editItem.value.heures_prises;
  await supabase.from('solde_vacances').update({
    solde_precedent: editItem.value.solde_precedent,
    heures_droit_mois: editItem.value.heures_droit_mois,
    heures_prises: editItem.value.heures_prises,
    solde_final: soldeFinal,
    notes: editItem.value.notes,
    updated_at: new Date().toISOString()
  }).eq('id', editItem.value.id);

  editModalShow.value = false;
  await loadData();
};

const loadHistory = async () => {
  if (!selectedEmployeHistory.value) { historique.value = []; return; }
  const { data } = await supabase
    .from('solde_vacances')
    .select('*')
    .eq('employee_email', selectedEmployeHistory.value)
    .order('mois', { ascending: true });
  historique.value = data || [];
};

const getEmployeName = (email) => {
  const emp = employes.value.find(e => e.email === email);
  return emp ? emp.nom : email;
};

const formatMonth = (monthStr) => {
  if (!monthStr || typeof monthStr !== 'string') return '';
  const [year, month] = monthStr.split('-');
  return new Date(year, month - 1).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
};

const generatePDFEntreprise = async (type) => {
  const year = selectedMonth.value.split('-')[0];
  const monthLabel = formatMonth(selectedMonth.value);
  const titre = type === 'mois' ? `Solde des vacances - ${monthLabel}` : `Récapitulatif annuel des vacances - ${year}`;

  let dataRows = [];

  if (type === 'mois') {
    dataRows = soldes.value.map(s => ({
      nom: getEmployeName(s.employee_email),
      solde_precedent: s.solde_precedent,
      heures_droit_mois: s.heures_droit_mois,
      heures_prises: s.heures_prises,
      solde_final: s.solde_final
    }));
  } else {
    // Annuel: carica tutti i mesi dell'anno
    const { data: annualData } = await supabase
      .from('solde_vacances')
      .select('*')
      .gte('mois', `${year}-01`)
      .lte('mois', `${year}-12`)
      .order('mois');

    // Raggruppa per impiegato
    const byEmployee = {};
    (annualData || []).forEach(row => {
      if (!byEmployee[row.employee_email]) byEmployee[row.employee_email] = [];
      byEmployee[row.employee_email].push(row);
    });

    for (const [email, rows] of Object.entries(byEmployee)) {
      const firstRow = rows[0];
      const lastRow = rows[rows.length - 1];
      dataRows.push({
        nom: getEmployeName(email),
        solde_precedent: firstRow.solde_precedent,
        heures_droit_mois: rows.reduce((s, r) => s + r.heures_droit_mois, 0),
        heures_prises: rows.reduce((s, r) => s + r.heures_prises, 0),
        solde_final: lastRow.solde_final
      });
    }
  }

  const totPrecedent = dataRows.reduce((s, r) => s + r.solde_precedent, 0);
  const totAcquises = dataRows.reduce((s, r) => s + r.heures_droit_mois, 0);
  const totPrises = dataRows.reduce((s, r) => s + r.heures_prises, 0);
  const totFinal = dataRows.reduce((s, r) => s + r.solde_final, 0);

  let html = `<html><head><title>${titre}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .company { text-align: center; margin-bottom: 30px; }
    .company h2 { font-size: 18px; margin: 0; }
    .company p { color: #555; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
    th { background: #f5f5f5; }
    td:first-child, th:first-child { text-align: left; }
    .positive { color: green; } .negative { color: red; }
    tfoot td { font-weight: bold; background: #f9f9f9; }
    .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; }
    @media print { body { margin: 0; } }
  </style></head><body>
  <div class="company">
    <h2>DALLELEC Sàrl</h2>
    <p>${titre}</p>
    ${type === 'annuel' ? '<p><em>Du janvier à ' + formatMonth(selectedMonth) + '</em></p>' : ''}
  </div>
  <table><thead><tr>
    <th>Employé</th>
    <th>${type === 'mois' ? 'Solde précédent' : 'Solde début année'}</th>
    <th>${type === 'mois' ? 'Heures acquises' : 'Total acquis'}</th>
    <th>${type === 'mois' ? 'Vacances prises' : 'Total prises'}</th>
    <th>Solde final</th>
  </tr></thead><tbody>`;

  for (const row of dataRows) {
    const cls = row.solde_final < 0 ? 'negative' : 'positive';
    html += `<tr>
      <td>${row.nom}</td>
      <td>${row.solde_precedent.toFixed(2)}h</td>
      <td class="positive">+${row.heures_droit_mois.toFixed(2)}h</td>
      <td class="negative">-${row.heures_prises.toFixed(2)}h</td>
      <td class="${cls}"><strong>${row.solde_final.toFixed(2)}h</strong></td>
    </tr>`;
  }

  html += `</tbody><tfoot><tr>
    <td>TOTAL</td>
    <td>${totPrecedent.toFixed(2)}h</td>
    <td class="positive">+${totAcquises.toFixed(2)}h</td>
    <td class="negative">-${totPrises.toFixed(2)}h</td>
    <td>${totFinal.toFixed(2)}h</td>
  </tr></tfoot></table>
  <div class="footer">Document généré le ${new Date().toLocaleDateString('fr-FR')} - DALLELEC Sàrl</div>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
};

const generatePDFIndividuel = async () => {
  const email = pdfIndividuelEmail.value;
  const type = pdfIndividuelType.value;
  const nom = getEmployeName(email);
  const year = selectedMonth.value.split('-')[0];

  let rows = [];
  if (type === 'mois') {
    const solde = soldes.value.find(s => s.employee_email === email);
    if (solde) rows = [solde];
  } else {
    const { data } = await supabase
      .from('solde_vacances')
      .select('*')
      .eq('employee_email', email)
      .gte('mois', `${year}-01`)
      .lte('mois', `${year}-12`)
      .order('mois');
    rows = data || [];
  }

  if (rows.length === 0) { alert('Aucune donnée disponible'); return; }

  const titre = type === 'mois'
    ? `Fiche vacances - ${formatMonth(selectedMonth)}`
    : `Récapitulatif annuel vacances - ${year}`;

  let html = `<html><head><title>${titre} - ${nom}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 20px; margin: 0; }
    .header p { color: #666; margin: 5px 0; }
    .employee-name { font-size: 16px; font-weight: bold; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
    th { background: #f5f5f5; }
    td:first-child, th:first-child { text-align: left; }
    .positive { color: green; } .negative { color: red; }
    .result { margin-top: 25px; padding: 20px; background: #f0f8ff; border-radius: 8px; text-align: center; border: 2px solid #007bff; }
    .result h2 { margin: 5px 0; font-size: 28px; }
    .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; }
    @media print { body { margin: 0; } }
  </style></head><body>
  <div class="header">
    <h1>DALLELEC Sàrl</h1>
    <p>${titre}</p>
  </div>
  <div class="employee-name">👤 ${nom}</div>`;

  if (type === 'mois') {
    const s = rows[0];
    html += `<table>
      <tr><td><strong>Solde précédent:</strong></td><td>${s.solde_precedent.toFixed(2)} heures</td></tr>
      <tr><td><strong>Heures acquises ce mois:</strong></td><td class="positive">+${s.heures_droit_mois.toFixed(2)} heures</td></tr>
      <tr><td><strong>Vacances prises ce mois:</strong></td><td class="negative">-${s.heures_prises.toFixed(2)} heures</td></tr>
    </table>
    <div class="result">
      <p>Solde final des vacances:</p>
      <h2 class="${s.solde_final < 0 ? 'negative' : 'positive'}">${s.solde_final.toFixed(2)} heures</h2>
    </div>
    ${s.notes ? `<p style="margin-top:15px"><em>Notes: ${s.notes}</em></p>` : ''}`;
  } else {
    // Tableau annuel mois par mois
    html += `<table><thead><tr>
      <th>Mois</th><th>Solde précédent</th><th>Acquises</th><th>Prises</th><th>Solde final</th>
    </tr></thead><tbody>`;
    for (const r of rows) {
      const cls = r.solde_final < 0 ? 'negative' : 'positive';
      html += `<tr>
        <td>${formatMonth(r.mois)}</td>
        <td>${r.solde_precedent.toFixed(2)}h</td>
        <td class="positive">+${r.heures_droit_mois.toFixed(2)}h</td>
        <td class="negative">-${r.heures_prises.toFixed(2)}h</td>
        <td class="${cls}"><strong>${r.solde_final.toFixed(2)}h</strong></td>
      </tr>`;
    }
    const lastRow = rows[rows.length - 1];
    const totAcq = rows.reduce((s, r) => s + r.heures_droit_mois, 0);
    const totPris = rows.reduce((s, r) => s + r.heures_prises, 0);
    html += `</tbody><tfoot><tr>
      <td><strong>TOTAL ${year}</strong></td>
      <td>${rows[0].solde_precedent.toFixed(2)}h</td>
      <td class="positive">+${totAcq.toFixed(2)}h</td>
      <td class="negative">-${totPris.toFixed(2)}h</td>
      <td><strong>${lastRow.solde_final.toFixed(2)}h</strong></td>
    </tr></tfoot></table>`;
    html += `<div class="result">
      <p>Solde actuel des vacances:</p>
      <h2 class="${lastRow.solde_final < 0 ? 'negative' : 'positive'}">${lastRow.solde_final.toFixed(2)} heures</h2>
    </div>`;
  }

  html += `<div class="footer">Document généré le ${new Date().toLocaleDateString('fr-FR')} - DALLELEC Sàrl - À joindre au bulletin de salaire</div>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
  showPDFIndividuelModal.value = false;
};

onMounted(async () => {
  await loadEmployes();
  await loadData();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: white; border-radius: 10px;
  width: 500px; max-width: 90vw;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 15px 20px; border-bottom: 1px solid #dee2e6;
}
.modal-body { padding: 20px; }
.modal-footer {
  padding: 15px 20px; border-top: 1px solid #dee2e6;
  display: flex; justify-content: flex-end; gap: 10px;
}
</style>
