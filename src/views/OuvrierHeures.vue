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
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label>Heures travaillées:</label>
                <input v-model.number="nouvelleHeure.heures" type="number" step="0.5" min="0" max="12" class="form-control" required />
                <small class="text-muted">Maximum 12 heures par jour</small>
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

    <!-- Heures de la semaine -->
    <div class="row justify-content-center mt-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h5>Mes heures cette semaine</h5>
          </div>
          <div class="card-body">
            <div v-if="heuresSemaine.length === 0" class="text-center text-muted py-4">
              Aucune heure enregistrée cette semaine
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
                    <td>{{ getChantierName(heure.chantierId) }}</td>
                    <td>{{ heure.heures }}h</td>
                    <td>{{ heure.typeTravail || 'Normal' }}</td>
                    <td>
                      <button @click="supprimerHeure(heure.id)" class="btn btn-sm btn-danger" title="Supprimer">
                        🗑
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="text-end fw-bold">
                Total semaine: {{ totalHeuresSemaine }}h
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
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

const router = useRouter();
const chantiers = ref([]);
const heuresSemaine = ref([]);
const currentUser = ref(null);

const nouvelleHeure = ref({
  chantierId: '',
  date: new Date().toISOString().split('T')[0],
  heures: 0,
  typeTravail: 'Normal',
  notes: ''
});

const formValide = computed(() => {
  return nouvelleHeure.value.chantierId && 
         nouvelleHeure.value.date && 
         nouvelleHeure.value.heures > 0 && 
         nouvelleHeure.value.heures <= 12;
});

const totalHeuresSemaine = computed(() => {
  return heuresSemaine.value.reduce((total, h) => total + (h.heures || 0), 0);
});

const logout = async () => {
  try {
    await signOut(auth);
    router.push('/');
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};

const fetchChantiers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'chantiers'));
    chantiers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erreur lors du chargement des chantiers:', error);
  }
};

const fetchHeuresSemaine = async () => {
  if (!currentUser.value) return;
  
  try {
    // Calcola inizio settimana (lunedì)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'heures_ouvriers'),
      where('ouvrierId', '==', currentUser.value.email)
    );
    
    const snapshot = await getDocs(q);
    const allHeures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filtra solo le ore di questa settimana
    heuresSemaine.value = allHeures.filter(heure => {
      const heureDate = new Date(heure.date);
      return heureDate >= startOfWeek;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    
  } catch (error) {
    console.error('Erreur lors du chargement des heures:', error);
  }
};

const ajouterHeure = async () => {
  if (!formValide.value || !currentUser.value) return;
  
  try {
    await addDoc(collection(db, 'heures_ouvriers'), {
      chantierId: nouvelleHeure.value.chantierId,
      date: nouvelleHeure.value.date,
      heures: nouvelleHeure.value.heures,
      typeTravail: nouvelleHeure.value.typeTravail,
      notes: nouvelleHeure.value.notes,
      ouvrierId: currentUser.value.email,
      ouvrierNom: currentUser.value.displayName || currentUser.value.email,
      createdAt: new Date()
    });
    
    // Reset form
    nouvelleHeure.value = {
      chantierId: '',
      date: new Date().toISOString().split('T')[0],
      heures: 0,
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
  
  try {
    await deleteDoc(doc(db, 'heures_ouvriers', id));
    alert('Heure supprimée avec succès');
    fetchHeuresSemaine();
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    alert('Erreur lors de la suppression: ' + error.message);
  }
};

const getChantierName = (id) => {
  const chantier = chantiers.value.find(c => c.id === id);
  return chantier ? `${chantier.nom}` : '-';
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

onMounted(() => {
  // Ascolta i cambiamenti di autenticazione
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = user;
      fetchChantiers();
      fetchHeuresSemaine();
    } else {
      router.push('/');
    }
  });
});
</script>

<style scoped>
.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>