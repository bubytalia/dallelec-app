<template>
  <div class="container py-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <button @click="$router.push('/ouvrier')" class="btn btn-outline-secondary">
        ← Retour
      </button>
      <button @click="logout" class="btn btn-outline-danger">Déconnexion</button>
    </div>
    
    <h2 class="text-center mb-4">Saisie des Heures</h2>
    
    <!-- Form saisie heures -->
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h5>Enregistrer mes heures de travail</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label>Chantier:</label>
                <select v-model="nouvelleHeure.chantierId" class="form-control" required>
                  <option value="">Sélectionner un chantier</option>
                  <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                    {{ chantier.nom }} - {{ chantier.adresse }}
                  </option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label>Date:</label>
                <input v-model="nouvelleHeure.date" type="date" class="form-control" required />
                <small class="text-muted">
                  Vous pouvez insérer des heures pour n'importe quelle date
                </small>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label>Heures travaillées:</label>
                <select v-model="nouvelleHeure.heures" class="form-control" required>
                  <option value="">Sélectionner les heures</option>
                  <option v-for="option in heuresOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <small class="text-muted">Minimum 15 minutes, maximum 12 heures</small>
              </div>
              <div class="col-md-6 mb-3">
                <label>Type de travail:</label>
                <select v-model="nouvelleHeure.typeTravail" class="form-control">
                  <option value="Normal">Normal</option>
                  <option value="Heures supplémentaires">Heures supplémentaires</option>
                  <option value="Nuit">Travail de nuit</option>
                  <option value="Weekend">Weekend</option>
                </select>
              </div>
            </div>
            <div class="mb-3">
              <label>Notes (optionnel):</label>
              <textarea v-model="nouvelleHeure.notes" class="form-control" rows="2" placeholder="Détails sur le travail effectué..."></textarea>
            </div>
            <button @click="ajouterHeure" class="btn btn-primary w-100" :disabled="!formValide">
              Enregistrer mes heures
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toutes mes heures -->
    <div class="row justify-content-center mt-4">
      <div class="col-md-10">
        <div class="card">
          <div class="card-header">
            <h5>Toutes mes heures</h5>
          </div>
          <div class="card-body">
            <div v-if="heuresSemaine.length === 0" class="text-center text-muted py-4">
              Aucune heure enregistrée
            </div>
            <div v-else>
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Chantier</th>
                    <th>Heures</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="heure in heuresSemaine" :key="heure.id">
                    <td>{{ formatDate(heure.date) }}</td>
                    <td>{{ getChantierName(heure.chantier_id) }}</td>
                    <td>{{ heure.heures }}h</td>
                    <td>{{ heure.type_travail || 'Normal' }}</td>
                    <td>
                      <button @click="supprimerHeure(heure.id)" class="btn btn-sm btn-danger" title="Supprimer">
                        🗑
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="text-end fw-bold">
                Total heures: {{ totalHeuresSemaine }}h
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase.js';

const router = useRouter();
const chantiers = ref([]);
const heuresSemaine = ref([]);
const currentUser = ref(null);
const adminOverride = ref(false);

// Data massima per inserimento (oggi)
const maxDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

