<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>⭐ Espace Client - {{ clientName }}</h2>
      <button class="btn btn-outline-danger btn-sm" @click="logout">Déconnexion</button>
    </div>

    <!-- Bouton nouveau devis -->
    <div class="mb-4">
      <button class="btn btn-primary btn-lg" @click="newDevis">➕ Nouveau Devis</button>
    </div>

    <!-- Liste des devis -->
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Mes Devis ({{ devisList.length }})</h5>
      </div>
      <div class="card-body table-responsive">
        <table v-if="devisList.length > 0" class="table table-sm table-hover">
          <thead>
            <tr>
              <th>Date</th>
              <th>Numéro</th>
              <th>Chantier</th>
              <th>Type pose</th>
              <th class="text-end">Montant HT</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in devisList" :key="d.id">
              <td>{{ formatDate(d.created_at) }}</td>
              <td>{{ d.numero }}</td>
              <td>{{ d.nom }}</td>
              <td>{{ d.vip_type_pose === 'din' ? 'DIN' : 'Béton' }}</td>
              <td class="text-end">{{ (d.total || 0).toFixed(2) }} CHF</td>
              <td>
                <span class="badge" :class="getStatusClass(d.status)">{{ d.status || 'Brouillon' }}</span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" @click="editDevis(d.id)">Voir/Modifier</button>
                <button v-if="d.status !== 'Accepté'" class="btn btn-sm btn-outline-danger" @click="deleteDevis(d.id)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-muted text-center py-3">Aucun devis pour le moment.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';

const router = useRouter();
const clientName = ref(localStorage.getItem('userName') || 'Client');
const clientId = ref(localStorage.getItem('clientVipId') || '');
const devisList = ref([]);

onMounted(async () => {
  if (!clientId.value) {
    router.push('/login');
    return;
  }
  await loadDevis();
});

const loadDevis = async () => {
  const { data } = await supabase
    .from('devis')
    .select('*')
    .eq('client_id', clientId.value)
    .eq('use_listino_vip', true)
    .order('created_at', { ascending: false });
  devisList.value = data || [];
};

const newDevis = () => {
  router.push('/client/devis/create');
};

const editDevis = (id) => {
  router.push(`/client/devis/${id}`);
};

const deleteDevis = async (id) => {
  if (!confirm('Supprimer ce devis?')) return;
  await supabase.from('devis').delete().eq('id', id);
  await loadDevis();
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR');
};

const getStatusClass = (status) => {
  const map = { 'Brouillon': 'bg-warning', 'En attente': 'bg-info', 'Accepté': 'bg-success', 'Non accepté': 'bg-danger', 'En cours': 'bg-primary' };
  return map[status] || 'bg-secondary';
};

const logout = async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  router.push('/login');
};
</script>
