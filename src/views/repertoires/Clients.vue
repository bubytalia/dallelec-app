<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

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
      <div class="col">
        <select v-model="newClient.paiement_id" class="form-control">
          <option value="">Conditions de paiement</option>
          <option v-for="paiement in paiements" :key="paiement.id" :value="paiement.id">
            {{ paiement.nom }}
          </option>
        </select>
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
          <th>Conditions paiement</th>
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
              <select v-model="editClient.paiement_id" class="form-control">
                <option value="">-</option>
                <option v-for="paiement in paiements" :key="paiement.id" :value="paiement.id">
                  {{ paiement.nom }}
                </option>
              </select>
            </td>
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
            <td>{{ getPaiementNom(client.paiement_id) }}</td>
            <td>
              <button @click="startEdit(client)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteClient(client.id)" class="btn btn-danger btn-sm">🗑</button>
            </td>
          </template>
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
  name: 'Clients',
  components: {
    RetourButton
  },
  setup() {
    const clients = ref([]);
    const paiements = ref([]);
    const newClient = ref({
      nom: '',
      adresse: '',
      ville: '',
      telephone: '',
      email_contact: '',
      email_compta: '',
      paiement_id: ''
    });

    const editId = ref(null);
    const editClient = ref({});

    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('nom');
        
        if (error) throw error;
        clients.value = data || [];
      } catch (error) {
        console.error('Errore caricamento clients:', error);
      }
    };

    const fetchPaiements = async () => {
      try {
        const { data, error } = await supabase
          .from('paiements')
          .select('*')
          .order('nom');
        
        if (error) throw error;
        paiements.value = data || [];
      } catch (error) {
        console.error('Errore caricamento paiements:', error);
      }
    };

    const getPaiementNom = (paiementId) => {
      const paiement = paiements.value.find(p => p.id === paiementId);
      return paiement ? paiement.nom : '-';
    };

    const addClient = async () => {
      try {
        const { error } = await supabase
          .from('clients')
          .insert(newClient.value);
        
        if (error) throw error;
        newClient.value = {
          nom: '',
          adresse: '',
          ville: '',
          telephone: '',
          email_contact: '',
          email_compta: '',
          paiement_id: ''
        };
        fetchClients();
      } catch (error) {
        console.error('Errore aggiunta client:', error);
      }
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
      try {
        const { error } = await supabase
          .from('clients')
          .update(editClient.value)
          .eq('id', id);
        
        if (error) throw error;
        cancelEdit();
        fetchClients();
      } catch (error) {
        console.error('Errore aggiornamento client:', error);
      }
    };

    const deleteClient = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        try {
          const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          fetchClients();
        } catch (error) {
          console.error('Errore eliminazione client:', error);
        }
      }
    };

    onMounted(() => {
      fetchClients();
      fetchPaiements();
    });

    return {
      clients,
      paiements,
      newClient,
      addClient,
      editId,
      editClient,
      startEdit,
      cancelEdit,
      updateClient,
      deleteClient,
      getPaiementNom
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
