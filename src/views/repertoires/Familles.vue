<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Familles de Remises</h2>

    <div class="row mb-3 justify-content-center">
      <div class="col-md-4">
        <input v-model="newFamille.nom" placeholder="Nom de la famille" class="form-control" />
      </div>
      <div class="col-md-2">
        <div class="form-check">
          <input v-model="newFamille.visiblePDF" type="checkbox" class="form-check-input" id="newVisiblePDF" />
          <label class="form-check-label" for="newVisiblePDF">Visible PDF</label>
        </div>
      </div>
      <div class="col-md-2">
        <input v-model.number="newFamille.ordrePDF" type="number" placeholder="Ordre" class="form-control" min="0" />
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
            <td>
              <div class="form-check">
                <input v-model="editFamille.visiblePDF" type="checkbox" class="form-check-input" />
              </div>
            </td>
            <td>
              <input v-model.number="editFamille.ordrePDF" type="number" class="form-control" min="0" />
            </td>
            <td>
              <button @click="updateFamille(famille.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ famille.nom }}</td>
            <td>
              <span v-if="famille.visiblePDF !== false" class="badge bg-success">✓</span>
              <span v-else class="badge bg-secondary">✗</span>
            </td>
            <td>{{ famille.ordrePDF || 0 }}</td>
            <td>
              <button @click="startEdit(famille)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteFamille(famille.id)" class="btn btn-danger btn-sm">🗑</button>
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
  name: 'Familles',
  components: {
    RetourButton
  },
  setup() {
    const familles = ref([]);
    const newFamille = ref({ nom: '', visiblePDF: false, ordrePDF: 0 });

    const editId = ref(null);
    const editFamille = ref({ nom: '' });

    const fetchFamilles = async () => {
      const querySnapshot = await getDocs(collection(db, 'familles'));
      familles.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (a.ordrePDF || 0) - (b.ordrePDF || 0));
    };

    const addFamille = async () => {
      if (newFamille.value.nom.trim() === '') return;
      await addDoc(collection(db, 'familles'), {
        nom: newFamille.value.nom,
        visiblePDF: newFamille.value.visiblePDF !== false,
        ordrePDF: newFamille.value.ordrePDF || 0
      });
      newFamille.value = { nom: '', visiblePDF: false, ordrePDF: 0 };
      fetchFamilles();
    };

    const startEdit = (famille) => {
      editId.value = famille.id;
      editFamille.value = { 
        nom: famille.nom,
        visiblePDF: famille.visiblePDF !== false,
        ordrePDF: famille.ordrePDF || 0
      };
    };

    const cancelEdit = () => {
      editId.value = null;
      editFamille.value = { nom: '', visiblePDF: false, ordrePDF: 0 };
    };

    const updateFamille = async (id) => {
      await updateDoc(doc(db, 'familles', id), {
        nom: editFamille.value.nom,
        visiblePDF: editFamille.value.visiblePDF !== false,
        ordrePDF: editFamille.value.ordrePDF || 0
      });
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
