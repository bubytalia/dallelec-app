<template>
  <div class="container py-5">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Monitoring Heures Employés</h2>
    
    <!-- Selezione mese -->
    <div class="row mb-4">
      <div class="col-md-6 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Période de monitoring</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label>Mois:</label>
              <input v-model="selectedMonth" type="month" class="form-control" @change="loadMonitoringData" />
            </div>
            <div v-if="availableMonths.length > 0" class="mb-3">
              <small class="text-info">
                📅 Mesi con ore disponibili: 
                <span v-for="month in availableMonths" :key="month" class="badge bg-info me-1">{{ month }}</span>
              </small>
            </div>
            <button @click="loadMonitoringData" class="btn btn-primary">Actualiser</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertes -->
    <div v-if="alerts.length > 0" class="row mb-4">
      <div class="col-md-12">
        <div class="alert alert-warning">
          <h5>⚠️ Alertes - Employés sans heures</h5>
          <ul class="mb-0">
            <li v-for="alert in alerts" :key="alert.email">
              <strong>{{ alert.nom }}</strong> - {{ alert.joursManquants }} jour(s) sans heures
              <small class="text-muted">(dernière saisie: {{ alert.derniereDate || 'jamais' }})</small>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Calendrier vue d'ensemble -->
    <div v-if="monitoringData" class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Vue d'ensemble - {{ formatMonth(selectedMonth) }}</h5>
            <small class="text-muted">
              🟢 Heures saisies | 🔴 Pas d'heures | 🟦 Vacances | 🟥 Maladie | 🔵 Jour férié | 🟠 Vacances sans solde | 🟡 Autres absences | ⚪ Weekend/Futur
            </small>
          </div>
          <div class="card-body">
            <!-- Légende -->
            <div class="mb-3">
              <span class="badge bg-success me-2">{{ stats.joursAvecHeures }} jours avec heures</span>
              <span class="badge bg-danger me-2">{{ stats.joursSansHeures }} jours sans heures</span>
              <span class="badge bg-info me-2">{{ stats.joursVacances }} jours de vacances</span>
              <span class="badge bg-dark me-2">{{ stats.joursMaladie }} jours de maladie</span>
              <span class="badge bg-primary me-2">{{ stats.joursFeries }} jours fériés</span>
              <span class="badge bg-orange me-2">{{ stats.joursVacancesSansSolde }} vacances sans solde</span>
              <span class="badge bg-warning me-2">{{ stats.joursAutresAbsences }} autres absences</span>
            </div>

            <!-- Calendrier par employé -->
            <div v-for="employe in monitoringData" :key="employe.email" class="mb-4">
              <h6>{{ employe.nom }}</h6>
              <div class="calendar-grid">
                <div 
                  v-for="jour in employe.jours" 
                  :key="jour.date"
                  :class="getJourClass(jour)"
                  :title="getJourTooltip(jour)"
                  class="calendar-day"
                  @click="openEditModal(employe, jour)"
                >
                  <div class="day-number">{{ jour.day }}</div>
                  <div v-if="jour.heures > 0" class="hours-number">{{ jour.heures }}h</div>
                  <div v-else-if="jour.heuresAbsence" class="hours-number">{{ jour.heuresAbsence }}h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal édition jour -->
    <div v-if="editModal.show" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>✏️ Modifier - {{ editModal.employeNom }}</h5>
          <button @click="closeEditModal" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <p><strong>Date:</strong> {{ formatDateFR(editModal.date) }}</p>
          <p><strong>Status actuel:</strong> 
            <span class="badge" :class="getStatusBadgeClass(editModal.currentStatus)">{{ getStatusLabel(editModal.currentStatus) }}</span>
          </p>

          <!-- Choix action -->
          <div class="mb-3">
            <label class="form-label fw-bold">Action:</label>
            <select v-model="editModal.action" class="form-control">
              <option value="heures">🟢 Saisir/Modifier heures</option>
              <option value="vacances">🟦 Vacances</option>
              <option value="maladie">🟥 Maladie</option>
              <option value="jour_ferie">🔵 Jour férié</option>
              <option value="vacances_sans_solde">🟠 Vacances sans solde</option>
              <option value="accident">⚠️ Accident</option>
              <option value="cours">📚 Cours</option>
              <option value="conge_paternite">👶 Congé paternité</option>
              <option value="conge_deces">🕊️ Congé décès</option>
              <option value="absence">🟡 Autre absence</option>
              <option value="supprimer">🗑️ Supprimer données du jour</option>
            </select>
          </div>

          <!-- Mode Heures: gestion multi-chantiers -->
          <div v-if="editModal.action === 'heures'">
            <!-- Enregistrements existants -->
            <div v-if="editModal.existingRecords.length > 0" class="mb-3">
              <label class="form-label fw-bold">Enregistrements existants:</label>
              <div v-for="(rec, idx) in editModal.existingRecords" :key="rec.id" class="d-flex align-items-center gap-2 mb-2 p-2 border rounded">
                <select v-model="rec.chantier_id" class="form-select form-select-sm" style="flex:2">
                  <option value="">Sans chantier</option>
                  <option v-for="ch in chantiersOuverts" :key="ch.id" :value="ch.id">{{ ch.nom }}</option>
                </select>
                <select v-model="rec.heures" class="form-select form-select-sm" style="flex:1">
                  <option v-for="opt in heuresOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <span class="text-muted">h</span>
                <button @click="deleteRecord(rec)" class="btn btn-sm btn-outline-danger">🗑</button>
              </div>
            </div>

            <!-- Ajouter un nouveau record -->
            <div class="mb-3 p-2 border rounded bg-light">
              <label class="form-label fw-bold">Ajouter des heures:</label>
              <div class="d-flex align-items-center gap-2">
                <select v-model="editModal.newChantierId" class="form-select form-select-sm" style="flex:2">
                  <option value="">Chantier...</option>
                  <option v-for="ch in chantiersOuverts" :key="ch.id" :value="ch.id">{{ ch.nom }}</option>
                </select>
                <select v-model="editModal.newHeures" class="form-select form-select-sm" style="flex:1">
                  <option value="">Heures...</option>
                  <option v-for="opt in heuresOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <button @click="addNewRecord" class="btn btn-sm btn-success" :disabled="!editModal.newHeures">+</button>
              </div>
            </div>
          </div>

          <!-- Heures pour absences (vacances, maladie, etc.) -->
          <div v-if="['vacances','maladie','jour_ferie','vacances_sans_solde','accident','cours','conge_paternite','conge_deces','absence'].includes(editModal.action)" class="mb-3">
            <label class="form-label">Heures de la journée (pour calcul solde):</label>
            <select v-model="editModal.heuresAbsence" class="form-control">
              <option :value="8.75">8:45 (lundi-jeudi)</option>
              <option :value="5">5:00 (vendredi)</option>
              <option :value="8">8:00</option>
              <option :value="4">4:00 (demi-journée)</option>
              <option v-for="opt in heuresOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <small class="text-muted">Lun-Jeu: 8h45 | Ven: 5h</small>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditModal" class="btn btn-secondary">Annuler</button>
          <button @click="saveEdit" class="btn btn-primary" :disabled="editModal.saving">
            {{ editModal.saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Détails par employé -->
    <div v-if="monitoringData" class="row mt-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Détail par Employé</h5>
          </div>
          <div class="card-body">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Rôle actuel</th>
                  <th>Jours travaillés</th>
                  <th>Total heures</th>
                  <th>Jours manquants</th>
                  <th>Dernière saisie</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="employe in monitoringData" :key="employe.email">
                  <td>
                    {{ employe.nom }}
                    <small v-if="employe.hasMultipleRoles" class="text-info d-block">
                      🔄 Évolution de rôle détectée
                    </small>
                  </td>
                  <td>
                    <span class="badge" :class="employe.type === 'chef' ? 'bg-primary' : 'bg-secondary'">
                      {{ employe.type === 'chef' ? '👨‍💼 Chef' : '👷 Ouvrier' }}
                    </span>
                  </td>
                  <td>{{ employe.joursTravailles }}</td>
                  <td>{{ employe.totalHeures }}h</td>
                  <td>
                    <span :class="employe.joursManquants > 2 ? 'text-danger fw-bold' : 'text-muted'">
                      {{ employe.joursManquants }}
                    </span>
                  </td>
                  <td>{{ employe.derniereDate || 'Jamais' }}</td>
                  <td>
                    <span v-if="employe.joursManquants === 0" class="badge bg-success">✓ OK</span>
                    <span v-else-if="employe.joursManquants <= 2" class="badge bg-warning">⚠️ Attention</span>
                    <span v-else class="badge bg-danger">🚨 Critique</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
const monitoringData = ref(null);
const availableMonths = ref([]);
const chantiersOuverts = ref([]);

// Modal edit
const editModal = ref({
  show: false,
  employeEmail: '',
  employeNom: '',
  employeType: '',
  date: '',
  currentStatus: '',
  action: 'heures',
  heures: '',
  existingRecords: [],
  saving: false
});

// Options heures
const heuresOptions = (() => {
  const options = [];
  for (let h = 0; h <= 12; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 0 && m === 0) continue;
      if (h === 12 && m > 0) break;
      options.push({ value: h + (m / 60), label: `${h}:${m.toString().padStart(2, '0')}` });
    }
  }
  return options;
})();

