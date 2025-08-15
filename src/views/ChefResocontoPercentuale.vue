<template>
  <div class="container py-4">
    <RetourButton to="/chef" />

    <h2 class="text-center mb-4">Resoconto Percentuale</h2>

    <!-- Selezione cantiere -->
    <div class="row mb-4">
      <div class="col-md-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Sélectionner un chantier</h5>
          </div>
          <div class="card-body">
            <select v-model="selectedChantierId" class="form-control" @change="loadChantierData">
              <option value="">Choisir un chantier</option>
              <option v-for="chantier in chantiersPercentuels" :key="chantier.id" :value="chantier.id">
                {{ chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '' }}{{ chantier.nom }} - {{ chantier.adresse }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Info cantiere -->
    <div class="alert alert-info text-center mb-4" v-if="selectedChantier">
      <div><strong>Chantier:</strong> {{ selectedChantier.nom }}</div>
      <div><strong>Client:</strong> {{ nomClient }}</div>
      <div><strong>Modalité:</strong> 📊 Resoconto Percentuel</div>
    </div>

    <!-- Période -->
    <div class="row mb-4" v-if="selectedChantierId">
      <div class="col-md-6 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Période de référence</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <label>Mois:</label>
                <input type="month" v-model="periodeMonth" class="form-control">
              </div>
              <div class="col-md-6">
                <label>Description:</label>
                <input type="text" v-model="descrizione" class="form-control" placeholder="Ex: Travaux électriques">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form percentuali per zona -->
    <div v-if="selectedChantierId && zones.length > 0" class="card p-4 mb-4">
      <h5>Avancement par zone</h5>
      <div class="row">
        <div class="col-md-12">
          <table class="table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Avancement précédent</th>
                <th>Avancement ce mois (%)</th>
                <th>Total avancement</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="zona in zones" :key="zona">
                <td><strong>{{ zona }}</strong></td>
                <td>{{ getAvancementPrecedent(zona) }}%</td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="avancementiMensili[zona]" 
                    class="form-control" 
                    min="0" 
                    :max="100 - getAvancementPrecedent(zona)"
                    :disabled="isZoneCompleta(zona)"
                  />
                </td>
                <td>
                  <strong :class="getTotalClass(zona)">
                    {{ getTotalAvancement(zona) }}%
                  </strong>
                </td>
                <td>
                  <span class="badge" :class="getStatutClass(zona)">
                    {{ getStatutText(zona) }}
                  </span>
                  <button 
                    v-if="isZoneCompleta(zona) && !isZoneConvertita(zona)"
                    class="btn btn-warning btn-sm ms-2"
                    @click="convertirZone(zona)"
                  >
                    📋 Convertir en métrage
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Pulsanti azioni -->
    <div class="mb-3 d-flex justify-content-center" v-if="selectedChantierId">
      <button class="btn btn-success me-2" @click="sauvegarderResoconto">📥 Sauvegarder</button>
      <button class="btn btn-outline-primary me-2" @click="sauvegarderBrouillon">💾 Brouillon</button>
      <button class="btn btn-info me-2" @click="voirHistorique">📊 Historique</button>
    </div>

    <!-- Historique -->
    <div v-if="showHistorique" class="card p-4 mb-4">
      <h5>Historique des resoconti</h5>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Date</th>
            <th>Période</th>
            <th>Description</th>
            <th>Zones modifiées</th>
            <th>Type</th>
            <th>Statut Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="resoconto in historiqueResoconti" :key="resoconto.id">
            <td>{{ formatDate(resoconto.createdAt) }}</td>
            <td>{{ resoconto.periodeMonth }}</td>
            <td>{{ resoconto.descrizione || '-' }}</td>
            <td>{{ Object.keys(resoconto.avancementi || {}).join(', ') }}</td>
            <td>
              <span class="badge" :class="resoconto.draft ? 'bg-warning' : 'bg-primary'">
                {{ resoconto.draft ? 'Brouillon' : 'Inviato' }}
              </span>
            </td>
            <td>
              <span class="badge" :class="getAdminStatusClass(resoconto)">
                {{ getAdminStatusText(resoconto) }}
              </span>
            </td>
            <td>
              <button 
                v-if="resoconto.draft" 
                class="btn btn-sm btn-primary me-2" 
                @click="chargerBrouillon(resoconto)"
              >
                ✏️ Modifier
              </button>
              <button class="btn btn-sm btn-danger" @click="supprimerResoconto(resoconto.id)">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Zone da convertire -->
    <div v-if="zoneCompleteDaConvertire.length > 0" class="alert alert-warning">
      <h6>⚠️ Zone completate da convertire in métrage détaillé:</h6>
      <ul>
        <li v-for="zona in zoneCompleteDaConvertire" :key="zona">
          <strong>{{ zona }}</strong> - 100% completata
          <button class="btn btn-sm btn-warning ms-2" @click="convertirZone(zona)">
            📋 Convertir maintenant
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '@/firebase';
import { doc, getDoc, collection, getDocs, addDoc, query, where, deleteDoc } from 'firebase/firestore';
import RetourButton from '@/components/RetourButton.vue';

const router = useRouter();
const chantiers = ref([]);
const selectedChantierId = ref('');
const selectedChantier = ref(null);
const zones = ref([]);
const nomClient = ref('');
const periodeMonth = ref(new Date().toISOString().slice(0, 7));
const descrizione = ref('');
const avancementiMensili = ref({});
const avancementiStorici = ref({});
const showHistorique = ref(false);
const historiqueResoconti = ref([]);
const zoneConvertite = ref(new Set());

const chantiersPercentuels = computed(() => 
  chantiers.value.filter(c => c.modalitaResoconto === 'percentuale')
);

const fetchChantiers = async () => {
  const snapshot = await getDocs(collection(db, 'chantiers'));
  const allChantiers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // TODO: Sostituire con l'email del chef loggato
  const chefEmail = 'chef@dallelec.com'; // Temporaneo
  
  // Filtra solo i cantieri assegnati a questo chef
  chantiers.value = allChantiers.filter(c => c.capocantiere === chefEmail);
};

const loadChantierData = async () => {
  if (!selectedChantierId.value) return;
  
  selectedChantier.value = chantiers.value.find(c => c.id === selectedChantierId.value);
  
  if (selectedChantier.value?.devisId) {
    const devisDoc = await getDoc(doc(db, 'devis', selectedChantier.value.devisId));
    if (devisDoc.exists()) {
      const devisData = devisDoc.data();
      nomClient.value = devisData.nom || '';
      
      if (devisData.produits?.length > 0) {
        const zoneSet = new Set();
        devisData.produits.forEach(produit => {
          if (produit.zone) zoneSet.add(produit.zone);
        });
        zones.value = Array.from(zoneSet).sort();
        
        // Inizializza avancamenti mensili
        zones.value.forEach(zona => {
          if (!avancementiMensili.value[zona]) {
            avancementiMensili.value[zona] = 0;
          }
        });
      }
    }
  }
  
  await loadAvancementiStorici();
  await loadZoneConvertite();
};

const loadAvancementiStorici = async () => {
  const q = query(
    collection(db, 'resoconti_percentuali'), 
    where('chantierId', '==', selectedChantierId.value),
    where('status', '==', 'approved')
  );
  const snapshot = await getDocs(q);
  
  avancementiStorici.value = {};
  zones.value.forEach(zona => {
    avancementiStorici.value[zona] = 0;
  });
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    Object.entries(data.avancementi || {}).forEach(([zona, percentuale]) => {
      avancementiStorici.value[zona] = (avancementiStorici.value[zona] || 0) + percentuale;
    });
  });
};

