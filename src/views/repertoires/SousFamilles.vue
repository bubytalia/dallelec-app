<template>
  <div class="container py-5">
    <h2 class="text-center mb-4">Sous-Familles de Remises</h2>

    <div class="row mb-3">
      <div class="col-md-4">
        <input v-model="newSousFamille.nom" placeholder="Nom de la sous-famille" class="form-control" />
      </div>
      <div class="col-md-4">
        <input v-model.number="newSousFamille.pourcentage" placeholder="Pourcentage de remise (%)" type="number" class="form-control" />
      </div>
      <div class="col-md-4">
        <select v-model="newSousFamille.familleId" class="form-control">
          <option disabled value="">Sélectionnez une famille</option>
          <option v-for="fam in familles" :key="fam.id" :value="fam.id">{{ fam.nom }}</option>
        </select>
      </div>
    </div>

    <div class="text-center mb-4">
      <button @click="addSousFamille" class="btn btn-primary">Ajouter</button>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Famille</th>
          <th>Remise (%)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sous in sousFamilles" :key="sous.id">
          <template v-if="editId === sous.id">
            <td><input v-model="editSousFamille.nom" class="form-control" /></td>
            <td>
              <select v-model="editSousFamille.familleId" class="form-control">
                <option v-for="fam in familles" :key="fam.id" :value="fam.id">{{ fam.nom }}</option>
              </select>
            </td>
            <td><input v-model.number="editSousFamille.pourcentage" type="number" class="form-control" /></td>
            <td>
              <button @click="updateSousFamille(sous.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ sous.nom }}</td>
            <td>{{ getFamilleName(sous.familleId) }}</td>
            <td>{{ sous.pourcentage }}</td>
            <td>
              <button @click="startEdit(sous)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteSousFamille(sous.id)" class="btn btn-danger btn-sm">🗑</button>
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
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

export default {
  name: 'SousFamilles',
  setup() {
    const familles = ref([]);
    const sousFamilles = ref([]);

    const newSousFamille = ref({
      nom: '',
      pourcentage: null,
      familleId: ''
    });

    const editId = ref(null);
    const editSousFamille = ref({
      nom: '',
      pourcentage: null,
      familleId: ''
    });

    const fetchFamilles = async () => {
      const snapshot = await getDocs(collection(db, 'familles'));
      familles.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchSousFamilles = async () => {
      const snapshot = await getDocs(collection(db, 'sousfamilles'));
      sousFamilles.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const addSousFamille = async () => {
      if (!newSousFamille.value.nom || !newSousFamille.value.familleId) return;
      await addDoc(collection(db, 'sousfamilles'), { ...newSousFamille.value });
      newSousFamille.value = { nom: '', pourcentage: null, familleId: '' };
      fetchSousFamilles();
    };

    const startEdit = (sous) => {
      editId.value = sous.id;
      editSousFamille.value = {
        nom: sous.nom,
        pourcentage: sous.pourcentage,
        familleId: sous.familleId
      };
    };

    const cancelEdit = () => {
      editId.value = null;
      editSousFamille.value = { nom: '', pourcentage: null, familleId: '' };
    };

    const updateSousFamille = async (id) => {
      await updateDoc(doc(db, 'sousfamilles', id), editSousFamille.value);
      cancelEdit();
      fetchSousFamilles();
    };

    const deleteSousFamille = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'sousfamilles', id));
        fetchSousFamilles();
      }
    };

    const getFamilleName = (id) => {
      const fam = familles.value.find(f => f.id === id);
      return fam ? fam.nom : '';
    };

    onMounted(() => {
      fetchFamilles();
      fetchSousFamilles();
    });

    return {
      familles,
      sousFamilles,
      newSousFamille,
      editSousFamille,
      editId,
      addSousFamille,
      startEdit,
      cancelEdit,
      updateSousFamille,
      deleteSousFamille,
      getFamilleName
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
