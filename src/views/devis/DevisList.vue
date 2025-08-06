
<template>
  <div class="container">
    <h2 v-if="showTitle">Gestion des Devis</h2>

    <!-- Tabella -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Date</th>
          <th>Numéro</th>
          <th>Client</th>
          <th>Technicien</th>
          <th>Chantier</th>
          <th>Montant (€)</th>
          <th>État</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="devis in filteredDevis" :key="devis.id">
          <td>{{ formatDate(devis.createdAt) }}</td>
          <td>{{ devis.numero || '—' }}</td>
          <td>{{ getClientName(devis.clientId) }}</td>
          <td>{{ devis.technicien || '—' }}</td>
          <td>{{ devis.nom || devis.adresse || '—' }}</td>
          <td>{{ formatMontant(getMontant(devis)) }}</td>
          <td>
            <span v-if="devis.draft">Brouillon</span>
            <select v-else v-model="devis.status" @change="updateDevisStatus(devis.id, devis.status)" class="form-select form-select-sm">
              <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-secondary me-1" @click="voirDevis(devis.id)">Voir</button>
            <button class="btn btn-sm btn-danger" @click="effacerDevis(devis.id)">Effacer</button>
          </td>
        </tr>
        <tr v-if="filteredDevis && filteredDevis.length === 0">
          <td colspan="8" class="text-center">Aucun devis trouvé.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '@/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const devisList = ref([]);
const showTitle = true;
const router = useRouter();

const statusOptions = ['Brouillon', 'En cours', 'Accepté', 'Non accepté'];

onMounted(async () => {
  const snapshot = await getDocs(collection(db, 'devis'));
  devisList.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

const filteredDevis = computed(() => devisList.value);

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
}

function formatMontant(val) {
  return val ? val.toFixed(2) : '0.00';
}

function getMontant(devis) {
  return devis.total || 0;
}

function getClientName(clientId) {
  return clientId || '—';
}

function voirDevis(id) {
  router.push(`/admin/devis/edit/${id}`);
}

function effacerDevis(id) {
  if (confirm("Voulez-vous vraiment supprimer ce devis ?")) {
    deleteDoc(doc(db, 'devis', id))
      .then(() => {
        devisList.value = devisList.value.filter(d => d.id !== id);
        alert("Devis supprimé.");
      })
      .catch(err => {
        console.error("Erreur lors de la suppression:", err);
        alert("Erreur lors de la suppression du devis.");
      });
  }
}

function updateDevisStatus(id, status) {
  updateDoc(doc(db, 'devis', id), { status })
    .then(() => {
      console.log(`Statut mis à jour pour le devis ${id}`);
    })
    .catch(err => {
      console.error("Erreur lors de la mise à jour du statut:", err);
    });
}
</script>