const openEditModal = async (employe, jour) => {
  // Bloquer les dates futures (sauf vacances réservées visibles)
  const today = new Date().toISOString().split('T')[0];
  if (jour.date > today) {
    alert('Impossible de modifier une date future. Seules les réservations de vacances sont possibles depuis la page Gestion Absences.');
    return;
  }

  // Bloquer les weekends
  const dayOfWeek = new Date(jour.date).getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    alert('Impossible de modifier un weekend.');
    return;
  }

  // Déterminer heures par défaut selon le jour de la semaine
  const defaultHeuresAbsence = (dayOfWeek >= 1 && dayOfWeek <= 4) ? 8.75 : 5;
  
  // Toujours charger les chantiers pour pouvoir modifier
  if (chantiersOuverts.value.length === 0) {
    const { data } = await supabase.from('chantiers').select('id, nom');
    chantiersOuverts.value = data || [];
  }
  const needsChantier = true;
  
  editModal.value = {
    show: true,
    employeEmail: employe.email,
    employeNom: employe.nom,
    employeType: employe.type,
    date: jour.date,
    currentStatus: jour.status,
    action: ['heures','vacances','maladie','jour_ferie','vacances_sans_solde','accident','cours','conge_paternite','conge_deces','absence'].includes(jour.status) ? jour.status : 'heures',
    heures: jour.heures || '',
    heuresAbsence: defaultHeuresAbsence,
    needsChantier: true,
    newChantierId: '',
    newHeures: '',
    existingRecords: [],
    saving: false
  };
  // Carica record esistenti (setta anche chantierId)
  await loadExistingRecords(employe.email, jour.date);
};

