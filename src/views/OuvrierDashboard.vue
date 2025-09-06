<template>
  <div class="container py-5">
    <div class="text-end mb-3">
      <button @click="logout" class="btn btn-outline-danger">Déconnexion</button>
    </div>

    <h2 class="text-center mb-4">Espace Ouvrier</h2>
    <p class="text-center text-muted mb-5">Bienvenue dans votre espace personnel</p>

    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="row">
          <!-- Saisie des heures -->
          <div class="col-md-6 mb-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body text-center">
                <div class="mb-3">
                  <i class="fas fa-clock fa-3x text-primary"></i>
                </div>
                <h5 class="card-title">Saisie des Heures</h5>
                <p class="card-text">Enregistrez vos heures de travail quotidiennes</p>
                <router-link to="/ouvrier/heures" class="btn btn-primary">
                  Saisir mes heures
                </router-link>
              </div>
            </div>
          </div>

          <!-- Gestion des absences -->
          <div class="col-md-6 mb-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body text-center">
                <div class="mb-3">
                  <i class="fas fa-calendar-times fa-3x text-warning"></i>
                </div>
                <h5 class="card-title">Mes Absences</h5>
                <p class="card-text">Demandez vos congés, maladie, accidents</p>
                <router-link to="/ouvrier/absences" class="btn btn-warning">
                  Gérer mes absences
                </router-link>
              </div>
            </div>
          </div>
          
          <!-- Aide -->
          <div class="col-md-6 mb-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body text-center">
                <div class="mb-3">
                  <i class="fas fa-question-circle fa-3x text-info"></i>
                </div>
                <h5 class="card-title">Centre d'Aide</h5>
                <p class="card-text">Guides et FAQ pour utiliser le système</p>
                <router-link to="/aide" class="btn btn-info">
                  Consulter l'aide
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Résumé rapide -->
        <div class="card mt-4">
          <div class="card-header">
            <h5 class="mb-0">Résumé de la semaine</h5>
          </div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-md-4">
                <h6 class="text-muted">Heures cette semaine</h6>
                <h4 class="text-primary">{{ heuresSemaine }}h</h4>
              </div>
              <div class="col-md-4">
                <h6 class="text-muted">Heures ce mois</h6>
                <h4 class="text-success">{{ heuresMois }}h</h4>
              </div>
              <div class="col-md-4">
                <h6 class="text-muted">Dernière saisie</h6>
                <h6 class="text-info">{{ derniereSaisie }}</h6>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase.js';

const router = useRouter();
const heuresSemaine = ref(0);
const heuresMois = ref(0);
const derniereSaisie = ref('-');

const logout = async () => {
  try {
    await supabase.auth.signOut();
    localStorage.clear(); // Pulisce anche i dati locali
    router.push('/');
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};

const loadStats = async () => {
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) return;
  
  try {
    const { data: allHeures, error } = await supabase
      .from('heures_ouvriers')
      .select('*')
      .eq('ouvrier_id', userEmail);
    
    if (error) throw error;
    
    const heuresData = allHeures || [];
    
    // Calcola inizio settimana (lunedì)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calcola inizio mese
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Filtra ore della settimana
    const heuresThisWeek = heuresData.filter(heure => {
      const heureDate = new Date(heure.date);
      return heureDate >= startOfWeek;
    });
    
    // Filtra ore del mese
    const heuresThisMonth = heuresData.filter(heure => {
      const heureDate = new Date(heure.date);
      return heureDate >= startOfMonth;
    });
    
    // Calcola totali
    heuresSemaine.value = heuresThisWeek.reduce((sum, h) => sum + (h.heures || 0), 0);
    heuresMois.value = heuresThisMonth.reduce((sum, h) => sum + (h.heures || 0), 0);
    
    // Trova ultima saisie
    if (heuresData.length > 0) {
      const sortedHeures = heuresData.sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastHeure = sortedHeures[0];
      const lastDate = new Date(lastHeure.date);
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        derniereSaisie.value = 'Aujourd\'hui';
      } else if (diffDays === 1) {
        derniereSaisie.value = 'Hier';
      } else {
        derniereSaisie.value = `Il y a ${diffDays} jours`;
      }
    } else {
      derniereSaisie.value = 'Aucune saisie';
    }
    
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    // Valeurs par défaut en cas d'erreur
    heuresSemaine.value = 0;
    heuresMois.value = 0;
    derniereSaisie.value = '-';
  }
};

onMounted(() => {
  // Carica statistiche se l'utente è loggato
  const userEmail = localStorage.getItem('userEmail');
  if (userEmail) {
    loadStats();
  }
});
</script>

<style scoped>
.card {
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-2px);
}

.fa-3x {
  font-size: 3rem;
}
</style>