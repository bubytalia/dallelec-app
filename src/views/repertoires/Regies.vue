<template>
  <div class="container py-5">
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Régies</h2>
    
    <div class="row mb-3">
      <div class="col">
        <input v-model="newRegie.nom" placeholder="Nom régie" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newRegie.description" placeholder="Description" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newRegie.prixHeure" placeholder="Prix/heure (CHF)" class="form-control" type="number" step="0.01" />
      </div>
    </div>
    <div class="text-center mb-4">
      <button @click="addRegie" class="btn btn-primary">Ajouter</button>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Description</th>
          <th>Prix/heure (CHF)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="regie in regies" :key="regie.id">
          <template v-if="editId === regie.id">
            <td><input v-model="editRegie.nom" class="form-control" /></td>
            <td><input v-model="editRegie.description" class="form-control" /></td>
            <td><input v-model="editRegie.prixHeure" class="form-control" type="number" step="0.01" /></td>
            <td>
              <button @click="updateRegie(regie.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ regie.nom }}</td>
            <td>{{ regie.description }}</td>
            <td>{{ regie.prixHeure }} CHF</td>
            <td>
              <button @click="startEdit(regie)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteRegie(regie.id)" class="btn btn-danger btn-sm">🗑</button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

export default {
  name: 'Regies',
  components: {
    RetourButton
  },
  setup() {
    const regies = ref([]);
    const newRegie = ref({
      nom: '',
      description: '',
      prixHeure: ''
    });

    const editId = ref(null);
    const editRegie = ref({});

    const fetchRegies = async () => {
      const querySnapshot = await getDocs(collection(db, 'regies'));
      regies.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.nom.localeCompare(b.nom));
    };

    const addRegie = async () => {
      await addDoc(collection(db, 'regies'), newRegie.value);
      newRegie.value = { nom: '', description: '', prixHeure: '' };
      fetchRegies();
    };

    const startEdit = (regie) => {
      editId.value = regie.id;
      editRegie.value = { ...regie };
    };

    const cancelEdit = () => {
      editId.value = null;
      editRegie.value = {};
    };

    const updateRegie = async (id) => {
      await updateDoc(doc(db, 'regies', id), editRegie.value);
      cancelEdit();
      fetchRegies();
    };

    const deleteRegie = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'regies', id));
        fetchRegies();
      }
    };

    onMounted(fetchRegies);

    return {
      regies,
      newRegie,
      addRegie,
      editId,
      editRegie,
      startEdit,
      cancelEdit,
      updateRegie,
      deleteRegie
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: auto;
}
.table {
  margin-top: 30px;
}
</style>