const closeEditModal = () => {
  editModal.value.show = false;
};

const loadExistingRecords = async (email, date) => {
  const records = [];
  
  const { data: chefRecs } = await supabase.from('heures_chef_propres').select('*').eq('chef_id', email).eq('date', date);
  (chefRecs || []).forEach(r => {
    records.push({ id: r.id, table: 'heures_chef_propres', heures: r.total_heures || r.heures_normales, chantier_id: r.chantier_id || '' });
  });
  
  const { data: interimRecs } = await supabase.from('heures_chef_interim').select('*').eq('chef_id', email).eq('date', date);
  (interimRecs || []).forEach(r => {
    records.push({ id: r.id, table: 'heures_chef_interim', heures: r.total_heures || r.heures_normales, chantier_id: r.chantier_id || '' });
  });
  
  const { data: ouvrierRecs } = await supabase.from('heures_ouvriers').select('*').eq('ouvrier_id', email).eq('date', date);
  (ouvrierRecs || []).forEach(r => {
    records.push({ id: r.id, table: 'heures_ouvriers', heures: r.heures, chantier_id: r.chantier_id || '' });
  });
  
  editModal.value.existingRecords = records;
};

const deleteRecord = async (rec) => {
  if (!confirm('Supprimer cet enregistrement ?')) return;
  await supabase.from(rec.table).delete().eq('id', rec.id);
  await loadExistingRecords(editModal.value.employeEmail, editModal.value.date);
};

