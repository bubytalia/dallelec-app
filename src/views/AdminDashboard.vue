<template>
  <div class="container mt-5 text-center">
    <!-- Header con logout -->
    <div class="d-flex justify-content-end mb-3">
      <button @click="handleLogout" class="btn btn-outline-danger">
        <i class="fas fa-sign-out-alt"></i> Se déconnecter
      </button>
    </div>
    
    <h2>Tableau de bord administrateur</h2>
    <p>Bienvenue dans le système de gestion Dallelec.</p>
    
    <!-- Section Commercial -->
    <div class="row justify-content-center mt-4">
      <div class="col-12">
        <h5 class="text-primary mb-3">Commercial</h5>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/devis" class="btn btn-outline-primary w-100">Devis</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/associer-devis" class="btn btn-outline-primary w-100">Associer Devis</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/repertoires" class="btn btn-outline-primary w-100">Répertoires</router-link>
      </div>
    </div>

    <!-- Section Financier -->
    <div class="row justify-content-center mt-4">
      <div class="col-12">
        <h5 class="text-success mb-3">Financier</h5>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/facturation" class="btn btn-outline-success w-100">💰 Facturation</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/bilans" class="btn btn-outline-success w-100">📊 Bilans Financiers</router-link>
      </div>
    </div>

    <!-- Section Personnel -->
    <div class="row justify-content-center mt-4">
      <div class="col-12">
        <h5 class="text-warning mb-3">Personnel</h5>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/monitoring-heures" class="btn btn-outline-warning w-100">📊 Monitoring Heures</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/report-mensuel" class="btn btn-outline-warning w-100">Rapports Heures</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/gestion-feries" class="btn btn-outline-warning w-100">Gestion Congés</router-link>
      </div>
    </div>

    <!-- Section Administration -->
    <div class="row justify-content-center mt-4">
      <div class="col-12">
        <h5 class="text-danger mb-3">Administration</h5>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/security" class="btn btn-outline-danger w-100">🛡️ Sécurité</router-link>
      </div>
      <div class="col-md-3 m-2">
        <button @click="runFirstLoginScript" class="btn btn-outline-danger w-100" :disabled="scriptRunning">
          <span v-if="scriptRunning" class="spinner-border spinner-border-sm me-2"></span>
          🔐 Reset Logins
        </button>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/backup" class="btn btn-outline-danger w-100">🛡️ Backup Database</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/aide" class="btn btn-outline-danger w-100">❓ Aide</router-link>
      </div>
    </div>
    
    <!-- Alert risultato script -->
    <div v-if="scriptResult" class="alert mt-3" :class="scriptResult.success ? 'alert-success' : 'alert-danger'">
      <strong>{{ scriptResult.success ? '✅ Succès!' : '❌ Erreur!' }}</strong>
      {{ scriptResult.message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { useRouter } from 'vue-router';
import { setFirstLoginForAllUsers } from '@/utils/setFirstLoginAll';

const router = useRouter();
const scriptRunning = ref(false);
const scriptResult = ref(null);

const handleLogout = async () => {
  try {
    console.log('Logout in corso...');
    await signOut(auth);
    console.log('Logout completato, reindirizzamento...');
    window.location.href = '/';
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    alert('Erreur lors de la déconnexion: ' + error.message);
  }
};

const runFirstLoginScript = async () => {
  scriptRunning.value = true;
  scriptResult.value = null;
  
  try {
    const result = await setFirstLoginForAllUsers();
    scriptResult.value = {
      success: result.success,
      message: result.success 
        ? `${result.updated} utilisateurs mis à jour avec succès`
        : `Erreur: ${result.error}`
    };
  } catch (error) {
    scriptResult.value = {
      success: false,
      message: `Erreur: ${error.message}`
    };
  } finally {
    scriptRunning.value = false;
  }
};
</script>
