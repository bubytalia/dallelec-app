<template>
  <div class="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
    <div class="row justify-content-center w-100">
      <div class="col-md-6 col-lg-4">
        <div class="card shadow">
          <div class="card-body p-5">
            <div class="text-center mb-4">
              <img src="@/assets/logo.jpg" alt="DALLELEC" class="mb-3" style="height: 60px;">
              <h2 class="text-success">Système Ordres</h2>
              <p class="text-muted">Commandes de matériaux</p>
            </div>
            
            <form @submit.prevent="login">
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input 
                  v-model="email" 
                  type="email" 
                  class="form-control" 
                  required
                  placeholder="votre.email@dallelec.com"
                >
              </div>
              
              <div class="mb-3">
                <label class="form-label">Mot de passe</label>
                <input 
                  v-model="password" 
                  type="password" 
                  class="form-control" 
                  required
                  placeholder="••••••••"
                >
              </div>
              
              <button type="submit" class="btn btn-success w-100 mb-3" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Se connecter
              </button>
              
              <div v-if="error" class="alert alert-danger">
                {{ error }}
              </div>
            </form>
            
            <div class="text-center mt-4">
              <router-link to="/" class="text-muted">
                ← Retour à la sélection
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const login = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // TODO: Implementare autenticazione sistema ordini
    // Per ora login temporaneo
    if (email.value && password.value) {
      localStorage.setItem('ordini_user', JSON.stringify({
        email: email.value,
        role: 'chef_ordini',
        system: 'ordini'
      }));
      
      router.push('/ordini/dashboard');
    } else {
      error.value = 'Email e password richiesti';
    }
  } catch (err) {
    error.value = 'Errore di connessione';
  } finally {
    loading.value = false;
  }
};
</script>
</template>