const loadZoneConvertite = async () => {
  const q = query(
    collection(db, 'zone_convertite'),
    where('chantierId', '==', selectedChantierId.value)
  );
  const snapshot = await getDocs(q);
  zoneConvertite.value = new Set(snapshot.docs.map(doc => doc.data().zona));
};

const getAvancementPrecedent = (zona) => {
  return Math.min(avancementiStorici.value[zona] || 0, 100);
};

const getTotalAvancement = (zona) => {
  const precedent = getAvancementPrecedent(zona);
  const mensile = avancementiMensili.value[zona] || 0;
  return Math.min(precedent + mensile, 100);
};

const getTotalClass = (zona) => {
  const total = getTotalAvancement(zona);
  if (total === 100) return 'text-success';
  if (total >= 75) return 'text-warning';
  return 'text-primary';
};

const isZoneCompleta = (zona) => {
  return getAvancementPrecedent(zona) >= 100;
};

const isZoneConvertita = (zona) => {
  return zoneConvertite.value.has(zona);
};

const getStatutClass = (zona) => {
  if (isZoneConvertita(zona)) return 'bg-primary';
  if (isZoneCompleta(zona)) return 'bg-warning';
  if (getTotalAvancement(zona) === 100) return 'bg-success';
  return 'bg-secondary';
};

