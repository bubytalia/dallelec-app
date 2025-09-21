<template>
  <div class="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
    <div class="row w-100">
      <div class="col-12 text-center mb-5">
        <img src="@/assets/logo.jpg" alt="DALLELEC" class="mb-4" style="height: 80px;">
        <h1 class="display-4 text-primary mb-2">DALLELEC</h1>
        <p class="lead text-muted">Sélectionnez votre système</p>
      </div>
      
      <div class="col-md-6 mb-4">
        <div class="card h-100 shadow-sm border-primary">
          <div class="card-body text-center p-5">
            <div class="mb-4">
              <i class="bi bi-building" style="font-size: 4rem; color: #0d6efd;"></i>
            </div>
            <h3 class="card-title text-primary">Système Gestionnaire</h3>
            <p class="card-text text-muted mb-4">
              Gestion complète de l'entreprise:<br>
              Devis, Chantiers, Métrages, Facturation, Heures
            </p>
            <router-link to="/gestionale/login" class="btn btn-primary btn-lg px-4">
              Accéder au Gestionnaire
            </router-link>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 mb-4">
        <div class="card h-100 shadow-sm border-success">
          <div class="card-body text-center p-5">
            <div class="mb-4">
              <i class="bi bi-box-seam" style="font-size: 4rem; color: #198754;"></i>
            </div>
            <h3 class="card-title text-success">Système Ordres</h3>
            <p class="card-text text-muted mb-4">
              Commandes de matériaux:<br>
              Catalogues, Ordres, Fournisseurs, Livraisons
            </p>
            <router-link to="/ordini/login" class="btn btn-success btn-lg px-4">
              Accéder aux Ordres
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Pagina di selezione sistema - nessuna logica necessaria
</script>

<style scoped>
.card {
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-5px);
}

.btn {
  transition: all 0.2s;
}
</style>