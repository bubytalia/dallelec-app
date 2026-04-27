<template>
  <div class="container py-4">
    <RetourButton to="/admin" />

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
                <span class="badge" :class="(chantier.modalita_resoconto || chantier.modalitaResoconto) === 'percentuale' ? 'bg-info' : 'bg-secondary'">
                  {{ (chantier.modalita_resoconto || chantier.modalitaResoconto) === 'percentuale' ? '📊 Resoconto Percentuel' : '📏 Métrages Détaillés' }}
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
import { supabase } from '../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

const router = useRouter();
const chantiers = ref([]);

const fetchChantiers = async () => {
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .select('*')
      .order('nom');
    
    if (error) throw error;
    chantiers.value = data || [];
  } catch (error) {
    console.error('Erreur chargement chantiers:', error);
  }
};

const accederCantiere = (chantier) => {
  if ((chantier.modalita_resoconto || chantier.modalitaResoconto) === 'percentuale') {
    router.push(`/admin/resoconto-percentuale?chantier=${chantier.id}`);
  } else {
    router.push(`/admin/metrages-detail?chantier=${chantier.id}`);
  }
};

onMounted(fetchChantiers);
</script>
