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
              🟢 Heures saisies | 🔴 Pas d'heures | 🟦 Vacances | 🟥 Maladie | 🟡 Autres absences | ⚪ Weekend/Futur
            </small>
          </div>
          <div class="card-body">
            <!-- Légende -->
            <div class="mb-3">
              <span class="badge bg-success me-2">{{ stats.joursAvecHeures }} jours avec heures</span>
              <span class="badge bg-danger me-2">{{ stats.joursSansHeures }} jours sans heures</span>
              <span class="badge bg-info me-2">{{ stats.joursVacances }} jours de vacances</span>
              <span class="badge bg-dark me-2">{{ stats.joursMaladie }} jours de maladie</span>
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
                >
                  <div class="day-number">{{ jour.day }}</div>
                  <div v-if="jour.heures > 0" class="hours-number">{{ jour.heures }}h</div>
                </div>
              </div>
            </div>
          </div>
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

const selectedMonth = ref('2025-10'); // Cambiato per vedere le ore di Tony
const monitoringData = ref(null);
const availableMonths = ref([]);

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
    joursAutresAbsences: 0 
  };
  
  let joursAvecHeures = 0;
  let joursSansHeures = 0;
  let joursVacances = 0;
  let joursMaladie = 0;
  let joursAutresAbsences = 0;
  
  monitoringData.value.forEach(emp => {
    emp.jours.forEach(jour => {
      if (jour.status === 'heures') joursAvecHeures++;
      else if (jour.status === 'manquant') joursSansHeures++;
      else if (jour.status === 'vacances') joursVacances++;
      else if (jour.status === 'maladie') joursMaladie++;
      else if (jour.status === 'absence') joursAutresAbsences++;
    });
  });
  
  return { joursAvecHeures, joursSansHeures, joursVacances, joursMaladie, joursAutresAbsences };
});

const loadMonitoringData = async () => {
  try {
    const [year, month] = selectedMonth.value.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    // Carica dipendenti
    const { data: collaborateurs } = await supabase.from('collaborateurs').select('*');
    const { data: chefs } = await supabase.from('chefdechantiers').select('*');
    
    const employes = [
      ...(chefs || []).filter(c => !c.excludeFromReport).map(c => ({ 
        email: c.email, 
        nom: `${c.nom} ${c.prenom}`, 
        type: 'chef' 
      })),
      ...(collaborateurs || []).filter(c => !c.excludeFromReport).map(c => ({ 
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
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);
      const today = new Date();
      
      while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split('T')[0];
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
        if (isFuture) {
          status = 'future';
        } else if (hasAbsence) {
          // Distingui tipo di assenza
          if (absenceJour.type === 'vacances') {
            status = 'vacances';
          } else if (absenceJour.type === 'maladie') {
            status = 'maladie';
          } else {
            status = 'absence';
          }
        } else if (heuresJour > 0) {
          status = 'heures';
          employeData.joursTravailles++;
          employeData.totalHeures += heuresJour;
          employeData.derniereDate = dateStr;
        } else if (!isWeekend) {
          status = 'manquant';
          employeData.joursManquants++;
        }
        
        employeData.jours.push({
          date: dateStr,
          day: currentDate.getDate(),
          status,
          heures: heuresJour,
          absence: hasAbsence ? absenceJour.type : null
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
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
    case 'vacances': return `${date}: Vacances (${jour.absence || 'approuvées'})`;
    case 'maladie': return `${date}: Maladie (${jour.absence || 'approuvée'})`;
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

/* Stili specifici per vacanze e malattie */
.calendar-day.bg-info {
  background: linear-gradient(135deg, #0dcaf0, #20c997) !important;
}

.calendar-day.bg-dark {
  background: linear-gradient(135deg, #6f42c1, #d63384) !important;
}
</style>