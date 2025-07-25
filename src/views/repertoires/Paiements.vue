<template>
  <div class="container py-5">
    <h2 class="text-center mb-4">Modes de Paiement</h2>

    <div class="row mb-3 justify-content-center">
      <div class="col-md-6">
        <input v-model="newPaiement.nom" placeholder="Nom du mode de paiement" class="form-control" />
      </div>
    </div>

    <div class="text-center mb-4">
      <button @click="addPaiement" class="btn btn-primary">Ajouter</button>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in paiements" :key="p.id">
          <template v-if="editId === p.id">
            <td><input v-model="editPaiement.nom" class="form-control" /></td>
            <td>
              <button class="btn btn-success btn-sm me-1" @click="updatePaiement(p.id)">✔</button>
              <button class="btn btn-secondary btn-sm" @click="cancelEdit">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ p.nom }}</td>
            <td>
              <button class="btn btn-warning btn-sm me-1" @click="startEdit(p)">✎</button>
              <button class="btn btn-danger btn-sm" @click="deletePaiement(p.id)">🗑</button>
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
import { db } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default {
  name: 'Paiements',
  setup() {
    const paiements = ref([]);
    const newPaiement = ref({ nom: '' });

    const editId = ref(null);
    const editPaiement = ref({ nom: '' });

    const fetchPaiements = async () => {
      const snapshot = await getDocs(collection(db, 'paiements'));
      paiements.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const addPaiement = async () => {
      if (newPaiement.value.nom.trim()) {
        await addDoc(collection(db, 'paiements'), newPaiement.value);
        newPaiement.value.nom = '';
        fetchPaiements();
      }
    };

    const startEdit = (paiement) => {
      editId.value = paiement.id;
      editPaiement.value = { nom: paiement.nom };
    };

    const cancelEdit = () => {
      editId.value = null;
      editPaiement.value = { nom: '' };
    };

    const updatePaiement = async (id) => {
      await updateDoc(doc(db, 'paiements', id), editPaiement.value);
      cancelEdit();
      fetchPaiements();
    };

    const deletePaiement = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'paiements', id));
        fetchPaiements();
      }
    };

    onMounted(fetchPaiements);

    return {
      paiements,
      newPaiement,
      addPaiement,
      editId,
      editPaiement,
      startEdit,
      cancelEdit,
      updatePaiement,
      deletePaiement
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
