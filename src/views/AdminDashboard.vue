<template>
  <div class="container mt-5 text-center">
    <!-- RIMOSSO IL LOGO -->
    <h2>Tableau de bord administrateur</h2>
    <p>Bienvenue dans le système de gestion Dallelec.</p>
    <div class="row justify-content-center mt-4">
      <div class="col-md-3 m-2">
        <router-link to="/admin/repertoires" class="btn btn-outline-primary w-100">Répertoires</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/devis" class="btn btn-outline-primary w-100">Devis</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/bilans" class="btn btn-outline-secondary w-100" disabled>Bilans (à venir)</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>
