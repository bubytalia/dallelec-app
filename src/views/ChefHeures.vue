<template>
  <div class="container py-5">
    <RetourButton to="/chef" />
    
    <h2 class="text-center mb-4">Immissione Ore</h2>
    
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Mes heures</h5>
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
              <input v-model.number="newHeure.heuresPropres" type="number" step="0.5" class="form-control" />
            </div>
            <button @click="addHeurePropre" class="btn btn-primary" :disabled="!newHeure.chantierId">Ajouter mes heures</button>
          </div>
        </div>
      </div>
      
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
              <label>Collaborateur:</label>
              <select v-model="newHeureInterim.collaborateurId" class="form-control">
                <option value="">Sélectionner</option>
                <option v-for="collab in collaborateurs" :key="collab.id" :value="collab.id">
                  {{ collab.nom }} {{ collab.prenom }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label>Heures intérimaires:</label>
              <input v-model.number="newHeureInterim.heuresInterim" type="number" step="0.5" class="form-control" />
            </div>
            <button @click="addHeureInterim" class="btn btn-success" :disabled="!newHeureInterim.chantierId">Ajouter heures intérim</button>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-6">
        <h5>Mes heures</h5>
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
              <td>{{ getChantierName(heure.chantierId) }}</td>
              <td>{{ formatDate(heure.date) }}</td>
              <td>{{ heure.heuresPropres }}</td>
              <td>
                <button @click="deleteHeure(heure.id, 'propres')" class="btn btn-danger btn-sm">🗑</button>
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
              <th>Collaborateur</th>
              <th>Heures</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="heure in heuresInterim" :key="heure.id">
              <td>{{ getChantierName(heure.chantierId) }}</td>
              <td>{{ formatDate(heure.date) }}</td>
              <td>{{ getCollaborateurName(heure.collaborateurId) }}</td>
              <td>{{ heure.heuresInterim }}</td>
              <td>
                <button @click="deleteHeure(heure.id, 'interim')" class="btn btn-danger btn-sm">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Résumé par chantier</h5>
          </div>
          <div class="card-body">
            <div v-for="chantier in chantiers" :key="chantier.id" class="mb-3">
              <h6>{{ chantier.nom }} - {{ chantier.adresse }}</h6>
              <p><strong>Mes heures:</strong> {{ getTotalHeuresPropres(chantier.id) }}</p>
              <p><strong>Heures intérimaires:</strong> {{ getTotalHeuresInterim(chantier.id) }}</p>
              <p><strong>Total:</strong> {{ getTotalHeuresGeneral(chantier.id) }}</p>
              <hr>
            </div>
            <div class="mt-3">
              <h6>Total général</h6>
              <p><strong>Total mes heures:</strong> {{ totalHeuresPropres }}</p>
              <p><strong>Total heures intérimaires:</strong> {{ totalHeuresInterim }}</p>
              <p><strong>Total général:</strong> {{ totalHeuresGeneral }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

const collaborateurs = ref([]);
const chantiers = ref([]);
const heuresPropres = ref([]);
const heuresInterim = ref([]);

const newHeure = ref({
  chantierId: '',
  date: new Date().toISOString().split('T')[0],
  heuresPropres: 0
});

const newHeureInterim = ref({
  chantierId: '',
  date: new Date().toISOString().split('T')[0],
  collaborateurId: '',
  heuresInterim: 0
});

const fetchCollaborateurs = async () => {
  const snapshot = await getDocs(collection(db, 'collaborateurs'));
  collaborateurs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchChantiers = async () => {
  const snapshot = await getDocs(collection(db, 'chantiers'));
  chantiers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchHeuresPropres = async () => {
  const snapshot = await getDocs(collection(db, 'heures_chef_propres'));
  heuresPropres.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchHeuresInterim = async () => {
  const snapshot = await getDocs(collection(db, 'heures_chef_interim'));
  heuresInterim.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const addHeurePropre = async () => {
  if (!newHeure.value.chantierId || !newHeure.value.date || !newHeure.value.heuresPropres) return;
  
  await addDoc(collection(db, 'heures_chef_propres'), {
    chantierId: newHeure.value.chantierId,
    date: newHeure.value.date,
    heuresPropres: newHeure.value.heuresPropres,
    chefId: 'chef@dallelec.com' // TODO: prendere da auth
  });
  
  newHeure.value = {
    chantierId: '',
    date: new Date().toISOString().split('T')[0],
    heuresPropres: 0
  };
  fetchHeuresPropres();
};

const addHeureInterim = async () => {
  if (!newHeureInterim.value.chantierId || !newHeureInterim.value.date || !newHeureInterim.value.collaborateurId || !newHeureInterim.value.heuresInterim) return;
  
  await addDoc(collection(db, 'heures_chef_interim'), {
    chantierId: newHeureInterim.value.chantierId,
    date: newHeureInterim.value.date,
    collaborateurId: newHeureInterim.value.collaborateurId,
    heuresInterim: newHeureInterim.value.heuresInterim,
    chefId: 'chef@dallelec.com' // TODO: prendere da auth
  });
  
  newHeureInterim.value = {
    chantierId: '',
    date: new Date().toISOString().split('T')[0],
    collaborateurId: '',
    heuresInterim: 0
  };
  fetchHeuresInterim();
};

const deleteHeure = async (id, type) => {
  if (confirm('Confirmer la suppression ?')) {
    const collectionName = type === 'propres' ? 'heures_chef_propres' : 'heures_chef_interim';
    await deleteDoc(doc(db, collectionName, id));
    if (type === 'propres') {
      fetchHeuresPropres();
    } else {
      fetchHeuresInterim();
    }
  }
};

const getChantierName = (id) => {
  const chantier = chantiers.value.find(c => c.id === id);
  return chantier ? `${chantier.nom} - ${chantier.adresse}` : '-';
};

const getCollaborateurName = (id) => {
  const collab = collaborateurs.value.find(c => c.id === id);
  return collab ? `${collab.nom} ${collab.prenom}` : '-';
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

const getTotalHeuresPropres = (chantierId) => {
  return heuresPropres.value
    .filter(h => h.chantierId === chantierId)
    .reduce((total, h) => total + (h.heuresPropres || 0), 0);
};

const getTotalHeuresInterim = (chantierId) => {
  return heuresInterim.value
    .filter(h => h.chantierId === chantierId)
    .reduce((total, h) => total + (h.heuresInterim || 0), 0);
};

const getTotalHeuresGeneral = (chantierId) => {
  return getTotalHeuresPropres(chantierId) + getTotalHeuresInterim(chantierId);
};

const totalHeuresPropres = computed(() => {
  return heuresPropres.value.reduce((total, h) => total + (h.heuresPropres || 0), 0);
});

const totalHeuresInterim = computed(() => {
  return heuresInterim.value.reduce((total, h) => total + (h.heuresInterim || 0), 0);
});

const totalHeuresGeneral = computed(() => {
  return totalHeuresPropres.value + totalHeuresInterim.value;
});

onMounted(() => {
  fetchCollaborateurs();
  fetchChantiers();
  fetchHeuresPropres();
  fetchHeuresInterim();
});
</script>