const addNewRecord = async () => {
  const { employeEmail, employeType, date, newHeures, newChantierId } = editModal.value;
  if (!newHeures) return;

  // Détecter la bonne table
  const { data: checkOuvrier } = await supabase.from('heures_ouvriers').select('id').eq('ouvrier_id', employeEmail).limit(1);
  const { data: checkChef } = await supabase.from('heures_chef_propres').select('id').eq('chef_id', employeEmail).limit(1);
  const useOuvrierTable = (checkOuvrier && checkOuvrier.length > 0) || (!checkChef || checkChef.length === 0 && employeType === 'ouvrier');

  if (!useOuvrierTable) {
    await supabase.from('heures_chef_propres').insert({ chef_id: employeEmail, date, heures_normales: newHeures, total_heures: newHeures, chantier_id: newChantierId || null });
  } else {
    const insertData = { ouvrier_id: employeEmail, date, heures: newHeures };
    if (newChantierId) insertData.chantier_id = newChantierId;
    await supabase.from('heures_ouvriers').insert(insertData);
  }

  editModal.value.newHeures = '';
  editModal.value.newChantierId = '';
  await loadExistingRecords(employeEmail, date);
};

const saveEdit = async () => {
  editModal.value.saving = true;
  const { employeEmail, employeType, date, action } = editModal.value;
  
  try {
    if (action === 'supprimer') {
      // Supprimer toutes les heures du jour
      for (const rec of editModal.value.existingRecords) {
        await supabase.from(rec.table).delete().eq('id', rec.id);
      }
      // Supprimer absences du jour
      await supabase.from('absences').delete().eq('user_id', employeEmail).eq('start_date', date).eq('end_date', date);
      const { data: multiAbs } = await supabase.from('absences').select('*').eq('user_id', employeEmail).lte('start_date', date).gte('end_date', date);
      for (const abs of (multiAbs || [])) {
        await supabase.from('absences').delete().eq('id', abs.id);
        if (abs.start_date < date) {
          const prev = new Date(date); prev.setDate(prev.getDate() - 1);
          await supabase.from('absences').insert({ user_id: employeEmail, start_date: abs.start_date, end_date: prev.toISOString().split('T')[0], type: abs.type, status: 'approved', heures: abs.heures });
        }
        if (abs.end_date > date) {
          const next = new Date(date); next.setDate(next.getDate() + 1);
          await supabase.from('absences').insert({ user_id: employeEmail, start_date: next.toISOString().split('T')[0], end_date: abs.end_date, type: abs.type, status: 'approved', heures: abs.heures });
        }
      }
      
    } else if (action === 'heures') {
      // Mettre à jour les records existants (heures + chantier modifiés inline)
      for (const rec of editModal.value.existingRecords) {
        if (rec.table === 'heures_chef_propres') {
          await supabase.from(rec.table).update({ total_heures: rec.heures, heures_normales: rec.heures, chantier_id: rec.chantier_id || null }).eq('id', rec.id);
        } else if (rec.table === 'heures_chef_interim') {
          await supabase.from(rec.table).update({ total_heures: rec.heures, chantier_id: rec.chantier_id || null }).eq('id', rec.id);
        } else {
          await supabase.from(rec.table).update({ heures: rec.heures, chantier_id: rec.chantier_id || null }).eq('id', rec.id);
        }
      }
      // Supprimer absence éventuelle du jour
      await supabase.from('absences').delete().eq('user_id', employeEmail).eq('start_date', date).eq('end_date', date);
      const { data: multiAbsH } = await supabase.from('absences').select('*').eq('user_id', employeEmail).lte('start_date', date).gte('end_date', date);
      for (const abs of (multiAbsH || [])) {
        await supabase.from('absences').delete().eq('id', abs.id);
        if (abs.start_date < date) {
          const prev = new Date(date); prev.setDate(prev.getDate() - 1);
          await supabase.from('absences').insert({ user_id: employeEmail, start_date: abs.start_date, end_date: prev.toISOString().split('T')[0], type: abs.type, status: 'approved', heures: abs.heures });
        }
        if (abs.end_date > date) {
          const next = new Date(date); next.setDate(next.getDate() + 1);
          await supabase.from('absences').insert({ user_id: employeEmail, start_date: next.toISOString().split('T')[0], end_date: abs.end_date, type: abs.type, status: 'approved', heures: abs.heures });
        }
      }
      
    } else {
      // Vacances, maladie, absence - supprimer heures existantes
      for (const rec of editModal.value.existingRecords) {
        await supabase.from(rec.table).delete().eq('id', rec.id);
      }
      // Supprimer ancienne absence du jour
      await supabase.from('absences').delete().eq('user_id', employeEmail).eq('start_date', date).eq('end_date', date);
      const { data: multiDayAbs } = await supabase.from('absences').select('*').eq('user_id', employeEmail).lte('start_date', date).gte('end_date', date);
      for (const abs of (multiDayAbs || [])) {
        await supabase.from('absences').delete().eq('id', abs.id);
        if (abs.start_date < date) {
          const newEnd = new Date(date); newEnd.setDate(newEnd.getDate() - 1);
          const newEndStr = newEnd.toISOString().split('T')[0];
          if (newEndStr >= abs.start_date) {
            await supabase.from('absences').insert({ user_id: employeEmail, start_date: abs.start_date, end_date: newEndStr, type: abs.type, status: 'approved', heures: abs.heures });
          }
        }
        if (abs.end_date > date) {
          const newStart = new Date(date); newStart.setDate(newStart.getDate() + 1);
          const newStartStr = newStart.toISOString().split('T')[0];
          if (newStartStr <= abs.end_date) {
            await supabase.from('absences').insert({ user_id: employeEmail, start_date: newStartStr, end_date: abs.end_date, type: abs.type, status: 'approved', heures: abs.heures });
          }
        }
      }
      // Insérer absence
      await supabase.from('absences').insert({ user_id: employeEmail, start_date: date, end_date: date, type: action, status: 'approved', heures: editModal.value.heuresAbsence || 8.75 });
    }
    
    closeEditModal();
    await loadMonitoringData();
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    alert('Erreur: ' + error.message);
  } finally {
    editModal.value.saving = false;
  }
};

