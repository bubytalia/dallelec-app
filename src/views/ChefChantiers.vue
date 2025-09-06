<template>
  <div class="container py-5">
    <RetourButton to="/chef" />
    
    <h2 class="text-center mb-4">Gestion des Chantiers</h2>
    
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Bilan</h5>
          </div>
          <div class="card-body">
            <p>Consultez les bilans des chantiers où vous êtes autorisé.</p>
            <button @click="goToBilan" class="btn btn-primary">Voir les bilans</button>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Métrages</h5>
          </div>
          <div class="card-body">
            <p>Saisissez les métrages réalisés sur les chantiers.</p>
            <button @click="goToMetrages" class="btn btn-success">Saisir métrages</button>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-12">
        <h5>Mes chantiers autorisés</h5>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Adresse</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="chantier in chantiersAutorises" :key="chantier.id">
              <td>{{ chantier.nom }}</td>
              <td>{{ chantier.adresse }}</td>
              <td>
                <span :class="getStatusClass(chantier.statut)">
                  {{ chantier.statut || 'En cours' }}
                </span>
              </td>
              <td>
                <button @click="voirChantier(chantier.id)" class="btn btn-info btn-sm">Voir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

const router = useRouter();
const chantiersAutorises = ref([]);

const fetchChantiersAutorises = async () => {
  // TODO: Implementare logica per filtrare solo i cantieri autorizzati per questo chef
  // Per ora prendiamo tutti i cantieri
  const snapshot = await getDocs(collection(db, 'chantiers'));
  chantiersAutorises.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getStatusClass = (statut) => {
  switch (statut) {
    case 'Terminé': return 'badge bg-success';
    case 'En cours': return 'badge bg-warning';
    case 'En attente': return 'badge bg-secondary';
    default: return 'badge bg-warning';
  }
};

const goToBilan = () => {
  router.push('/chef/chantiers/bilan');
};

const goToMetrages = () => {
  router.push('/chef/chantiers/metrages');
};

const voirChantier = (id) => {
  router.push(`/chef/chantiers/${id}`);
};

onMounted(() => {
  fetchChantiersAutorises();
});
</script>

