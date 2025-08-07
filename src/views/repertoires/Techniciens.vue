<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Techniciens</h2>

    <div class="row mb-3">
      <div class="col">
        <input v-model="form.nom" placeholder="Nom" class="form-control" />
      </div>
      <div class="col">
        <input v-model="form.prenom" placeholder="Prénom" class="form-control" />
      </div>
    </div>
    <div class="row mb-3">
      <div class="col">
        <input v-model="form.telephone" placeholder="Téléphone" class="form-control" />
      </div>
      <div class="col">
        <input v-model="form.email" placeholder="E-mail" class="form-control" />
      </div>
    </div>
    <div class="row mb-3">
      <div class="col">
        <select v-model="form.clientId" class="form-select">
          <option disabled value="">Sélectionnez un client</option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.nom }}
          </option>
        </select>
      </div>
    </div>

    <div class="text-center mb-4">
      <button @click="saveTechnicien" class="btn btn-primary">
        {{ editId ? 'Modifier' : 'Ajouter' }}
      </button>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Prénom</th>
          <th>Téléphone</th>
          <th>E-mail</th>
          <th>Client</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in techniciens" :key="t.id">
          <td>{{ t.nom }}</td>
          <td>{{ t.prenom }}</td>
          <td>{{ t.telephone }}</td>
          <td>{{ t.email }}</td>
          <td>{{ t.clientName }}</td>
          <td>
            <button class="btn btn-sm btn-warning me-2" @click="edit(t)">✎</button>
            <button class="btn btn-sm btn-danger" @click="remove(t.id)">🗑️</button>
          </td>
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
  name: 'Techniciens',
  components: {
    RetourButton
  },
  setup() {
    const form = ref({
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      clientId: ''
    });

    const clients = ref([]);
    const techniciens = ref([]);
    const editId = ref(null);

    const fetchClients = async () => {
      const snap = await getDocs(collection(db, 'clients'));
      clients.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const fetchTechniciens = async () => {
      const snap = await getDocs(collection(db, 'techniciens'));
      techniciens.value = snap.docs.map(d => {
        const data = d.data();
        const client = clients.value.find(c => c.id === data.clientId);
        return {
          id: d.id,
          ...data,
          clientName: client ? client.nom : ''
        };
      });
    };

    const saveTechnicien = async () => {
      if (editId.value) {
        await updateDoc(doc(db, 'techniciens', editId.value), { ...form.value });
      } else {
        await addDoc(collection(db, 'techniciens'), { ...form.value });
      }
      form.value = { nom: '', prenom: '', telephone: '', email: '', clientId: '' };
      editId.value = null;
      fetchTechniciens();
    };

    const edit = (item) => {
      form.value = {
        nom: item.nom,
        prenom: item.prenom,
        telephone: item.telephone,
        email: item.email,
        clientId: item.clientId
      };
      editId.value = item.id;
    };

    const remove = async (id) => {
      await deleteDoc(doc(db, 'techniciens', id));
      fetchTechniciens();
    };

    onMounted(async () => {
      await fetchClients();
      await fetchTechniciens();
    });

    return {
      form,
      clients,
      techniciens,
      editId,
      saveTechnicien,
      edit,
      remove
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
