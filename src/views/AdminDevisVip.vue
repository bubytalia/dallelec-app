<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    <h2 class="text-center mb-4">📨 Devis VIP - Client</h2>

    <!-- Filtres -->
    <div class="row mb-3">
      <div class="col-md-4">
        <select v-model="filterStatus" class="form-select">
          <option value="">Tous les états</option>
          <option value="En attente">En attente</option>
          <option value="Brouillon">Brouillon</option>
          <option value="Accepté">Accepté</option>
          <option value="Non accepté">Non accepté</option>
        </select>
      </div>
    </div>

    <!-- Tableau -->
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Devis VIP ({{ filteredDevis.length }})</h5>
      </div>
      <div class="card-body table-responsive">
        <table v-if="filteredDevis.length > 0" class="table table-sm table-hover">
          <thead>
            <tr>
              <th>Date</th>
              <th>Numéro</th>
              <th>Chantier</th>
              <th>Client</th>
              <th>Type pose</th>
              <th class="text-end">Montant HT</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in filteredDevis" :key="d.id" :class="{'table-warning': d.status === 'En attente'}">
              <td>{{ formatDate(d.created_at) }}</td>
              <td>{{ d.numero }}</td>
              <td>{{ d.nom }}</td>
              <td>{{ getClientName(d.client_id) }}</td>
              <td>{{ d.vip_type_pose === 'din' ? 'DIN' : 'Béton' }}</td>
              <td class="text-end">{{ (d.total || 0).toFixed(2) }} CHF</td>
              <td>
                <select v-model="d.status" @change="updateStatus(d)" class="form-select form-select-sm" style="width:130px">
                  <option value="Brouillon">Brouillon</option>
                  <option value="En attente">En attente</option>
                  <option value="Accepté">Accepté</option>
                  <option value="Non accepté">Non accepté</option>
                </select>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" @click="voirDevis(d.id)">Voir</button>
                <button class="btn btn-sm btn-outline-danger" @click="deleteDevis(d.id)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-muted text-center py-3">Aucun devis VIP.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import RetourButton from '@/components/RetourButton.vue';

const router = useRouter();
const devisList = ref([]);
const clients = ref([]);
const filterStatus = ref('');

const filteredDevis = computed(() => {
  if (!filterStatus.value) return devisList.value;
  return devisList.value.filter(d => d.status === filterStatus.value);
});

onMounted(async () => {
  const [devisRes, clientsRes] = await Promise.all([
    supabase.from('devis').select('*').eq('use_listino_vip', true).order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom')
  ]);
  devisList.value = devisRes.data || [];
  clients.value = clientsRes.data || [];
});

const getClientName = (clientId) => {
  const c = clients.value.find(cl => cl.id == clientId);
  return c ? c.nom : clientId;
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR');
};

const updateStatus = async (d) => {
  await supabase.from('devis').update({ status: d.status, updated_at: new Date().toISOString() }).eq('id', d.id);
};

const voirDevis = (id) => {
  router.push(`/admin/devis/edit/${id}`);
};

const deleteDevis = async (id) => {
  if (!confirm('Supprimer ce devis VIP?')) return;
  await supabase.from('devis').delete().eq('id', id);
  devisList.value = devisList.value.filter(d => d.id !== id);
};
</script>
