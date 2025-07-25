<template>
  <div class="container py-5">
    <h2 class="text-center mb-4">Clients</h2>

    <div class="row mb-3">
      <div class="col">
        <input v-model="newClient.nom" placeholder="Nom" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newClient.adresse" placeholder="Adresse" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newClient.ville" placeholder="Ville" class="form-control" />
      </div>
    </div>
    <div class="row mb-3">
      <div class="col">
        <input v-model="newClient.telephone" placeholder="Téléphone" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newClient.email_contact" placeholder="Email de contact" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newClient.email_compta" placeholder="Email de comptabilité" class="form-control" />
      </div>
    </div>
    <div class="text-center mb-4">
      <button @click="addClient" class="btn btn-primary">Ajouter</button>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Adresse</th>
          <th>Ville</th>
          <th>Téléphone</th>
          <th>Email contact</th>
          <th>Email comptabilité</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="client in clients" :key="client.id">
          <template v-if="editId === client.id">
            <td><input v-model="editClient.nom" class="form-control" /></td>
            <td><input v-model="editClient.adresse" class="form-control" /></td>
            <td><input v-model="editClient.ville" class="form-control" /></td>
            <td><input v-model="editClient.telephone" class="form-control" /></td>
            <td><input v-model="editClient.email_contact" class="form-control" /></td>
            <td><input v-model="editClient.email_compta" class="form-control" /></td>
            <td>
              <button @click="updateClient(client.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ client.nom }}</td>
            <td>{{ client.adresse }}</td>
            <td>{{ client.ville }}</td>
            <td>{{ client.telephone }}</td>
            <td>{{ client.email_contact }}</td>
            <td>{{ client.email_compta }}</td>
            <td>
              <button @click="startEdit(client)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteClient(client.id)" class="btn btn-danger btn-sm">🗑</button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>

    <div class="text-center mt-3">
      <button @click="$router.push('/admin/repertoires')" class="btn btn-secondary">Retour</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';

export default {
  name: 'Clients',
  setup() {
    const clients = ref([]);
    const newClient = ref({
      nom: '',
      adresse: '',
      ville: '',
      telephone: '',
      email_contact: '',
      email_compta: ''
    });

    const editId = ref(null);
    const editClient = ref({});

    const fetchClients = async () => {
      const querySnapshot = await getDocs(collection(db, 'clients'));
      clients.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const addClient = async () => {
      await addDoc(collection(db, 'clients'), newClient.value);
      newClient.value = {
        nom: '',
        adresse: '',
        ville: '',
        telephone: '',
        email_contact: '',
        email_compta: ''
      };
      fetchClients();
    };

    const startEdit = (client) => {
      editId.value = client.id;
      editClient.value = { ...client };
    };

    const cancelEdit = () => {
      editId.value = null;
      editClient.value = {};
    };

    const updateClient = async (id) => {
      const docRef = doc(db, 'clients', id);
      await updateDoc(docRef, editClient.value);
      cancelEdit();
      fetchClients();
    };

    const deleteClient = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'clients', id));
        fetchClients();
      }
    };

    onMounted(fetchClients);

    return {
      clients,
      newClient,
      addClient,
      editId,
      editClient,
      startEdit,
      cancelEdit,
      updateClient,
      deleteClient
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
