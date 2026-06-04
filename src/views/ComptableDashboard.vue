<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>📊 Espace Comptable - {{ userName }}</h2>
      <button class="btn btn-outline-danger btn-sm" @click="logout">Déconnexion</button>
    </div>

    <div class="row justify-content-center g-4">
      <div class="col-md-4">
        <router-link to="/comptable/facturation" class="text-decoration-none">
          <div class="card h-100 border-primary">
            <div class="card-body text-center py-5">
              <i class="bi bi-receipt text-primary" style="font-size: 3rem;"></i>
              <h4 class="mt-3">Facturation</h4>
              <p class="text-muted">Factures émises et statuts</p>
            </div>
          </div>
        </router-link>
      </div>
      <div class="col-md-4">
        <router-link to="/comptable/scadenziario" class="text-decoration-none">
          <div class="card h-100 border-warning">
            <div class="card-body text-center py-5">
              <i class="bi bi-calendar-event text-warning" style="font-size: 3rem;"></i>
              <h4 class="mt-3">Échéancier</h4>
              <p class="text-muted">Échéances et rappels</p>
            </div>
          </div>
        </router-link>
      </div>
      <div class="col-md-4">
        <router-link to="/comptable/bilans" class="text-decoration-none">
          <div class="card h-100 border-success">
            <div class="card-body text-center py-5">
              <i class="bi bi-graph-up text-success" style="font-size: 3rem;"></i>
              <h4 class="mt-3">Bilans</h4>
              <p class="text-muted">Bilans financiers</p>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <div class="text-center mt-4">
      <small class="text-muted">🔒 Accès en lecture seule</small>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';

const router = useRouter();
const userName = ref(localStorage.getItem('userName') || 'Comptable');

const logout = async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  router.push('/login');
};
</script>