const formatDateFR = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const getStatusBadgeClass = (status) => {
  const map = { heures: 'bg-success', manquant: 'bg-danger', vacances: 'bg-info', maladie: 'bg-dark', jour_ferie: 'bg-primary', vacances_sans_solde: 'bg-orange', conge_paternite: 'bg-teal', conge_deces: 'bg-dark', absence: 'bg-warning', weekend: 'bg-light text-dark', future: 'bg-secondary' };
  return map[status] || 'bg-light';
};

const getStatusLabel = (status) => {
  const map = { heures: 'Heures saisies', manquant: 'Pas d\'heures', vacances: 'Vacances', maladie: 'Maladie', jour_ferie: 'Jour férié', vacances_sans_solde: 'Vacances sans solde', conge_paternite: 'Congé paternité', conge_deces: 'Congé décès', absence: 'Absence', weekend: 'Weekend', future: 'Futur' };
  return map[status] || status;
};

const alerts = computed(() => {
  if (!monitoringData.value) return [];
  return monitoringData.value
    .filter(emp => emp.joursManquants > 2)
    .map(emp => ({
      email: emp.email,
      nom: emp.nom,
      joursManquants: emp.joursManquants,
      derniereDate: emp.derniereDate
    }));
});

const stats = computed(() => {
  if (!monitoringData.value) return { 
    joursAvecHeures: 0, 
    joursSansHeures: 0, 
    joursVacances: 0, 
    joursMaladie: 0, 
    joursFeries: 0,
    joursVacancesSansSolde: 0,
    joursAutresAbsences: 0 
  };
  
  let joursAvecHeures = 0;
  let joursSansHeures = 0;
  let joursVacances = 0;
  let joursMaladie = 0;
  let joursFeries = 0;
  let joursVacancesSansSolde = 0;
  let joursAutresAbsences = 0;
  
  monitoringData.value.forEach(emp => {
    emp.jours.forEach(jour => {
      if (jour.status === 'heures') joursAvecHeures++;
      else if (jour.status === 'manquant') joursSansHeures++;
      else if (jour.status === 'vacances') joursVacances++;
      else if (jour.status === 'maladie') joursMaladie++;
      else if (jour.status === 'jour_ferie') joursFeries++;
      else if (jour.status === 'vacances_sans_solde') joursVacancesSansSolde++;
      else if (jour.status === 'absence') joursAutresAbsences++;
    });
  });
  
  return { joursAvecHeures, joursSansHeures, joursVacances, joursMaladie, joursFeries, joursVacancesSansSolde, joursAutresAbsences };
});

