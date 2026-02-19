<template>
  <div class="container py-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <button @click="$router.push('/chef')" class="btn btn-outline-secondary">
        ← Retour
      </button>
      <button @click="logout" class="btn btn-outline-danger">Déconnexion</button>
    </div>
    
    <h2 class="text-center mb-4">Saisie des Heures - Chef</h2>
    
    <div class="row">
      <!-- Mes heures propres -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Mes heures propres</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label>Chantier:</label>
              <select v-model="newHeure.chantierId" class="form-control" required>
                <option value="">Sélectionner un chantier</option>
                <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                  {{ chantier.nom }} - {{ chantier.adresse }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label>Date:</label>
              <input v-model="newHeure.date" type="date" class="form-control" />
            </div>
            <div class="mb-3">
              <label>Heures propres:</label>
              <select v-model="newHeure.heures" class="form-control">
                <option value="">Sélectionner les heures</option>
                <option v-for="option in heuresOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <button @click="addHeurePropre" class="btn btn-primary" :disabled="!newHeure.chantierId">
              Ajouter mes heures
            </button>
          </div>
        </div>
      </div>
      
      <!-- Heures intérimaires -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Heures intérimaires</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label>Chantier:</label>
              <select v-model="newHeureInterim.chantierId" class="form-control" required>
                <option value="">Sélectionner un chantier</option>
                <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                  {{ chantier.nom }} - {{ chantier.adresse }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label>Date:</label>
              <input v-model="newHeureInterim.date" type="date" class="form-control" />
            </div>
            <div class="mb-3">
              <label>Intérimaire:</label>
              <select v-model="newHeureInterim.interimaireId" class="form-control">
                <option value="">Sélectionner un intérimaire</option>
                <option v-for="interimaire in interimaires" :key="interimaire.id" :value="interimaire.id">
                  {{ interimaire.nom }} {{ interimaire.prenom }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label>Heures intérimaires:</label>
              <select v-model="newHeureInterim.heures" class="form-control">
                <option value="">Sélectionner les heures</option>
                <option v-for="option in heuresOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <button @click="addHeureInterim" class="btn btn-success" :disabled="!newHeureInterim.chantierId">
              Ajouter heures intérim
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des heures -->
    <div class="row mt-4">
      <div class="col-md-6">
        <h5>Mes heures propres</h5>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Chantier</th>
              <th>Date</th>
              <th>Heures</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="heure in heuresPropres" :key="heure.id">
              <td>{{ getChantierName(heure.chantier_id) }}</td>
              <td>{{ formatDate(heure.date) }}</td>
              <td>{{ heure.total_heures }}</td>
              <td>
                <button 
                  v-if="isCurrentWeek(heure.date)"
                  @click="deleteHeure(heure.id, 'propres')" 
                  class="btn btn-danger btn-sm"
                >
                  🗑
                </button>
                <span v-else class="badge bg-secondary" title="Semaine verrouillée">🔒</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="col-md-6">
        <h5>Heures intérimaires</h5>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Chantier</th>
              <th>Date</th>
              <th>Intérimaire</th>
              <th>Heures</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="heure in heuresInterim" :key="heure.id">
              <td>{{ getChantierName(heure.chantier_id) }}</td>
              <td>{{ formatDate(heure.date) }}</td>
              <td>{{ heure.interinaire_nom }}</td>
              <td>{{ heure.total_heures }}</td>
              <td>
                <button 
                  v-if="isCurrentWeek(heure.date)"
                  @click="deleteHeure(heure.id, 'interim')" 
                  class="btn btn-danger btn-sm"
                >
                  🗑
                </button>
                <span v-else class="badge bg-secondary" title="Semaine verrouillée">🔒</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase.js';

const router = useRouter();
const interimaires = ref([]);
const chantiers = ref([]);
const heuresPropres = ref([]);
const heuresInterim = ref([]);

// Funzione per ottenere inizio settimana corrente (Lunedì 00:00)
const getStartOfCurrentWeek = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Verifica se una data è nella settimana corrente
const isCurrentWeek = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const startOfWeek = getStartOfCurrentWeek();
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return date >= startOfWeek && date <= endOfWeek;
};

// Options heures avec format HH:MM (incrementi di 15 minuti)
const heuresOptions = ref([]);

// Genera opzioni da 0:15 a 12:00 con incrementi di 15 minuti
const generateHeuresOptions = () => {
  const options = [];
  for (let h = 0; h <= 12; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 0 && m === 0) continue; // Skip 0:00
      if (h === 12 && m > 0) break; // Stop at 12:00
      
      const heuresDecimal = h + (m / 60);
      const heuresFormatted = `${h}:${m.toString().padStart(2, '0')}`;
      
      options.push({
        value: heuresDecimal,
        label: heuresFormatted
      });
    }
  }
  return options;
};

const newHeure = ref({
  chantierId: '',
  date: new Date().toISOString().split('T')[0],
  heures: ''
});

