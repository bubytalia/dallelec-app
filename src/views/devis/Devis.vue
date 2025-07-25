
<template>
  <div class="container py-3">
    <h2>Gestion des Devis</h2>
    <router-link class="btn btn-primary my-3" to="/admin/devis/create">➕ Nouveau Devis</router-link>
    <DevisList />
  </div>
</template>

<script setup>
import DevisList from './DevisList.vue';
</script>
