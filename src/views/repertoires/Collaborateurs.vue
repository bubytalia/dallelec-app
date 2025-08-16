<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Collaborateurs</h2>
    
    <!-- Avviso integrità dati -->
    <div class="alert alert-info mb-4">
      <strong>📊 Integrità dati:</strong> Le modifiche ai costi orari non influenzeranno i cantieri già in corso. 
      I dati storici rimangono congelati per mantenere l'integrità dei calcoli.
    </div>

    <form @submit.prevent="addCollaborateur" class="row g-3 mb-4">
      <div class="col-md-4">
        <input v-model="newCollaborateur.nom" type="text" class="form-control" placeholder="Nom" required />
      </div>
      <div class="col-md-4">
        <input v-model="newCollaborateur.prenom" type="text" class="form-control" placeholder="Prénom" required />
      </div>
      <div class="col-md-4">
        <input v-model="newCollaborateur.telephone" type="text" class="form-control" placeholder="Téléphone" required />
      </div>
      <div class="col-md-4">
        <input v-model="newCollaborateur.email" type="email" class="form-control" placeholder="Email" required />
      </div>
      <div class="col-md-4">
        <select v-model="newCollaborateur.etat" class="form-select" required>
          <option disabled value="">Sélectionner l'état</option>
          <option value="direct">Direct</option>
          <option value="interimaire">Intérimaire</option>
        </select>
      </div>
      <div class="col-md-4">
        <input v-model.number="newCollaborateur.coutHoraire" type="number" class="form-control" placeholder="Coût horaire (€)" required />
      </div>
      <div class="col-md-4">
        <div class="form-check">
          <input v-model="newCollaborateur.excludeFromReport" type="checkbox" class="form-check-input" id="excludeNew">
          <label class="form-check-label" for="excludeNew">Exclure du rapport mensuel</label>
        </div>
      </div>
      <div class="col-12 text-end">
        <button type="submit" class="btn btn-primary">Ajouter</button>
      </div>
    </form>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Prénom</th>
          <th>Téléphone</th>
          <th>Email</th>
          <th>État</th>
          <th>Coût horaire</th>
          <th>Exclu rapport</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="collab in collaborateurs" :key="collab.id">
          <template v-if="editId === collab.id">
            <td><input v-model="editCollaborateur.nom" class="form-control" /></td>
            <td><input v-model="editCollaborateur.prenom" class="form-control" /></td>
            <td><input v-model="editCollaborateur.telephone" class="form-control" /></td>
            <td><input v-model="editCollaborateur.email" class="form-control" /></td>
            <td>
              <select v-model="editCollaborateur.etat" class="form-select">
                <option value="direct">Direct</option>
                <option value="interimaire">Intérimaire</option>
              </select>
            </td>
            <td><input v-model.number="editCollaborateur.coutHoraire" class="form-control" /></td>
            <td>
              <input v-model="editCollaborateur.excludeFromReport" type="checkbox" class="form-check-input">
            </td>
            <td>
              <button @click="updateCollaborateur(collab.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ collab.nom }}</td>
            <td>{{ collab.prenom }}</td>
            <td>{{ collab.telephone }}</td>
            <td>{{ collab.email }}</td>
            <td>{{ collab.etat }}</td>
            <td>{{ collab.coutHoraire }} €</td>
            <td>
              <span v-if="collab.excludeFromReport" class="badge bg-warning">⚠️ Exclu</span>
              <span v-else class="badge bg-success">✓ Inclus</span>
            </td>
            <td>
              <button @click="startEdit(collab)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteCollaborateur(collab.id)" class="btn btn-danger btn-sm">🗑</button>
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
  name: 'Collaborateurs',
  components: {
    RetourButton
  },
  setup() {
    const collaborateurs = ref([]);
    const newCollaborateur = ref({
      nom: '', prenom: '', telephone: '', email: '', etat: '', coutHoraire: null, excludeFromReport: false
    });

    const editId = ref(null);
    const editCollaborateur = ref({});

    const fetchCollaborateurs = async () => {
      const querySnapshot = await getDocs(collection(db, 'collaborateurs'));
      collaborateurs.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const addCollaborateur = async () => {
      await addDoc(collection(db, 'collaborateurs'), newCollaborateur.value);
      newCollaborateur.value = { nom: '', prenom: '', telephone: '', email: '', etat: '', coutHoraire: null, excludeFromReport: false };
      fetchCollaborateurs();
    };

    const startEdit = (collab) => {
      editId.value = collab.id;
      editCollaborateur.value = { ...collab };
    };

    const cancelEdit = () => {
      editId.value = null;
      editCollaborateur.value = {};
    };

    const updateCollaborateur = async (id) => {
      if (confirm('Confermi la modifica? I cantieri già in corso manterranno i costi orari originali.')) {
        const collabRef = doc(db, 'collaborateurs', id);
        await updateDoc(collabRef, editCollaborateur.value);
        cancelEdit();
        fetchCollaborateurs();
      }
    };

    const deleteCollaborateur = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'collaborateurs', id));
        fetchCollaborateurs();
      }
    };

    onMounted(fetchCollaborateurs);

    return {
      collaborateurs,
      newCollaborateur,
      addCollaborateur,
      editId,
      editCollaborateur,
      startEdit,
      cancelEdit,
      updateCollaborateur,
      deleteCollaborateur
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