const newHeureInterim = ref({
  chantierId: '',
  date: new Date().toISOString().split('T')[0],
  interimaireId: '',
  heures: ''
});

const logout = async () => {
  try {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push('/');
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};

const fetchInterimaires = async () => {
  try {
    const { data, error } = await supabase.from('interimaires').select('*');
    if (error) throw error;
    interimaires.value = data || [];
  } catch (error) {
    console.error('Erreur chargement interimaires:', error);
  }
};

const fetchChantiers = async () => {
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .select('*')
      .eq('etat_insertion_heures', 'ouvert');
    
    if (error) throw error;
    chantiers.value = data || [];
  } catch (error) {
    console.error('Erreur chargement chantiers:', error);
  }
};

const fetchHeuresPropres = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const { data, error } = await supabase
      .from('heures_chef_propres')
      .select('*')
      .eq('chef_id', userEmail)
      .order('date', { ascending: false });
    
    if (error) throw error;
    heuresPropres.value = data || [];
  } catch (error) {
    console.error('Erreur chargement heures propres:', error);
  }
};

const fetchHeuresInterim = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const { data, error } = await supabase
      .from('heures_chef_interim')
      .select('*')
      .eq('chef_id', userEmail)
      .order('date', { ascending: false });
    
    if (error) throw error;
    heuresInterim.value = data || [];
  } catch (error) {
    console.error('Erreur chargement heures interim:', error);
  }
};

const addHeurePropre = async () => {
  const userEmail = localStorage.getItem('userEmail');
  if (!newHeure.value.chantierId || !newHeure.value.date || !newHeure.value.heures || !userEmail) return;
  
  try {
    // Récupérer la tariffa attuale del chef
    const { data: chefData, error: chefError } = await supabase
      .from('collaborateurs')
      .select('cout_horaire')
      .eq('email', userEmail)
      .single();
    
    const tarifActuel = chefData?.cout_horaire || 45; // fallback
    
    const { error } = await supabase
      .from('heures_chef_propres')
      .insert([{
        chantier_id: newHeure.value.chantierId,
        date: newHeure.value.date,
        heures_normales: newHeure.value.heures,
        total_heures: newHeure.value.heures,
        chef_id: userEmail,
        tarif_utilise: tarifActuel
      }]);
    
    if (error) throw error;
    
    newHeure.value = {
      chantierId: '',
      date: new Date().toISOString().split('T')[0],
      heures: ''
    };
    fetchHeuresPropres();
  } catch (error) {
    console.error('Erreur ajout heure propre:', error);
    alert('Erreur: ' + error.message);
  }
};

const addHeureInterim = async () => {
  const userEmail = localStorage.getItem('userEmail');
  if (!newHeureInterim.value.chantierId || !newHeureInterim.value.date || !newHeureInterim.value.interimaireId || !newHeureInterim.value.heures || !userEmail) return;
  
  try {
    // Récupérer la tariffa attuale dell'intérimaire
    const { data: interimData, error: interimError } = await supabase
      .from('interimaires')
      .select('tarif_horaire')
      .eq('id', newHeureInterim.value.interimaireId)
      .single();
    
    const tarifActuel = interimData?.tarif_horaire || 35; // fallback
    
    const { error } = await supabase
      .from('heures_chef_interim')
      .insert([{
        chantier_id: newHeureInterim.value.chantierId,
        date: newHeureInterim.value.date,
        interinaire_nom: getInterimaireName(newHeureInterim.value.interimaireId),
        heures_normales: newHeureInterim.value.heures,
        total_heures: newHeureInterim.value.heures,
        chef_id: userEmail,
        tarif_utilise: tarifActuel
      }]);
    
    if (error) throw error;
    
    newHeureInterim.value = {
      chantierId: '',
      date: new Date().toISOString().split('T')[0],
      interimaireId: '',
      heures: ''
    };
    fetchHeuresInterim();
  } catch (error) {
    console.error('Erreur ajout heure interim:', error);
    alert('Erreur: ' + error.message);
  }
};

const deleteHeure = async (id, type) => {
  if (confirm('Confirmer la suppression ?')) {
    try {
      const tableName = type === 'propres' ? 'heures_chef_propres' : 'heures_chef_interim';
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      
      if (error) throw error;
      
      if (type === 'propres') {
        fetchHeuresPropres();
      } else {
        fetchHeuresInterim();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur: ' + error.message);
    }
  }
};

const getChantierName = (id) => {
  const chantier = chantiers.value.find(c => c.id == id);
  return chantier ? `${chantier.nom} - ${chantier.adresse}` : '-';
};

const getInterimaireName = (id) => {
  const interimaire = interimaires.value.find(i => i.id == id);
  return interimaire ? `${interimaire.nom} ${interimaire.prenom}` : '-';
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

onMounted(() => {
  // Genera opzioni ore
  heuresOptions.value = generateHeuresOptions();
  
  fetchInterimaires();
  fetchChantiers();
  fetchHeuresPropres();
  fetchHeuresInterim();
});
</script>

<style scoped>
.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>