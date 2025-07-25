<template>
  <div class="container py-5">
    <h2 class="text-center mb-4">Familles de Remises</h2>

    <div class="row mb-3 justify-content-center">
      <div class="col-md-6">
        <input v-model="newFamille.nom" placeholder="Nom de la famille" class="form-control" />
      </div>
    </div>

    <div class="text-center mb-4">
      <button @click="addFamille" class="btn btn-primary">Ajouter</button>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="famille in familles" :key="famille.id">
          <template v-if="editId === famille.id">
            <td>
              <input v-model="editFamille.nom" class="form-control" />
            </td>
            <td>
              <button @click="updateFamille(famille.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ famille.nom }}</td>
            <td>
              <button @click="startEdit(famille)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteFamille(famille.id)" class="btn btn-danger btn-sm">🗑</button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>

    <div class="text-center">
      <button @click="$router.push('/admin/repertoires')" class="btn btn-secondary">Retour</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';

export default {
  name: 'Familles',
  setup() {
    const familles = ref([]);
    const newFamille = ref({ nom: '' });

    const editId = ref(null);
    const editFamille = ref({ nom: '' });

    const fetchFamilles = async () => {
      const querySnapshot = await getDocs(collection(db, 'familles'));
      familles.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const addFamille = async () => {
      if (newFamille.value.nom.trim() === '') return;
      await addDoc(collection(db, 'familles'), newFamille.value);
      newFamille.value.nom = '';
      fetchFamilles();
    };

    const startEdit = (famille) => {
      editId.value = famille.id;
      editFamille.value = { nom: famille.nom };
    };

    const cancelEdit = () => {
      editId.value = null;
      editFamille.value = { nom: '' };
    };

    const updateFamille = async (id) => {
      await updateDoc(doc(db, 'familles', id), editFamille.value);
      cancelEdit();
      fetchFamilles();
    };

    const deleteFamille = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'familles', id));
        fetchFamilles();
      }
    };

    onMounted(fetchFamilles);

    return {
      familles,
      newFamille,
      addFamille,
      editId,
      editFamille,
      startEdit,
      cancelEdit,
      updateFamille,
      deleteFamille
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: auto;
}
.table {
  margin-top: 30px;
}
</style>