const loadMonitoringData = async () => {
  try {
    const [year, month] = selectedMonth.value.split('-');
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    
    // Carica dipendenti
    const { data: collaborateurs } = await supabase.from('collaborateurs').select('*');
    const { data: chefs } = await supabase.from('chefdechantiers').select('*');
    
    const employes = [
      ...(chefs || []).filter(c => !c.excludeFromReport && c.actif !== false).map(c => ({ 
        email: c.email, 
        nom: `${c.nom} ${c.prenom}`, 
        type: 'chef' 
      })),
      ...(collaborateurs || []).filter(c => !c.excludeFromReport && c.actif !== false).map(c => ({ 
        email: c.email, 
        nom: `${c.nom} ${c.prenom}`, 
        type: 'ouvrier' 
      }))
    ];
    
    // Carica ore con debug
    const { data: heuresChef } = await supabase.from('heures_chef_propres').select('*');
    const { data: heuresInterim } = await supabase.from('heures_chef_interim').select('*');
    const { data: heuresOuvriers } = await supabase.from('heures_ouvriers').select('*');
    
    // Calcola mesi disponibili
    const allDates = [
      ...(heuresChef || []).map(h => h.date),
      ...(heuresInterim || []).map(h => h.date),
      ...(heuresOuvriers || []).map(h => h.date)
    ];
    const months = [...new Set(allDates.map(date => date.substring(0, 7)))].sort().reverse();
    availableMonths.value = months;
    
    console.log('Caricamento ore per', employes.length, 'dipendenti nel mese:', selectedMonth.value);
    console.log('Mesi disponibili:', months);
    
    // Debug evoluzione ruoli
    console.log('🔄 GESTIONE EVOLUZIONE RUOLI:');
    
    // Verifica ore per ogni dipendente in tutte le tabelle
    employes.forEach(emp => {
      const oreChef = (heuresChef || []).filter(h => h.chef_id === emp.email);
      const oreInterim = (heuresInterim || []).filter(h => h.chef_id === emp.email);
      const oreOuvrier = (heuresOuvriers || []).filter(h => h.ouvrier_id === emp.email);
      
      const totaleOre = oreChef.length + oreInterim.length + oreOuvrier.length;
      
      if (totaleOre > 0) {
        console.log(`👤 ${emp.nom} (attuale: ${emp.type}):`);
        if (oreChef.length > 0) console.log(`  📊 Chef: ${oreChef.length} record`);
        if (oreInterim.length > 0) console.log(`  📊 Interim: ${oreInterim.length} record`);
        if (oreOuvrier.length > 0) console.log(`  📊 Ouvrier: ${oreOuvrier.length} record`);
        
        const mesiTotali = [...new Set([
          ...oreChef.map(h => h.date.substring(0, 7)),
          ...oreInterim.map(h => h.date.substring(0, 7)),
          ...oreOuvrier.map(h => h.date.substring(0, 7))
        ])].sort();
        console.log(`  📅 Mesi attivi: ${mesiTotali.join(', ')}`);
      }
    });
    
    // Carica assenze approvate
    const { data: absences } = await supabase
      .from('absences')
      .select('*')
      .eq('status', 'approved');
    
    // Genera dati monitoring
    const monitoring = [];
    
    for (const employe of employes) {
      // Verifica evoluzione ruoli
      const oreChefTotali = (heuresChef || []).filter(h => h.chef_id === employe.email);
      const oreOuvrierTotali = (heuresOuvriers || []).filter(h => h.ouvrier_id === employe.email);
      const hasMultipleRoles = oreChefTotali.length > 0 && oreOuvrierTotali.length > 0;
      
      const employeData = {
        email: employe.email,
        nom: employe.nom,
        type: employe.type,
        hasMultipleRoles,
        jours: [],
        joursTravailles: 0,
        totalHeures: 0,
        joursManquants: 0,
        derniereDate: null
      };
      
      // Genera giorni del mese
      const daysInMonth = new Date(year, month, 0).getDate();
      const today = new Date();
      today.setHours(23, 59, 59);
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isFuture = currentDate > today;
        
        let hasAbsence = false;
        
        // Controlla ore - CERCA SIA COME CHEF CHE COME OUVRIER per gestire evoluzioni ruolo
        let heuresJour = 0;
        
        // Ore come chef
        const heuresChefJour = (heuresChef || []).filter(h => h.date === dateStr && h.chef_id === employe.email);
        const heuresInterimJour = (heuresInterim || []).filter(h => h.date === dateStr && h.chef_id === employe.email);
        heuresJour += heuresChefJour.reduce((sum, h) => sum + (h.total_heures || h.heures_normales || 0), 0);
        heuresJour += heuresInterimJour.reduce((sum, h) => sum + (h.total_heures || h.heures || 0), 0);
        
        // Ore come ouvrier (per gestire evoluzioni di ruolo)
        const heuresOuvriersJour = (heuresOuvriers || []).filter(h => h.date === dateStr && h.ouvrier_id === employe.email);
        heuresJour += heuresOuvriersJour.reduce((sum, h) => sum + (h.heures || 0), 0);
        
        // Controlla assenze approvate
        const absenceJour = (absences || []).find(a => 
          a.user_id === employe.email &&
          a.start_date <= dateStr && 
          a.end_date >= dateStr
        );
        hasAbsence = !!absenceJour;
        
        // Determina status
        let status = 'weekend';
        if (isWeekend) {
          status = 'weekend';
        } else if (hasAbsence) {
          // Distingui tipo di assenza (anche futura)
          if (absenceJour.type === 'vacances') {
            status = 'vacances';
          } else if (absenceJour.type === 'maladie') {
            status = 'maladie';
          } else if (absenceJour.type === 'jour_ferie') {
            status = 'jour_ferie';
          } else if (absenceJour.type === 'vacances_sans_solde') {
            status = 'vacances_sans_solde';
          } else if (absenceJour.type === 'conge_paternite') {
            status = 'conge_paternite';
          } else if (absenceJour.type === 'conge_deces') {
            status = 'conge_deces';
          } else {
            status = 'absence';
          }
        } else if (isFuture) {
          status = 'future';
        } else if (heuresJour > 0) {
          status = 'heures';
          employeData.joursTravailles++;
          employeData.totalHeures += heuresJour;
          employeData.derniereDate = dateStr;
        } else {
          status = 'manquant';
          employeData.joursManquants++;
        }
        
        employeData.jours.push({
          date: dateStr,
          day: day,
          status,
          heures: heuresJour,
          heuresAbsence: hasAbsence ? (absenceJour.heures || null) : null,
          absence: hasAbsence ? absenceJour.type : null
        });
      }
      
      // Formatta ultima data
      if (employeData.derniereDate) {
        employeData.derniereDate = new Date(employeData.derniereDate).toLocaleDateString('fr-FR');
      }
      
      monitoring.push(employeData);
    }
    
    // Log finale per verifica
    console.log('\n📊 RIEPILOGO FINALE MESE', selectedMonth.value, ':');
    monitoring.forEach(emp => {
      if (emp.totalHeures > 0) {
        console.log(`✅ ${emp.nom}: ${emp.totalHeures}h in ${emp.joursTravailles} giorni`);
      } else {
        console.log(`⚪ ${emp.nom}: 0 ore questo mese`);
      }
    });
    
    monitoringData.value = monitoring;
    
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
  }
};

