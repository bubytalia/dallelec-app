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
import { supabase } from '../../supabase.js';
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
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('nom');
      
      if (error) {
        console.error('Errore caricamento clients:', error);
      } else {
        clients.value = data || [];
      }
    };

    const fetchTechniciens = async () => {
      const { data, error } = await supabase
        .from('techniciens')
        .select('*')
        .order('nom');
      
      if (error) {
        console.error('Errore caricamento techniciens:', error);
      } else {
        techniciens.value = (data || []).map(tech => {
          const client = clients.value.find(c => c.id == tech.client_id);
          return {
            ...tech,
            clientName: client ? client.nom : ''
          };
        });
      }
    };

    const saveTechnicien = async () => {
      if (editId.value) {
        const { error } = await supabase
          .from('techniciens')
          .update({
            nom: form.value.nom,
            prenom: form.value.prenom,
            telephone: form.value.telephone,
            email: form.value.email,
            client_id: form.value.clientId
          })
          .eq('id', editId.value);
        
        if (error) console.error('Errore aggiornamento:', error);
      } else {
        const { error } = await supabase
          .from('techniciens')
          .insert([{
            nom: form.value.nom,
            prenom: form.value.prenom,
            telephone: form.value.telephone,
            email: form.value.email,
            client_id: form.value.clientId
          }]);
        
        if (error) console.error('Errore inserimento:', error);
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
        clientId: item.client_id
      };
      editId.value = item.id;
    };

    const remove = async (id) => {
      const { error } = await supabase
        .from('techniciens')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Errore eliminazione:', error);
      } else {
        fetchTechniciens();
      }
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
