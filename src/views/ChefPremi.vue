<template>
  <div class="container py-5">
    <RetourButton to="/chef" />
    
    <h2 class="text-center mb-4">Gestion des Primes</h2>
    
    <!-- Riepilogo generale premi -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Résumé des primes</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-primary">{{ totalHeuresPrevues.toFixed(1) }}h</h4>
                  <p>Total heures prévues</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-info">{{ totalHeuresImployees.toFixed(1) }}h</h4>
                  <p>Total heures employées</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-success">{{ totalHeuresGagnees.toFixed(1) }}h</h4>
                  <p>Heures gagnées</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-warning">{{ totalPrime.toFixed(2) }} CHF</h4>
                  <p>Prime totale estimée</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dettaglio per cantiere -->
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Détail par chantier</h5>
          </div>
          <div class="card-body">
            <div v-if="chantiersAvecMetrages.length === 0" class="text-center text-muted">
              Aucun chantier avec métrages enregistrés
            </div>
            <div v-else>
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Chantier</th>
                    <th>Heures prévues</th>
                    <th>Heures employées</th>
                    <th>Heures gagnées</th>
                    <th>Prime estimée</th>
                    <th>Dernière mise à jour</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="chantier in chantiersAvecMetrages" :key="chantier.id">
                    <td>
                      <strong>{{ chantier.nom }}</strong><br>
                      <small class="text-muted">{{ chantier.adresse }}</small>
                    </td>
                    <td>{{ chantier.heuresPrevues.toFixed(1) }}h</td>
                    <td>{{ chantier.heuresImployees.toFixed(1) }}h</td>
                    <td>
                      <span :class="chantier.heuresGagnees > 0 ? 'text-success' : 'text-danger'">
                        {{ chantier.heuresGagnees.toFixed(1) }}h
                      </span>
                    </td>
                    <td>
                      <span :class="chantier.prime > 0 ? 'text-success' : 'text-danger'">
                        {{ chantier.prime.toFixed(2) }} CHF
                      </span>
                    </td>
                    <td>{{ formatDate(chantier.derniereMiseAJour) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="table-primary">
                    <td><strong>Total</strong></td>
                    <td><strong>{{ totalHeuresPrevues.toFixed(1) }}h</strong></td>
                    <td><strong>{{ totalHeuresImployees.toFixed(1) }}h</strong></td>
                    <td><strong>{{ totalHeuresGagnees.toFixed(1) }}h</strong></td>
                    <td><strong>{{ totalPrime.toFixed(2) }} CHF</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Informazioni sul sistema premi -->
    <div class="row mt-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Informations sur le système de primes</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Formule de calcul:</h6>
                <ul>
                  <li><strong>Heures prévues:</strong> Calculées selon les standards de l'entreprise</li>
                  <li><strong>Heures employées:</strong> Somme des heures enregistrées (Chef + Collaborateurs)</li>
                  <li><strong>Heures gagnées:</strong> Heures prévues - Heures employées</li>
                  <li><strong>Prime:</strong> Heures gagnées × 26 CHF/h</li>
                </ul>
              </div>
              <div class="col-md-6">
                <h6>Conditions:</h6>
                <ul>
                  <li>Prime uniquement si heures gagnées > 0</li>
                  <li>Calcul basé sur les métrages enregistrés</li>
                  <li>Prime versée sur la buste de paie</li>
                  <li>Mise à jour mensuelle ou fin de projet</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

const chantiers = ref([]);
const metrages = ref([]);
const heuresPropres = ref([]);
const heuresInterim = ref([]);

const fetchChantiers = async () => {
  const snapshot = await getDocs(collection(db, 'chantiers'));
  chantiers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchMetrages = async () => {
  const snapshot = await getDocs(collection(db, 'metrages'));
  metrages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchHeuresPropres = async () => {
  const snapshot = await getDocs(collection(db, 'heures_chef_propres'));
  heuresPropres.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchHeuresInterim = async () => {
  const snapshot = await getDocs(collection(db, 'heures_chef_interim'));
  heuresInterim.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

// Computed per calcolare i dati dei premi
const chantiersAvecMetrages = computed(() => {
  const chantiersData = [];
  
  chantiers.value.forEach(chantier => {
    // Trova l'ultimo metrage per questo cantiere
    const metragesChantier = metrages.value.filter(m => m.chantierId === chantier.id);
    if (metragesChantier.length === 0) return;
    
    const dernierMetrage = metragesChantier.sort((a, b) => 
      new Date(b.dateSaisie) - new Date(a.dateSaisie)
    )[0];
    
    // Calcola ore impiegate attuali
    const heuresChefChantier = heuresPropres.value.filter(h => h.chantierId === chantier.id);
    const heuresCollaborateursChantier = heuresInterim.value.filter(h => h.chantierId === chantier.id);
    
    const totalHeuresChef = heuresChefChantier.reduce((sum, h) => sum + h.heuresPropres, 0);
    const totalHeuresCollaborateurs = heuresCollaborateursChantier.reduce((sum, h) => sum + h.heuresInterim, 0);
    const heuresImployees = totalHeuresChef + totalHeuresCollaborateurs;
    
    // Calcola ore guadagnate e premio
    const heuresGagnees = Math.max(0, dernierMetrage.heuresPrevues - heuresImployees);
    const prime = heuresGagnees * 26; // 26 CHF/h
    
    chantiersData.push({
      id: chantier.id,
      nom: chantier.nom,
      adresse: chantier.adresse,
      heuresPrevues: dernierMetrage.heuresPrevues,
      heuresImployees,
      heuresGagnees,
      prime,
      derniereMiseAJour: dernierMetrage.dateSaisie
    });
  });
  
  return chantiersData;
});

const totalHeuresPrevues = computed(() => {
  return chantiersAvecMetrages.value.reduce((sum, c) => sum + c.heuresPrevues, 0);
});

const totalHeuresImployees = computed(() => {
  return chantiersAvecMetrages.value.reduce((sum, c) => sum + c.heuresImployees, 0);
});

const totalHeuresGagnees = computed(() => {
  return chantiersAvecMetrages.value.reduce((sum, c) => sum + c.heuresGagnees, 0);
});

const totalPrime = computed(() => {
  return chantiersAvecMetrages.value.reduce((sum, c) => sum + c.prime, 0);
});

onMounted(async () => {
  await Promise.all([
    fetchChantiers(),
    fetchMetrages(),
    fetchHeuresPropres(),
    fetchHeuresInterim()
  ]);
});
</script>

<style scoped>
.card {
  margin-bottom: 1rem;
}
</style>
