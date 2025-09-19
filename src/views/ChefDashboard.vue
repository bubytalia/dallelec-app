<template>
  <div class="container py-5">
    <RetourButton to="/" />
    
    <!-- Alert per ore mancanti -->
    <div v-if="showHoursAlert" class="alert alert-warning alert-dismissible fade show" role="alert">
      <strong>Rappel:</strong> Vous n'avez pas encore saisi vos heures pour aujourd'hui.
      <router-link to="/chef/heures" class="btn btn-warning btn-sm ms-2">Saisir mes heures</router-link>
      <button type="button" class="btn-close" @click="dismissAlert"></button>
    </div>

    <!-- Alert per risposte richieste ferie -->
    <div v-if="showFerieAlert" class="alert alert-info alert-dismissible fade show" role="alert">
      <strong>Demande de congé:</strong> {{ ferieAlertMessage }}
      <router-link to="/chef/absences" class="btn btn-info btn-sm ms-2">Voir mes demandes</router-link>
      <button type="button" class="btn-close" @click="dismissFerieAlert"></button>
    </div>

    <h2 class="text-center mb-4">Tableau de bord Chef de Chantier</h2>
    <p class="text-center">Bienvenue dans le système de gestion Dallelec.</p>
    <div class="row justify-content-center mt-4">
      <div class="col-md-3 m-2">
        <router-link to="/chef/heures" class="btn btn-outline-primary w-100">Heures</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/chef/chantiers" class="btn btn-outline-success w-100">Chantiers</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/chef/absences" class="btn btn-outline-warning w-100">Absences</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/chef/premi" class="btn btn-outline-info w-100">Primes</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/chef/chantiers/metrages" class="btn btn-outline-secondary w-100">Métrages</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/chef/chantiers/metrages-historique" class="btn btn-outline-dark w-100">📊 Historique Métrages</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/chef/chantiers/resoconto-finale" class="btn btn-outline-danger w-100">📋 Resoconto Final</router-link>
      </div>
      <div class="col-md-3 m-2">
        <router-link to="/aide" class="btn btn-outline-info w-100">❓ Aide</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

const showHoursAlert = ref(false);
const showFerieAlert = ref(false);
const ferieAlertMessage = ref('');

const checkTodayHours = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userEmail = localStorage.getItem('userEmail');
    
    // Controlla se il chef è in assenza oggi
    const { data: absences } = await supabase
      .from('absences')
      .select('*')
      .eq('user_id', userEmail)
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today);
    
    // Se è in assenza, non mostrare alert
    if (absences && absences.length > 0) {
      showHoursAlert.value = false;
      return;
    }
    
    // Controlla se ha già inserito ore per oggi (tabella potrebbe non esistere)
    try {
      const { data: heures } = await supabase
        .from('heures_chef_propres')
        .select('*')
        .eq('date', today)
        .eq('chef_id', userEmail);
      
      showHoursAlert.value = !heures || heures.length === 0;
    } catch (err) {
      // Tabella non esiste, mostra alert
      showHoursAlert.value = true;
    }
    
  } catch (error) {
    console.error('Errore nel controllo delle ore:', error);
  }
};

const checkFerieResponses = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const today = new Date().toISOString().split('T')[0];
    
    // Controlla le richieste di ferie del chef che hanno ricevuto risposta oggi
    const { data: absences } = await supabase
      .from('absences')
      .select('*')
      .eq('user_id', userEmail)
      .in('status', ['approved', 'rejected'])
      .gte('updated_at', today)
      .order('updated_at', { ascending: false });
    
    if (absences && absences.length > 0) {
      const latestResponse = absences[0];
      if (latestResponse.status === 'approved') {
        ferieAlertMessage.value = `Votre demande de ${getTypeLabel(latestResponse.type)} a été approuvée !`;
      } else {
        ferieAlertMessage.value = `Votre demande de ${getTypeLabel(latestResponse.type)} a été refusée.`;
      }
      showFerieAlert.value = true;
    }
    
  } catch (error) {
    console.error('Errore nel controllo delle risposte ferie:', error);
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'vacances': return 'Vacances';
    case 'maladie': return 'Maladie';
    case 'accident': return 'Accident';
    case 'vacances_sans_solde': return 'Vacances sans solde';
    case 'cours': return 'Cours';
    default: return type;
  }
};

const dismissAlert = () => {
  showHoursAlert.value = false;
};

const dismissFerieAlert = () => {
  showFerieAlert.value = false;
};

onMounted(() => {
  checkTodayHours();
  checkFerieResponses();
});
</script>

