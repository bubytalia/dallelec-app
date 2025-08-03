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
          <th>Visible PDF</th>
          <th>Ordre</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="famille in familles" :key="famille.id">
          <template v-if="editId === famille.id">
            <td>
              <input v-model="editFamille.nom" class="form-control" />
            </td>
            <td class="text-center">–</td>
            <!-- Ordre en mode édition -->
            <td>
              <input v-model.number="editFamille.ordre" type="number" class="form-control" />
            </td>
            <td>
              <button @click="updateFamille(famille.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ famille.nom }}</td>
            <td class="text-center">
              <input
                type="checkbox"
                class="form-check-input"
                :checked="!!famille.visibleInPdf"
                @change="toggleVisible(famille)"
              />
            </td>
            <!-- Visualizziamo l'ordine, se presente -->
            <td>{{ famille.ordre ?? '' }}</td>
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
    const newFamille = ref({ nom: '', ordre: 0 });

    const editId = ref(null);
    const editFamille = ref({ nom: '', ordre: 0 });

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
      editFamille.value = { nom: famille.nom, ordre: famille.ordre ?? 0 };
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

    /**
     * Toggle the visibility of a family in the PDF. When the checkbox is
     * clicked the family document will be updated to either include or
     * remove the `visibleInPdf` flag. This allows the business to decide
     * which families should appear in the "Type de pose" section of the
     * generated devis without affecting the underlying discount logic.
     *
     * @param {Object} famille - The family document to update
     */
    const toggleVisible = async (famille) => {
      // Invert the current value (undefined is treated as false)
      const newValue = !famille.visibleInPdf;
      // Update the document in Firestore with the new visibility flag
      await updateDoc(doc(db, 'familles', famille.id), { visibleInPdf: newValue });
      // Refresh the list to reflect the change
      fetchFamilles();
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
      ,
      toggleVisible
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