const getJourClass = (jour) => {
  const baseClass = 'calendar-day';
  switch (jour.status) {
    case 'heures': return `${baseClass} bg-success text-white`;
    case 'manquant': return `${baseClass} bg-danger text-white`;
    case 'vacances': return `${baseClass} bg-info text-white`;
    case 'maladie': return `${baseClass} bg-dark text-white`;
    case 'conge_paternite': return `${baseClass} conge-paternite text-white`;
    case 'conge_deces': return `${baseClass} conge-deces text-white`;
    case 'jour_ferie': return `${baseClass} bg-primary text-white`;
    case 'vacances_sans_solde': return `${baseClass} jour-ferie-sans-solde text-white`;
    case 'absence': return `${baseClass} bg-warning text-dark`;
    case 'weekend': return `${baseClass} bg-light text-muted`;
    case 'future': return `${baseClass} bg-secondary text-white`;
    default: return baseClass;
  }
};

const getJourTooltip = (jour) => {
  const date = new Date(jour.date).toLocaleDateString('fr-FR');
  switch (jour.status) {
    case 'heures': return `${date}: ${jour.heures}h travaillées`;
    case 'manquant': return `${date}: Aucune heure saisie`;
    case 'vacances': return `${date}: Vacances`;
    case 'maladie': return `${date}: Maladie`;
    case 'conge_paternite': return `${date}: Congé paternité`;
    case 'conge_deces': return `${date}: Congé décès`;
    case 'jour_ferie': return `${date}: Jour férié`;
    case 'vacances_sans_solde': return `${date}: Vacances sans solde`;
    case 'absence': return `${date}: Absence (${jour.absence || 'autre'})`;
    case 'weekend': return `${date}: Weekend`;
    case 'future': return `${date}: Date future`;
    default: return date;
  }
};

const formatMonth = (monthStr) => {
  const [year, month] = monthStr.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
};

onMounted(() => {
  loadMonitoringData();
});
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
  gap: 2px;
  margin-bottom: 15px;
}

.calendar-day {
  width: 38px;
  height: 38px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  border: 1px solid #ddd;
  padding: 2px;
}

.day-number {
  font-size: 12px;
  line-height: 1;
}

.hours-number {
  font-size: 9px;
  line-height: 1;
  margin-top: 1px;
  opacity: 0.9;
}

.calendar-day:hover {
  transform: scale(1.1);
  z-index: 10;
  position: relative;
}

.calendar-day.bg-info {
  background: linear-gradient(135deg, #0dcaf0, #20c997) !important;
}

.calendar-day.bg-dark {
  background: linear-gradient(135deg, #6f42c1, #d63384) !important;
}

.calendar-day.jour-ferie-sans-solde {
  background: #fd7e14 !important;
}

.calendar-day.bg-teal {
  background: #20c997 !important;
}

.calendar-day.conge-paternite {
  background: #e83e8c !important;
}

.calendar-day.conge-deces {
  background: #6f42c1 !important;
}

.badge.bg-orange {
  background-color: #fd7e14 !important;
  color: white;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #dee2e6;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>