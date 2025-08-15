<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Produits</h2>
    
    <!-- Avviso integrità dati -->
    <div class="alert alert-info mb-4">
      <strong>📊 Integrità dati:</strong> Le modifiche ai prezzi non influenzeranno i devis già salvati. 
      I prezzi storici rimangono congelati per mantenere l'integrità commerciale.
    </div>
    <div class="row mb-3">
      <div class="col">
        <input v-model="newProduit.article" placeholder="Article" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newProduit.taille" placeholder="Taille" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newProduit.description" placeholder="Description" class="form-control" />
      </div>
    </div>
    <div class="row mb-3">
      <div class="col">
        <select v-model="newProduit.unite" class="form-control">
          <option disabled value="">Unité</option>
          <option value="m">m</option>
          <option value="pc">pc</option>
          <option value="h">h</option>
        </select>
      </div>
      <div class="col">
        <input v-model="newProduit.prix" placeholder="Prix unitaire" class="form-control" type="number" />
      </div>
    </div>
    <div class="text-center mb-4">
      <button @click="addProduit" class="btn btn-primary">Ajouter</button>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Article</th>
          <th>Taille</th>
          <th>Description</th>
          <th>Unité</th>
          <th>Prix</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="prod in produits" :key="prod.id">
          <template v-if="editId === prod.id">
            <td><input v-model="editProduit.article" class="form-control" /></td>
            <td><input v-model="editProduit.taille" class="form-control" /></td>
            <td><input v-model="editProduit.description" class="form-control" /></td>
            <td>
              <select v-model="editProduit.unite" class="form-control">
                <option disabled value="">Unité</option>
                <option value="m">m</option>
                <option value="pc">pc</option>
                <option value="h">h</option>
              </select>
            </td>
            <td><input v-model="editProduit.prix" class="form-control" type="number" /></td>
            <td>
              <button @click="updateProduit(prod.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ prod.article }}</td>
            <td>{{ prod.taille }}</td>
            <td>{{ prod.description }}</td>
            <td>{{ prod.unite }}</td>
            <td>{{ prod.prix }}</td>
            <td>
              <button @click="startEdit(prod)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteProduit(prod.id)" class="btn btn-danger btn-sm">🗑</button>
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
  name: 'Produits',
  components: {
    RetourButton
  },
  setup() {
    const produits = ref([]);
    const newProduit = ref({
      article: '',
      taille: '',
      description: '',
      unite: '',
      prix: ''
    });

    const editId = ref(null);
    const editProduit = ref({});

    const fetchProduits = async () => {
      const querySnapshot = await getDocs(collection(db, 'produits'));
      produits.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.article.localeCompare(b.article));
    };

    const addProduit = async () => {
      await addDoc(collection(db, 'produits'), newProduit.value);
      newProduit.value = { article: '', taille: '', description: '', unite: '', prix: '' };
      fetchProduits();
    };

    const startEdit = (prod) => {
      editId.value = prod.id;
      editProduit.value = { ...prod };
    };

    const cancelEdit = () => {
      editId.value = null;
      editProduit.value = {};
    };

    const updateProduit = async (id) => {
      if (confirm('Confermi la modifica? I devis già salvati manterranno i prezzi originali.')) {
        await updateDoc(doc(db, 'produits', id), editProduit.value);
        cancelEdit();
        fetchProduits();
      }
    };

    const deleteProduit = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'produits', id));
        fetchProduits();
      }
    };

    onMounted(fetchProduits);

    return {
      produits,
      newProduit,
      addProduit,
      editId,
      editProduit,
      startEdit,
      cancelEdit,
      updateProduit,
      deleteProduit
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
