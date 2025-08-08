<template>
  <div class="container py-5">
    <RetourButton to="/chef/chantiers" />
    
    <h2 class="text-center mb-4">Bilan Cantiere</h2>
    
    <!-- Selezione cantiere -->
    <div class="row mb-4">
      <div class="col-md-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Paramètres du bilan</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <label>Chantier:</label>
                <select v-model="selectedChantierId" class="form-control" @change="calculateBilan">
                  <option value="">Choisir un chantier</option>
                  <option v-for="chantier in chantiersActifs" :key="chantier.id" :value="chantier.id">
                    {{ chantier.nom }} - {{ chantier.adresse }}
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <label>Période de début:</label>
                <input v-model="dateDebut" type="date" class="form-control" @change="calculateBilan" />
              </div>
              <div class="col-md-3">
                <label>Période de fin:</label>
                <input v-model="dateFin" type="date" class="form-control" @change="calculateBilan" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Riepilogo generale per tutti i cantieri -->
    <div v-if="chantiersActifs.length > 0" class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Résumé par chantier</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div v-for="chantier in chantiersActifs" :key="chantier.id" class="col-md-6 mb-3">
                <div class="card border-primary">
                  <div class="card-header">
                    <h6>{{ chantier.nom }}</h6>
                    <small class="text-muted">{{ chantier.adresse }}</small>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6">
                        <p><strong>Heures Chef:</strong> {{ getHeuresChefByChantier(chantier.id) }}h</p>
                        <p><strong>Heures Collaborateurs:</strong> {{ getHeuresCollaborateursByChantier(chantier.id) }}h</p>
                      </div>
                      <div class="col-md-6">
                        <p><strong>Total heures:</strong> {{ getTotalHeuresByChantier(chantier.id) }}h</p>
                        <p><strong>Coût estimé:</strong> {{ getCoutByChantier(chantier.id).toFixed(2) }}€</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bilancio dettagliato -->
    <div v-if="selectedChantierId && bilanData" class="row">
      <!-- Riepilogo generale -->
      <div class="col-md-12 mb-4">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5>Résumé du bilan</h5>
            <button @click="exportBilan" class="btn btn-outline-primary btn-sm">
              <i class="fas fa-download"></i> Exporter PDF
            </button>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-primary">{{ bilanData.totalHeures }}h</h4>
                  <p>Total heures</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-success">{{ bilanData.totalCout.toFixed(2) }}€</h4>
                  <p>Coût total</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-info">{{ bilanData.nombrePersonnes }}</h4>
                  <p>Personnes impliquées</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-warning">{{ bilanData.coutMoyen.toFixed(2) }}€/h</h4>
                  <p>Coût moyen/h</p>
                </div>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>Période analysée:</strong> 
                  {{ dateDebut ? formatDate(dateDebut) : 'Toutes les dates' }} 
                  {{ dateFin ? ' - ' + formatDate(dateFin) : '' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ore Chef de Chantier -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header">
            <h5>Heures Chef de Chantier</h5>
          </div>
          <div class="card-body">
            <div v-if="bilanData.heuresChef.length === 0" class="text-center text-muted">
              Aucune heure enregistrée
            </div>
            <div v-else>
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heures</th>
                    <th>Coût/h</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="heure in bilanData.heuresChef" :key="heure.id">
                    <td>{{ formatDate(heure.date) }}</td>
                    <td>{{ heure.heuresPropres }}h</td>
                    <td>{{ heure.coutHoraire }}€</td>
                    <td>{{ (heure.heuresPropres * heure.coutHoraire).toFixed(2) }}€</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="table-primary">
                    <td><strong>Total</strong></td>
                    <td><strong>{{ bilanData.totalHeuresChef }}h</strong></td>
                    <td></td>
                    <td><strong>{{ bilanData.totalCoutChef.toFixed(2) }}€</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Ore Collaboratori -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header">
            <h5>Heures Collaborateurs</h5>
          </div>
          <div class="card-body">
            <div v-if="bilanData.heuresCollaborateurs.length === 0" class="text-center text-muted">
              Aucune heure enregistrée
            </div>
            <div v-else>
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Collaborateur</th>
                    <th>Heures</th>
                    <th>Coût/h</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="heure in bilanData.heuresCollaborateurs" :key="heure.id">
                    <td>{{ formatDate(heure.date) }}</td>
                    <td>{{ heure.nomCollaborateur }}</td>
                    <td>{{ heure.heuresInterim }}h</td>
                    <td>{{ heure.coutHoraire }}€</td>
                    <td>{{ (heure.heuresInterim * heure.coutHoraire).toFixed(2) }}€</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="table-success">
                    <td><strong>Total</strong></td>
                    <td></td>
                    <td><strong>{{ bilanData.totalHeuresCollaborateurs }}h</strong></td>
                    <td></td>
                    <td><strong>{{ bilanData.totalCoutCollaborateurs.toFixed(2) }}€</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Grafico distribuzione costi -->
      <div class="col-md-12 mb-4">
        <div class="card">
          <div class="card-header">
            <h5>Répartition des coûts</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Par type de personnel</h6>
                <div class="progress mb-3">
                  <div class="progress-bar bg-primary" 
                       :style="{ width: bilanData.percentageChef + '%' }"
                       :title="'Chef: ' + bilanData.percentageChef.toFixed(1) + '%'">
                    Chef de Chantier ({{ bilanData.percentageChef.toFixed(1) }}%)
                  </div>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-success" 
                       :style="{ width: bilanData.percentageCollaborateurs + '%' }"
                       :title="'Collaborateurs: ' + bilanData.percentageCollaborateurs.toFixed(1) + '%'">
                    Collaborateurs ({{ bilanData.percentageCollaborateurs.toFixed(1) }}%)
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <h6>Coûts détaillés</h6>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item d-flex justify-content-between">
                    <span>Chef de Chantier:</span>
                    <span>{{ bilanData.totalCoutChef.toFixed(2) }}€</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between">
                    <span>Collaborateurs:</span>
                    <span>{{ bilanData.totalCoutCollaborateurs.toFixed(2) }}€</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between fw-bold">
                    <span>Total:</span>
                    <span>{{ bilanData.totalCout.toFixed(2) }}€</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Messaggio se nessun cantiere selezionato -->
    <div v-if="!selectedChantierId" class="row">
      <div class="col-md-12">
        <div class="alert alert-info text-center">
          Veuillez sélectionner un chantier pour voir le bilan
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
const collaborateurs = ref([]);
const chefs = ref([]);
const heuresPropres = ref([]);
const heuresInterim = ref([]);
const selectedChantierId = ref('');
const bilanData = ref(null);
const dateDebut = ref('');
const dateFin = ref('');

// Computed per filtrare solo i cantieri in cui il chef ha lavorato
const chantiersActifs = computed(() => {
  const chantiersAvecHeures = new Set();
  
  // Aggiungi cantieri dalle ore proprie del chef
  heuresPropres.value.forEach(heure => {
    chantiersAvecHeures.add(heure.chantierId);
  });
  
  // Aggiungi cantieri dalle ore interim (dove il chef ha registrato ore per collaboratori)
  heuresInterim.value.forEach(heure => {
    chantiersAvecHeures.add(heure.chantierId);
  });
  
  return chantiers.value.filter(chantier => chantiersAvecHeures.has(chantier.id));
});

// Imposta date di default (ultimi 30 giorni)
const setDefaultDates = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  dateDebut.value = thirtyDaysAgo.toISOString().split('T')[0];
  dateFin.value = today.toISOString().split('T')[0];
};

const fetchChantiers = async () => {
  const snapshot = await getDocs(collection(db, 'chantiers'));
  chantiers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchCollaborateurs = async () => {
  const snapshot = await getDocs(collection(db, 'collaborateurs'));
  collaborateurs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchChefs = async () => {
  const snapshot = await getDocs(collection(db, 'chefdechantiers'));
  chefs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

const getCollaborateurName = (collaborateurId) => {
  const collab = collaborateurs.value.find(c => c.id === collaborateurId);
  return collab ? `${collab.nom} ${collab.prenom}` : 'Inconnu';
};

const getChefCoutHoraire = () => {
  // Cerca il chef attuale nelle anagrafiche
  const chefActuel = chefs.value.find(chef => chef.email === 'chef@dallelec.com');
  return chefActuel ? chefActuel.coutHoraire : 25; // Default se non trovato
};

const calculateBilan = () => {
  if (!selectedChantierId.value) {
    bilanData.value = null;
    return;
  }

  // Filtra ore per cantiere selezionato
  let heuresChefChantier = heuresPropres.value.filter(h => h.chantierId === selectedChantierId.value);
  let heuresCollaborateursChantier = heuresInterim.value.filter(h => h.chantierId === selectedChantierId.value);

  // Applica filtri temporali se impostati
  if (dateDebut.value) {
    heuresChefChantier = heuresChefChantier.filter(h => h.date >= dateDebut.value);
    heuresCollaborateursChantier = heuresCollaborateursChantier.filter(h => h.date >= dateDebut.value);
  }
  
  if (dateFin.value) {
    heuresChefChantier = heuresChefChantier.filter(h => h.date <= dateFin.value);
    heuresCollaborateursChantier = heuresCollaborateursChantier.filter(h => h.date <= dateFin.value);
  }

  // Calcola ore chef
  const heuresChef = heuresChefChantier.map(heure => ({
    ...heure,
    coutHoraire: getChefCoutHoraire(),
    nomCollaborateur: 'Chef de Chantier'
  }));

  // Calcola ore collaboratori
  const heuresCollaborateurs = heuresCollaborateursChantier.map(heure => {
    const collab = collaborateurs.value.find(c => c.id === heure.collaborateurId);
    return {
      ...heure,
      coutHoraire: collab ? collab.coutHoraire : 0,
      nomCollaborateur: getCollaborateurName(heure.collaborateurId)
    };
  });

  // Calcola totali
  const totalHeuresChef = heuresChef.reduce((sum, h) => sum + h.heuresPropres, 0);
  const totalCoutChef = heuresChef.reduce((sum, h) => sum + (h.heuresPropres * h.coutHoraire), 0);
  
  const totalHeuresCollaborateurs = heuresCollaborateurs.reduce((sum, h) => sum + h.heuresInterim, 0);
  const totalCoutCollaborateurs = heuresCollaborateurs.reduce((sum, h) => sum + (h.heuresInterim * h.coutHoraire), 0);

  const totalHeures = totalHeuresChef + totalHeuresCollaborateurs;
  const totalCout = totalCoutChef + totalCoutCollaborateurs;
  const coutMoyen = totalHeures > 0 ? totalCout / totalHeures : 0;

  // Calcola percentuali
  const percentageChef = totalCout > 0 ? (totalCoutChef / totalCout) * 100 : 0;
  const percentageCollaborateurs = totalCout > 0 ? (totalCoutCollaborateurs / totalCout) * 100 : 0;

  // Conta persone coinvolte
  const personnesChef = heuresChef.length > 0 ? 1 : 0;
  const personnesCollaborateurs = new Set(heuresCollaborateurs.map(h => h.collaborateurId)).size;
  const nombrePersonnes = personnesChef + personnesCollaborateurs;

  bilanData.value = {
    heuresChef,
    heuresCollaborateurs,
    totalHeuresChef,
    totalCoutChef,
    totalHeuresCollaborateurs,
    totalCoutCollaborateurs,
    totalHeures,
    totalCout,
    coutMoyen,
    percentageChef,
    percentageCollaborateurs,
    nombrePersonnes
  };
};

const exportBilan = () => {
  if (!bilanData.value) {
    alert('Aucun bilan disponible pour l\'exportation.');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Bilan Cantiere', 10, 10);
  doc.setFontSize(12);
  doc.text(`Chantier: ${selectedChantierId ? chantiers.value.find(c => c.id === selectedChantierId.value)?.nom : 'N/A'}`, 10, 20);
  doc.text(`Période: ${dateDebut ? formatDate(dateDebut) : 'Toutes'} - ${dateFin ? formatDate(dateFin) : 'Toutes'}`, 10, 28);
  doc.setFontSize(14);
  doc.text('Résumé du bilan', 10, 40);
  doc.setFontSize(10);
  doc.text(`Total Heures: ${bilanData.value.totalHeures}h`, 10, 50);
  doc.text(`Coût Total: ${bilanData.value.totalCout.toFixed(2)}€`, 10, 58);
  doc.text(`Personnes impliquées: ${bilanData.value.nombrePersonnes}`, 10, 66);
  doc.text(`Coût moyen/h: ${bilanData.value.coutMoyen.toFixed(2)}€/h`, 10, 74);

  doc.setFontSize(14);
  doc.text('Heures Chef de Chantier', 10, 90);
  doc.setFontSize(10);
  let y = 100;
  bilanData.value.heuresChef.forEach(heure => {
    doc.text(`${formatDate(heure.date)} - ${heure.nomCollaborateur}: ${heure.heuresPropres}h (${heure.coutHoraire}€/h)`, 10, y);
    y += 8;
  });
  doc.text(`Total Heures Chef: ${bilanData.value.totalHeuresChef}h`, 10, y + 5);
  doc.text(`Total Coût Chef: ${bilanData.value.totalCoutChef.toFixed(2)}€`, 10, y + 13);

  doc.setFontSize(14);
  doc.text('Heures Collaborateurs', 10, y + 20);
  doc.setFontSize(10);
  bilanData.value.heuresCollaborateurs.forEach(heure => {
    doc.text(`${formatDate(heure.date)} - ${heure.nomCollaborateur}: ${heure.heuresInterim}h (${heure.coutHoraire}€/h)`, 10, y + 5);
    y += 8;
  });
  doc.text(`Total Heures Collaborateurs: ${bilanData.value.totalHeuresCollaborateurs}h`, 10, y + 5);
  doc.text(`Total Coût Collaborateurs: ${bilanData.value.totalCoutCollaborateurs.toFixed(2)}€`, 10, y + 13);

  doc.save('bilan_cantiere.pdf');
};

const getHeuresChefByChantier = (chantierId) => {
  const heures = heuresPropres.value.filter(h => h.chantierId === chantierId);
  return heures.reduce((sum, h) => sum + h.heuresPropres, 0);
};

const getHeuresCollaborateursByChantier = (chantierId) => {
  const heures = heuresInterim.value.filter(h => h.chantierId === chantierId);
  return heures.reduce((sum, h) => sum + h.heuresInterim, 0);
};

const getTotalHeuresByChantier = (chantierId) => {
  const heuresChef = getHeuresChefByChantier(chantierId);
  const heuresCollaborateurs = getHeuresCollaborateursByChantier(chantierId);
  return heuresChef + heuresCollaborateurs;
};

const getCoutByChantier = (chantierId) => {
  const heuresChef = getHeuresChefByChantier(chantierId);
  const heuresCollaborateurs = getHeuresCollaborateursByChantier(chantierId);
  const totalHeures = heuresChef + heuresCollaborateurs;

  const chefCoutHoraire = getChefCoutHoraire();
  const totalCoutChef = heuresChef * chefCoutHoraire;

  const collaborateursCoutHoraire = collaborateurs.value.find(c => c.id === 'chef@dallelec.com')?.coutHoraire || 0; // Default 0 if chef not found
  const totalCoutCollaborateurs = heuresCollaborateurs * collaborateursCoutHoraire;

  return totalCoutChef + totalCoutCollaborateurs;
};

onMounted(async () => {
  await Promise.all([
    fetchChantiers(),
    fetchCollaborateurs(),
    fetchChefs(),
    fetchHeuresPropres(),
    fetchHeuresInterim()
  ]);
  setDefaultDates(); // Imposta le date di default al caricamento
});
</script>

<style scoped>
.progress {
  height: 30px;
}

.progress-bar {
  line-height: 30px;
  font-size: 12px;
}
</style>
