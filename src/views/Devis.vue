<template>
  <div class="container py-5">
    <h2 class="text-center mb-4">Gestion des Devis</h2>

    <div class="text-end mb-4">
      <router-link to="/admin/devis/create" class="btn btn-primary">Nouveau Devis</router-link>
    </div>

    <!-- Qui montiamo il componente della lista -->
    <DevisList />

    <div class="text-center mt-4">
      <router-link to="/admin" class="btn btn-secondary">Retour</router-link>
    </div>
  </div>
</template>

<script>
import DevisList from './DevisList.vue'; // importa il componente

export default {
  name: 'Devis',
  components: {
    DevisList
  }
};
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: auto;
}
</style>
