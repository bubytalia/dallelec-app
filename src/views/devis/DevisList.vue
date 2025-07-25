<template>
  <div class="container">
    <h2>Gestion des Devis</h2>

    <!-- Filtri -->
    <div class="row mb-3">
      <div class="col">
        <select v-model="filterClient" class="form-select">
          <option value="">Tous les clients</option>
          <option v-for="c in clients" :key="c.id" :value="c.nom">{{ c.nom }}</option>
        </select>
      </div>
      <div class="col">
        <select v-model="filterTechnicien" class="form-select">
          <option value="">Tous les techniciens</option>
          <option v-for="t in techniciens" :key="t.nom" :value="t.nom">{{ t.nom }}</option>
        </select>
      </div>
    </div>

    <!-- Tabella -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Date</th>
          <th>Client</th>
          <th>Technicien</th>
          <th>Remise Totale</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="devis in filteredDevis" :key="devis.id">
          <td>{{ formatDate(devis.createdAt) }}</td>
          <td>{{ getClientName(devis.clientId) }}</td>
          <td>{{ devis.technicien }}</td>
          <td>{{ calculerRemise(devis.remises) }}%</td>
          <td><button class="btn btn-sm btn-outline-secondary">Voir</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

// Data
const devis = ref([]);
const clients = ref([]);
const techniciens = ref([]);

const filterClient = ref('');
const filterTechnicien = ref('');

// Fetch data
onMounted(async () => {
  const devisSnap = await getDocs(collection(db, 'devis'));
  devis.value = devisSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const clientsSnap = await getDocs(collection(db, 'clients'));
  clients.value = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const techSnap = await getDocs(collection(db, 'techniciens'));
  techniciens.value = techSnap.docs.map(d => ({ id: d.id, ...d.data() }));
});

// Computed
const filteredDevis = computed(() => {
  return devis.value.filter(d => {
    const client = getClientName(d.clientId);
    const matchClient = !filterClient.value || client === filterClient.value;
    const matchTech = !filterTechnicien.value || d.technicien === filterTechnicien.value;
    return matchClient && matchTech;
  });
});

// Helpers
const getClientName = (id) => {
  return clients.value.find(c => c.id === id)?.nom || 'Inconnu';
};

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString();
};

const calculerRemise = (remises = {}) => {
  return Object.keys(remises).reduce((total, key) => total + Number(remises[key] || 0), 0);
};
</script>
