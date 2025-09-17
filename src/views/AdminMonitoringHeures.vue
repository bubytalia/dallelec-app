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
              🟢 Heures saisies | 🔴 Pas d'heures | 🟡 Absence | ⚪ Weekend/Futur
            </small>
          </div>
          <div class="card-body">
            <!-- Légende -->
            <div class="mb-3">
              <span class="badge bg-success me-2">{{ stats.joursAvecHeures }} jours avec heures</span>
              <span class="badge bg-danger me-2">{{ stats.joursSansHeures }} jours sans heures</span>
              <span class="badge bg-warning me-2">{{ stats.joursAbsence }} jours d'absence</span>
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
                  {{ jour.day }}
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
                  <th>Jours travaillés</th>
                  <th>Total heures</th>
                  <th>Jours manquants</th>
                  <th>Dernière saisie</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="employe in monitoringData" :key="employe.email">
                  <td>{{ employe.nom }}</td>
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
  if (!monitoringData.value) return { joursAvecHeures: 0, joursSansHeures: 0, joursAbsence: 0 };
  
  let joursAvecHeures = 0;
  let joursSansHeures = 0;
  let joursAbsence = 0;
  
  monitoringData.value.forEach(emp => {
    emp.jours.forEach(jour => {
      if (jour.status === 'heures') joursAvecHeures++;
      else if (jour.status === 'manquant') joursSansHeures++;
      else if (jour.status === 'absence') joursAbsence++;
    });
  });
  
  return { joursAvecHeures, joursSansHeures, joursAbsence };
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
    
    // Carica ore
    const { data: heuresChef } = await supabase.from('heures_chef_propres').select('*');
    const { data: heuresInterim } = await supabase.from('heures_chef_interim').select('*');
    const { data: heuresOuvriers } = await supabase.from('heures_ouvriers').select('*');
    
    // Carica assenze
    const { data: absences } = await supabase.from('absences').select('*');
    
    // Genera dati monitoring
    const monitoring = [];
    
    for (const employe of employes) {
      const employeData = {
        email: employe.email,
        nom: employe.nom,
        type: employe.type,
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
        
        let heuresJour = 0;
        let hasAbsence = false;
        
        // Controlla ore
        if (employe.type === 'chef') {
          const heuresChefJour = (heuresChef || []).filter(h => h.date === dateStr && h.chefId === employe.email);
          const heuresInterimJour = (heuresInterim || []).filter(h => h.date === dateStr && h.chefId === employe.email);
          heuresJour = heuresChefJour.reduce((sum, h) => sum + (h.heuresPropres || 0), 0) +
                      heuresInterimJour.reduce((sum, h) => sum + (h.heuresInterim || 0), 0);
        } else {
          const heuresOuvriersJour = (heuresOuvriers || []).filter(h => h.date === dateStr && h.ouvrierId === employe.email);
          heuresJour = heuresOuvriersJour.reduce((sum, h) => sum + (h.heures || 0), 0);
        }
        
        // Controlla assenze
        const absenceJour = (absences || []).find(a => 
          a.userId === employe.email &&
          a.startDate <= dateStr && 
          a.endDate >= dateStr
        );
        hasAbsence = !!absenceJour;
        
        // Determina status
        let status = 'weekend';
        if (isFuture) {
          status = 'future';
        } else if (hasAbsence) {
          status = 'absence';
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
    case 'absence': return `${date}: Absence (${jour.absence})`;
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
  grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
  gap: 2px;
  margin-bottom: 15px;
}

.calendar-day {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  border: 1px solid #ddd;
}

.calendar-day:hover {
  transform: scale(1.1);
  z-index: 10;
  position: relative;
}
</style>