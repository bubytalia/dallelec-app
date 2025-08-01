
<template>
  <div class="container py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="m-0">Gestion des Devis</h2>
      <div>
        <!-- Pulsante per tornare alla dashboard -->
        <router-link class="btn btn-outline-secondary me-2" to="/admin">← Retour</router-link>
        <!-- Pulsante per creare un nuovo devis -->
        <router-link class="btn btn-primary" to="/admin/devis/create">➕ Nouveau Devis</router-link>
      </div>
    </div>
    <DevisList :show-title="false" />
  </div>
</template>

<script setup>
import DevisList from './DevisList.vue';
// Non è più necessario usare useRouter qui perché usiamo router-link in template
</script>
