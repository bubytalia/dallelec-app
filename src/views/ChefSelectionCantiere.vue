<template>
  <div class="container py-4">
    <RetourButton to="/chef" />

    <h2 class="text-center mb-4">Sélection Chantier - Métrages</h2>

    <div class="row">
      <div class="col-md-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Choisir un chantier</h5>
          </div>
          <div class="card-body">
            <div class="row" v-for="chantier in chantiers" :key="chantier.id">
              <div class="col-md-8">
                <h6>{{ chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '' }}{{ chantier.nom }}</h6>
                <p class="text-muted mb-1">{{ chantier.adresse }}</p>
                <span class="badge" :class="chantier.modalitaResoconto === 'percentuale' ? 'bg-info' : 'bg-secondary'">
                  {{ chantier.modalitaResoconto === 'percentuale' ? '📊 Resoconto Percentuel' : '📏 Métrages Détaillés' }}
                </span>
              </div>
              <div class="col-md-4 text-end">
                <button 
                  class="btn btn-primary"
                  @click="accederCantiere(chantier)"
                >
                  Accéder
                </button>
              </div>
              <hr class="mt-3">
            </div>
            
            <div v-if="chantiers.length === 0" class="text-center text-muted">
              Aucun chantier disponible
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

const router = useRouter();
const chantiers = ref([]);

const fetchChantiers = async () => {
  const snapshot = await getDocs(collection(db, 'chantiers'));
  const allChantiers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // TODO: Sostituire con l'email del chef loggato
  const chefEmail = 'chef@dallelec.com'; // Temporaneo
  
  // Filtra solo i cantieri assegnati a questo chef
  chantiers.value = allChantiers.filter(c => c.capocantiere === chefEmail);
};

const accederCantiere = (chantier) => {
  if (chantier.modalitaResoconto === 'percentuale') {
    router.push(`/chef/chantiers/resoconto-percentuale?chantier=${chantier.id}`);
  } else {
    router.push(`/chef/chantiers/metrages-detail?chantier=${chantier.id}`);
  }
};

onMounted(fetchChantiers);
</script>