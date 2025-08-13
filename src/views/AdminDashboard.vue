<template>
  <div class="container mt-5 text-center">
    <!-- Pulsante logout in alto a destra -->
    <div class="d-flex justify-content-end mb-3">
      <button @click="handleLogout" class="btn btn-outline-danger">
        <i class="fas fa-sign-out-alt"></i> Se déconnecter
      </button>
    </div>
    
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
        <router-link to="/admin/repertoires/chantiers" class="btn btn-outline-success w-100">Chantiers</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/bilans" class="btn btn-outline-success w-100">📊 Bilans Financiers</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/report-mensuel" class="btn btn-outline-info w-100">Report Mensuel</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/gestion-feries" class="btn btn-outline-warning w-100">Gestion Congés</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/associer-devis" class="btn btn-outline-info w-100">Associer Devis</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/admin/facturation" class="btn btn-outline-warning w-100">💰 Facturation</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { useRouter } from 'vue-router';

const router = useRouter();

const handleLogout = async () => {
  try {
    console.log('Logout in corso...');
    await signOut(auth);
    console.log('Logout completato, reindirizzamento...');
    // Usa window.location.href per forzare un reload completo
    window.location.href = '/';
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    alert('Erreur lors de la déconnexion: ' + error.message);
  }
};
</script>
