<template>
  <div class="container py-5">
    <h2 class="text-center mb-4">Suppléments</h2>

    <form @submit.prevent="addSupplement" class="row g-3 mb-4 justify-content-center">
      <div class="col-md-6">
        <input v-model="newSupplement.nom" placeholder="Nom du supplément" class="form-control" required />
      </div>
      <div class="col-md-3">
        <input v-model.number="newSupplement.valeur" placeholder="Valeur (mètres)" type="number" step="0.01" class="form-control" required />
      </div>
      <div class="col-12 text-center">
        <button type="submit" class="btn btn-primary">Ajouter</button>
      </div>
    </form>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Valeur (m)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="supp in supplements" :key="supp.id">
          <td v-if="editId !== supp.id">{{ supp.nom }}</td>
          <td v-else><input v-model="editData.nom" class="form-control" /></td>

          <td v-if="editId !== supp.id">{{ supp.valeur }}</td>
          <td v-else><input v-model.number="editData.valeur" type="number" step="0.01" class="form-control" /></td>

          <td>
            <button v-if="editId !== supp.id" @click="startEdit(supp)" class="btn btn-sm btn-warning me-1">✏️</button>
            <button v-else @click="confirmEdit(supp.id)" class="btn btn-sm btn-success me-1">💾</button>
            <button @click="deleteSupplement(supp.id)" class="btn btn-sm btn-danger">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="text-center">
      <router-link to="/admin/repertoires" class="btn btn-secondary">Retour</router-link>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';

export default {
  name: 'Supplements',
  setup() {
    const supplements = ref([]);
    const newSupplement = ref({ nom: '', valeur: null });
    const editId = ref(null);
    const editData = ref({ nom: '', valeur: null });

    const fetchSupplements = async () => {
      const snap = await getDocs(collection(db, 'supplements'));
      supplements.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const addSupplement = async () => {
      if (!newSupplement.value.nom || newSupplement.value.valeur === null) return;
      await addDoc(collection(db, 'supplements'), newSupplement.value);
      newSupplement.value = { nom: '', valeur: null };
      fetchSupplements();
    };

    const deleteSupplement = async (id) => {
      await deleteDoc(doc(db, 'supplements', id));
      fetchSupplements();
    };

    const startEdit = (supp) => {
      editId.value = supp.id;
      editData.value = { nom: supp.nom, valeur: supp.valeur };
    };

    const confirmEdit = async (id) => {
      await updateDoc(doc(db, 'supplements', id), editData.value);
      editId.value = null;
      editData.value = { nom: '', valeur: null };
      fetchSupplements();
    };

    onMounted(fetchSupplements);

    return {
      supplements,
      newSupplement,
      addSupplement,
      deleteSupplement,
      editId,
      editData,
      startEdit,
      confirmEdit
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
