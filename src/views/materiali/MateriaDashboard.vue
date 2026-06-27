<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>📦 Gestion Matériaux</h2>
      <router-link to="/admin" class="btn btn-outline-secondary">← Retour</router-link>
    </div>

    <div class="row justify-content-center">
      <div class="col-md-4 mb-3">
        <router-link to="/admin/materiali/fornitori" class="btn btn-outline-primary w-100 p-4">
          <div class="mb-2" style="font-size:2em">🚚</div>
          <strong>Fournisseurs</strong>
          <div class="small text-muted">Fournisseurs et leurs articles</div>
        </router-link>
      </div>
      <div class="col-md-4 mb-3">
        <router-link to="/admin/materiali/distinte" class="btn btn-outline-success w-100 p-4">
          <div class="mb-2" style="font-size:2em">📐</div>
          <strong>Liste Matériel par Article</strong>
          <div class="small text-muted">Composants par article et fournisseur</div>
        </router-link>
      </div>
      <div class="col-md-4 mb-3">
        <router-link to="/admin/materiali/supplements" class="btn btn-outline-warning w-100 p-4">
          <div class="mb-2" style="font-size:2em">🔧</div>
          <strong>Matériel Suppléments</strong>
          <div class="small text-muted">Composants par supplément et taille</div>
        </router-link>
      </div>
      <div class="col-md-4 mb-3">
        <router-link to="/admin/materiali/preventivi" class="btn btn-outline-danger w-100 p-4">
          <div class="mb-2" style="font-size:2em">🧮</div>
          <strong>Devis Matériaux</strong>
          <div class="small text-muted">Calcul pose + matériaux</div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'MateriaDashboard' }
</script>
