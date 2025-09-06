
<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin" />

    <h2 class="text-center mb-4">Gestion des Devis</h2>
    <div>
      <!-- Pulsante per creare un nuovo devis -->
      <router-link class="btn btn-primary" to="/admin/devis/create">➕ Nouveau Devis</router-link>
    </div>
    <DevisList :show-title="false" />
  </div>
</template>

<script>
import DevisList from '@/views/devis/DevisList.vue';
import RetourButton from '@/components/RetourButton.vue';

export default {
  name: 'Devis',
  components: {
    DevisList,
    RetourButton
  }
};
</script>