// Controlla se data è bloccata - TEMPORANEO: nessun blocco
const isDateBlocked = (date) => {
  // TEMPORANEO: Nessun blocco - permette inserimento di qualsiasi data
  return false;
  
  // ORIGINALE (da ripristinare): 
  // if (!date) return false;
  // const selectedDate = new Date(date);
  // const today = new Date();
  // const twoDaysAgo = new Date(today);
  // twoDaysAgo.setDate(today.getDate() - 2);
  // twoDaysAgo.setHours(0, 0, 0, 0);
  // return selectedDate < twoDaysAgo && !adminOverride.value;
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

const nouvelleHeure = ref({
  chantierId: '',
  date: new Date().toISOString().split('T')[0],
  heures: '',
  typeTravail: 'Normal',
  notes: ''
});

const formValide = computed(() => {
  return nouvelleHeure.value.chantierId && 
         nouvelleHeure.value.date && 
         nouvelleHeure.value.heures > 0 && 
         nouvelleHeure.value.heures <= 12 &&
         !isDateBlocked(nouvelleHeure.value.date);
});

const totalHeuresSemaine = computed(() => {
  return heuresSemaine.value.reduce((total, h) => total + (h.heures || 0), 0);
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

const fetchChantiers = async () => {
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .select('*');
    
    if (error) throw error;
    chantiers.value = data || [];
  } catch (error) {
    console.error('Erreur lors du chargement des chantiers:', error);
  }
};

const fetchHeuresSemaine = async () => {
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) {
    console.log('❌ Pas d\'email utilisateur pour charger les heures');
    return;
  }
  
  console.log('🔍 Chargement heures pour:', userEmail);
  
  try {
    const { data, error } = await supabase
      .from('heures_ouvriers')
      .select('*')
      .eq('ouvrier_id', userEmail)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('❌ Erreur query heures:', error);
      throw error;
    }
    
    console.log('📊 Heures trouvées:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📋 Première heure:', data[0]);
    }
    
    heuresSemaine.value = data || [];
    
  } catch (error) {
    console.error('Erreur lors du chargement des heures:', error);
    heuresSemaine.value = [];
  }
};

const ajouterHeure = async () => {
  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName');
  
  if (!formValide.value || !userEmail) return;
  
  try {
    // Récupérer la tariffa attuale de l'ouvrier
    const { data: ouvrierData, error: ouvrierError } = await supabase
      .from('collaborateurs')
      .select('cout_horaire')
      .eq('email', userEmail)
      .single();
    
    const tarifActuel = ouvrierData?.cout_horaire || 35; // fallback
    
    const { error } = await supabase
      .from('heures_ouvriers')
      .insert([{
        chantier_id: nouvelleHeure.value.chantierId,
        date: nouvelleHeure.value.date,
        heures: nouvelleHeure.value.heures,
        type_travail: nouvelleHeure.value.typeTravail,
        notes: nouvelleHeure.value.notes,
        ouvrier_id: userEmail,
        ouvrier_nom: userName || userEmail,
        tarif_utilise: tarifActuel
      }]);
    
    if (error) throw error;
    
    // Reset form
    nouvelleHeure.value = {
      chantierId: '',
      date: new Date().toISOString().split('T')[0],
      heures: '',
      typeTravail: 'Normal',
      notes: ''
    };
    
    alert('Heures enregistrées avec succès!');
    fetchHeuresSemaine();
    
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    alert('Erreur lors de l\'enregistrement: ' + error.message);
  }
};

const supprimerHeure = async (id) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée?')) return;
  
  const userEmail = localStorage.getItem('userEmail');
  console.log('🗑️ Suppression heure ID:', id, 'pour user:', userEmail);
  console.log('📊 Heures avant suppression:', heuresSemaine.value.length);
  
  try {
    const { error } = await supabase
      .from('heures_ouvriers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('✅ Suppression réussie, rechargement...');
    await fetchHeuresSemaine();
    console.log('📊 Heures après rechargement:', heuresSemaine.value.length);
    
    alert('Heure supprimée avec succès');
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    alert('Erreur lors de la suppression: ' + error.message);
  }
};

const getChantierName = (id) => {
  const chantier = chantiers.value.find(c => c.id == id);
  return chantier ? `${chantier.nom}` : '-';
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

// Controlla se utente ha override admin
const checkAdminOverride = async (email) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('email')
      .eq('email', email);
    
    if (error) throw error;
    adminOverride.value = data && data.length > 0;
  } catch (error) {
    console.error('Erreur check admin:', error);
    adminOverride.value = false;
  }
};

onMounted(async () => {
  // Genera opzioni ore
  heuresOptions.value = generateHeuresOptions();
  
  // Controlla autenticazione da localStorage
  const userEmail = localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');
  
  if (userEmail && userRole === 'ouvrier') {
    currentUser.value = { email: userEmail };
    await checkAdminOverride(userEmail);
    fetchChantiers();
    fetchHeuresSemaine();
  } else {
    router.push('/');
  }
});
</script>

<style scoped>
.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>