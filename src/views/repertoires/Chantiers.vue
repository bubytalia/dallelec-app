<template>
  <div class="container py-4">
    <h2 class="mb-4">Chantiers</h2>

    <form @submit.prevent="addChantier" class="row g-3 mb-4">
      <div class="col-md-4">
        <input v-model="newChantier.nom" type="text" class="form-control" placeholder="Nom" required />
      </div>
      <div class="col-md-4">
        <input v-model="newChantier.adresse" type="text" class="form-control" placeholder="Adresse" required />
      </div>
      <div class="col-md-4">
        <input v-model="newChantier.ville" type="text" class="form-control" placeholder="Ville" required />
      </div>
      <div class="col-md-4">
        <select v-model="newChantier.client" class="form-select" required>
          <option disabled value="">Sélectionner le client</option>
          <option v-for="client in clients" :key="client.id" :value="client.nom">
            {{ client.nom }}
          </option>
        </select>
      </div>
      <div class="col-md-4">
        <select v-model="newChantier.technicien" class="form-select" required>
          <option disabled value="">Sélectionner le technicien</option>
          <option v-for="tech in techniciens" :key="tech.id" :value="tech.nom">
            {{ tech.nom }}
          </option>
        </select>
      </div>
      <div class="col-12 text-end">
        <button type="submit" class="btn btn-primary">Ajouter</button>
      </div>
    </form>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Adresse</th>
          <th>Ville</th>
          <th>Client</th>
          <th>Technicien</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="chantier in chantiers" :key="chantier.id">
          <template v-if="editId === chantier.id">
            <td><input v-model="editChantier.nom" class="form-control" /></td>
            <td><input v-model="editChantier.adresse" class="form-control" /></td>
            <td><input v-model="editChantier.ville" class="form-control" /></td>
            <td>
              <select v-model="editChantier.client" class="form-select">
                <option v-for="c in clients" :key="c.id" :value="c.nom">{{ c.nom }}</option>
              </select>
            </td>
            <td>
              <select v-model="editChantier.technicien" class="form-select">
                <option v-for="t in techniciens" :key="t.id" :value="t.nom">{{ t.nom }}</option>
              </select>
            </td>
            <td>
              <button class="btn btn-success btn-sm" @click="updateChantier(chantier.id)">✔</button>
              <button class="btn btn-secondary btn-sm" @click="cancelEdit">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ chantier.nom }}</td>
            <td>{{ chantier.adresse }}</td>
            <td>{{ chantier.ville }}</td>
            <td>{{ chantier.client }}</td>
            <td>{{ chantier.technicien }}</td>
            <td>
              <button class="btn btn-warning btn-sm" @click="startEdit(chantier)">✎</button>
              <button class="btn btn-danger btn-sm" @click="deleteChantier(chantier.id)">🗑</button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>

    <router-link to="/admin/repertoires" class="btn btn-secondary mt-3">Retour</router-link>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';

export default {
  name: 'Chantiers',
  setup() {
    const chantiers = ref([]);
    const clients = ref([]);
    const techniciens = ref([]);

    const newChantier = ref({
      nom: '',
      adresse: '',
      ville: '',
      client: '',
      technicien: ''
    });

    const editId = ref(null);
    const editChantier = ref({});

    const fetchChantiers = async () => {
      const snapshot = await getDocs(collection(db, 'chantiers'));
      chantiers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchClients = async () => {
      const snapshot = await getDocs(collection(db, 'clients'));
      clients.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchTechniciens = async () => {
      const snapshot = await getDocs(collection(db, 'techniciens'));
      techniciens.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const addChantier = async () => {
      await addDoc(collection(db, 'chantiers'), newChantier.value);
      newChantier.value = { nom: '', adresse: '', ville: '', client: '', technicien: '' };
      fetchChantiers();
    };

    const startEdit = (chantier) => {
      editId.value = chantier.id;
      editChantier.value = { ...chantier };
    };

    const cancelEdit = () => {
      editId.value = null;
      editChantier.value = {};
    };

    const updateChantier = async (id) => {
      const docRef = doc(db, 'chantiers', id);
      await updateDoc(docRef, editChantier.value);
      cancelEdit();
      fetchChantiers();
    };

    const deleteChantier = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'chantiers', id));
        fetchChantiers();
      }
    };

    onMounted(() => {
      fetchChantiers();
      fetchClients();
      fetchTechniciens();
    });

    return {
      chantiers,
      clients,
      techniciens,
      newChantier,
      addChantier,
      editId,
      editChantier,
      startEdit,
      cancelEdit,
      updateChantier,
      deleteChantier
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: auto;
}
.table th, .table td {
  vertical-align: middle;
}
</style>
