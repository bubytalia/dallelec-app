<template>
  <div class="container py-5">
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Devis</h2>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Numéro</th>
          <th>Nom</th>
          <th>Client</th>
          <th>Total</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="devis in devisList" :key="devis.id">
          <td><strong>{{ devis.numero }}</strong></td>
          <td>{{ devis.nom }}</td>
          <td>{{ getClientName(devis.client_id) }}</td>
          <td>{{ formatPrice(devis.total) }} CHF</td>
          <td>
            <span class="badge" :class="getStatusClass(devis.status)">
              {{ devis.status }}
            </span>
          </td>
          <td>
            <button class="btn btn-info btn-sm">👁️ Voir</button>
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
  name: 'Devis',
  components: {
    RetourButton
  },
  setup() {
    const devisList = ref([]);
    const clients = ref([]);

    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*');
        
        if (error) throw error;
        clients.value = data || [];
      } catch (error) {
        console.error('Errore caricamento clients:', error);
      }
    };

    const fetchDevis = async () => {
      try {
        const { data, error } = await supabase
          .from('devis')
          .select('*')
          .order('numero', { ascending: false });
        
        if (error) throw error;
        devisList.value = data || [];
      } catch (error) {
        console.error('Errore caricamento devis:', error);
      }
    };

    const getClientName = (clientId) => {
      if (!clientId) return '-';
      const client = clients.value.find(c => c.id == clientId);
      return client ? client.nom : 'Client inconnu';
    };

    const formatPrice = (price) => {
      if (!price) return '0.00';
      return parseFloat(price).toLocaleString('fr-CH', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    };

    const getStatusClass = (status) => {
      switch (status?.toLowerCase()) {
        case 'accepté': return 'bg-success';
        case 'en cours': return 'bg-warning';
        case 'refusé': return 'bg-danger';
        default: return 'bg-secondary';
      }
    };

    onMounted(async () => {
      await fetchClients();
      await fetchDevis();
    });

    return {
      devisList,
      getClientName,
      formatPrice,
      getStatusClass
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: auto;
}
</style>