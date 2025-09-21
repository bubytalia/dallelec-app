<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="text-success">Système Ordres Matériaux</h1>
        <p class="text-muted">Bienvenue {{ user?.email }}</p>
      </div>
      <div>
        <router-link to="/" class="btn btn-outline-secondary me-2">
          ← Sélection système
        </router-link>
        <button @click="logout" class="btn btn-outline-danger">
          Déconnexion
        </button>
      </div>
    </div>

    <div class="row">
      <div class="col-md-4 mb-4">
        <div class="card border-primary">
          <div class="card-body text-center">
            <i class="bi bi-search" style="font-size: 3rem; color: #0d6efd;"></i>
            <h5 class="card-title mt-3">Catalogue Matériaux</h5>
            <p class="card-text">Rechercher et consulter les matériaux disponibles</p>
            <button class="btn btn-primary" disabled>
              Bientôt disponible
            </button>
          </div>
        </div>
      </div>

      <div class="col-md-4 mb-4">
        <div class="card border-warning">
          <div class="card-body text-center">
            <i class="bi bi-cart" style="font-size: 3rem; color: #ffc107;"></i>
            <h5 class="card-title mt-3">Mes Commandes</h5>
            <p class="card-text">Gérer les commandes en cours et historique</p>
            <button class="btn btn-warning" disabled>
              Bientôt disponible
            </button>
          </div>
        </div>
      </div>

      <div class="col-md-4 mb-4">
        <div class="card border-info">
          <div class="card-body text-center">
            <i class="bi bi-truck" style="font-size: 3rem; color: #0dcaf0;"></i>
            <h5 class="card-title mt-3">Livraisons</h5>
            <p class="card-text">Suivre les livraisons et réceptions</p>
            <button class="btn btn-info" disabled>
              Bientôt disponible
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="alert alert-info">
      <h5>🚧 Système en développement</h5>
      <p class="mb-0">
        Le système de commandes matériaux est en cours de développement. 
        Les fonctionnalités seront ajoutées progressivement.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(null);

onMounted(() => {
  const userData = localStorage.getItem('ordini_user');
  if (userData) {
    user.value = JSON.parse(userData);
  } else {
    router.push('/ordini/login');
  }
});

const logout = () => {
  localStorage.removeItem('ordini_user');
  router.push('/');
};
</script>
</template>