const getStatutText = (zona) => {
  if (isZoneConvertita(zona)) return '📋 Convertita';
  if (isZoneCompleta(zona)) return '⚠️ Da convertire';
  if (getTotalAvancement(zona) === 100) return '✅ Completata';
  return '🔄 In corso';
};

const zoneCompleteDaConvertire = computed(() => {
  return zones.value.filter(zona => 
    getTotalAvancement(zona) === 100 && 
    !isZoneConvertita(zona)
  );
});

const sauvegarderResoconto = async () => {
  const resocontoData = {
    chantierId: selectedChantierId.value,
    periodeMonth: periodeMonth.value,
    descrizione: descrizione.value,
    avancementi: { ...avancementiMensili.value },
    draft: false,
    status: 'en_attente',
    createdAt: new Date()
  };
  
  await addDoc(collection(db, 'resoconti_percentuali'), resocontoData);
  alert('Resoconto sauvegardé avec succès.');
  
  // Reset form
  zones.value.forEach(zona => {
    avancementiMensili.value[zona] = 0;
  });
  descrizione.value = '';
  
  await loadAvancementiStorici();
};

const sauvegarderBrouillon = async () => {
  const resocontoData = {
    chantierId: selectedChantierId.value,
    periodeMonth: periodeMonth.value,
    descrizione: descrizione.value,
    avancementi: { ...avancementiMensili.value },
    draft: true,
    createdAt: new Date()
  };
  
  await addDoc(collection(db, 'resoconti_percentuali'), resocontoData);
  alert('Brouillon sauvegardé.');
};

const voirHistorique = async () => {
  showHistorique.value = !showHistorique.value;
  if (showHistorique.value) {
    const q = query(
      collection(db, 'resoconti_percentuali'),
      where('chantierId', '==', selectedChantierId.value)
    );
    const snapshot = await getDocs(q);
    historiqueResoconti.value = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
  }
};

const chargerBrouillon = (resoconto) => {
  if (confirm('Charger ce brouillon? Les données actuelles seront remplacées.')) {
    periodeMonth.value = resoconto.periodeMonth || new Date().toISOString().slice(0, 7);
    descrizione.value = resoconto.descrizione || '';
    
    // Carica gli avancamenti
    Object.keys(avancementiMensili.value).forEach(zona => {
      avancementiMensili.value[zona] = resoconto.avancementi?.[zona] || 0;
    });
    
    showHistorique.value = false;
    alert('Brouillon chargé. Vous pouvez maintenant le modifier et le sauvegarder.');
  }
};

const supprimerResoconto = async (id) => {
  if (confirm('Supprimer ce resoconto?')) {
    await deleteDoc(doc(db, 'resoconti_percentuali', id));
    await voirHistorique();
    await loadAvancementiStorici();
  }
};

const convertirZone = async (zona) => {
  if (confirm(`Convertir la zone "${zona}" en métrage détaillé? Cette action est irréversible.`)) {
    // Marca la zona come convertita
    await addDoc(collection(db, 'zone_convertite'), {
      chantierId: selectedChantierId.value,
      zona: zona,
      convertitaIl: new Date()
    });
    
    // Reindirizza al sistema di metrage classico
    router.push(`/chef/chantiers/metrages-detail?chantier=${selectedChantierId.value}&zona=${zona}&conversion=true`);
  }
};

const getAdminStatusClass = (resoconto) => {
  if (resoconto.draft) return 'bg-secondary';
  if (resoconto.status === 'approved') return 'bg-success';
  if (resoconto.status === 'rejected') return 'bg-danger';
  return 'bg-warning'; // en_attente
};

const getAdminStatusText = (resoconto) => {
  if (resoconto.draft) return '-';
  if (resoconto.status === 'approved') return 'Approuvé';
  if (resoconto.status === 'rejected') return 'Refusé';
  return 'En attente';
};

const formatDate = (date) => {
  return date?.toDate ? date.toDate().toLocaleDateString('fr-FR') : new Date(date).toLocaleDateString('fr-FR');
};

onMounted(async () => {
  await fetchChantiers();
  
  // Preseleziona cantiere da URL
  const urlParams = new URLSearchParams(window.location.search);
  const chantierId = urlParams.get('chantier');
  if (chantierId) {
    selectedChantierId.value = chantierId;
    await loadChantierData();
  }
});
</script>