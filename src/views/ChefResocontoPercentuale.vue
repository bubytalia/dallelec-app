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
                  <router-link 
                    v-if="getTotalAvancement(zona) === 100"
                    :to="`/chef/chantiers/resoconto-finale?chantier=${selectedChantierId}&zone=${zona}`"
                    class="btn btn-danger btn-sm ms-2"
                  >
                    📋 Resoconto final
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Sezione Regie -->
    <div v-if="selectedChantierId" class="card p-4 mb-4">
      <h5>Régies (Heures supplémentaires facturables)</h5>
      <div class="row mb-3">
        <div class="col-md-2">
          <label>Zone:</label>
          <select v-model="nouvelleRegie.zone" class="form-control">
            <option value="">Sélectionner zone</option>
            <option v-for="zona in zones" :key="zona" :value="zona">{{ zona }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label>Heures:</label>
          <input v-model.number="nouvelleRegie.heures" type="number" step="0.5" class="form-control" placeholder="2.0">
        </div>
        <div class="col-md-2">
          <label>Type régie:</label>
          <select v-model="nouvelleRegie.regieId" class="form-control">
            <option value="">Sélectionner type</option>
            <option v-for="regie in regiesDisponibles" :key="regie.id" :value="regie.id">
              {{ regie.nom }} ({{ regie.prixHeure }} CHF/h)
            </option>
          </select>
        </div>
        <div class="col-md-4">
          <label>Description travail:</label>
          <input v-model="nouvelleRegie.description" type="text" class="form-control" placeholder="Modification installation électrique...">
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <button @click="regieEnModification !== null ? sauvegarderModificationRegie() : ajouterRegie()" class="btn btn-warning w-100" :disabled="!regieValide">
            {{ regieEnModification !== null ? '✅ Modifier' : '➕ Ajouter' }}
          </button>
        </div>
      </div>
      
      <!-- Liste regie -->
      <div v-if="regies.length > 0">
        <h6>Régies ce mois:</h6>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Heures</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(regie, index) in regies" :key="index">
              <td>{{ regie.zone }}</td>
              <td>{{ regie.heures }}h</td>
              <td>{{ regie.description }}</td>
              <td>
                <button @click="modifierRegie(index)" class="btn btn-warning btn-sm me-1">✏️</button>
                <button @click="supprimerRegie(index)" class="btn btn-danger btn-sm">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="text-end">
          <strong>Total Heures Régies: {{ totalHeuresRegies }}h</strong>
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
            <td>{{ formatDate(resoconto.created_at || resoconto.createdAt) }}</td>
            <td>{{ resoconto.periode_month || resoconto.periodeMonth }}</td>
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
import { supabase } from '../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

const router = useRouter();
// Rimosso useAuth - userEmail da localStorage
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
const regies = ref([]);
const prixRegieChantier = ref(65);
const regieEnModification = ref(null);
const nouvelleRegie = ref({
  zone: '',
  heures: 0,
  description: ''
});
const chantiersPercentuels = computed(() => 
  chantiers.value.filter(c => c.modalitaResoconto === 'percentuale')
);

const regieValide = computed(() => {
  return nouvelleRegie.value.zone && 
         nouvelleRegie.value.heures > 0 && 
         nouvelleRegie.value.description.trim();
});

const totalHeuresRegies = computed(() => {
  return regies.value.reduce((sum, r) => sum + r.heures, 0);
});

const totalMontantRegies = computed(() => {
  return regies.value.reduce((sum, r) => sum + (r.heures * r.prixHeure), 0);
});

const fetchChantiers = async () => {
  const userEmail = localStorage.getItem('userEmail');
  console.log('🔍 UserEmail from localStorage:', userEmail);
  
  if (!userEmail) {
    console.error('❌ UserEmail non trovato:', userEmail);
    alert('Erreur: UserEmail non trovato. Rifare login.');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .select('*')
      .eq('capocantiere', userEmail);
    
    if (error) throw error;
    chantiers.value = data || [];
  } catch (error) {
    console.error('Erreur chargement chantiers:', error);
  }
};

const ajouterRegie = () => {
  if (!regieValide.value) return;
  
  const nouvelleRegieItem = {
    zone: nouvelleRegie.value.zone,
    heures: nouvelleRegie.value.heures,
    prixHeure: prixRegieChantier.value,
    description: nouvelleRegie.value.description
  };
  
  regies.value.push(nouvelleRegieItem);
  
  // Reset form
  nouvelleRegie.value = {
    zone: '',
    heures: 0,
    description: ''
  };
};

const modifierRegie = (index) => {
  const regie = regies.value[index];
  nouvelleRegie.value = {
    zone: regie.zone,
    heures: regie.heures,
    description: regie.description
  };
  regieEnModification.value = index;
};

const sauvegarderModificationRegie = () => {
  if (!regieValide.value || regieEnModification.value === null) return;
  
  regies.value[regieEnModification.value] = {
    zone: nouvelleRegie.value.zone,
    heures: nouvelleRegie.value.heures,
    prixHeure: prixRegieChantier.value,
    description: nouvelleRegie.value.description
  };
  
  // Reset
  nouvelleRegie.value = {
    zone: '',
    heures: 0,
    description: ''
  };
  regieEnModification.value = null;
};

const supprimerRegie = (index) => {
  regies.value.splice(index, 1);
  // Se stavo modificando questa regie, reset
  if (regieEnModification.value === index) {
    regieEnModification.value = null;
    nouvelleRegie.value = {
      zone: '',
      heures: 0,
      description: ''
    };
  }
};

const loadChantierData = async () => {
  if (!selectedChantierId.value) return;
  
  console.log('🔍 Loading chantier data for:', selectedChantierId.value);
  selectedChantier.value = chantiers.value.find(c => c.id === selectedChantierId.value);
  console.log('📋 Selected chantier:', selectedChantier.value);
  
  // Carica prezzo regie del cantiere
  prixRegieChantier.value = selectedChantier.value?.prixRegie || 65;
  
  console.log('🔍 Selected chantier completo:', selectedChantier.value);
  const devisId = selectedChantier.value?.devis_id || selectedChantier.value?.devisId;
  console.log('🔍 Devis ID trovato:', devisId);
  console.log('🔍 devis_id:', selectedChantier.value?.devis_id);
  console.log('🔍 devisId:', selectedChantier.value?.devisId);
  
  if (devisId) {
    try {
      const { data: devisData, error } = await supabase
        .from('devis')
        .select('*')
        .eq('id', devisId)
        .single();
      
      if (error) throw error;
      
      if (devisData) {
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
    } catch (error) {
      console.error('Erreur chargement devis:', error);
    }
  } else {
    console.error('❌ NESSUN DEVIS ID TROVATO per cantiere:', selectedChantier.value);
    alert('Ce chantier n\'a pas de devis associé.');
  }
  
  await loadAvancementiStorici();
  await loadZoneConvertite();
};

const loadAvancementiStorici = async () => {
  try {
    // Tabella potrebbe non esistere ancora
    const { data, error } = await supabase
      .from('resoconti_percentuali')
      .select('*')
      .eq('chantier_id', selectedChantierId.value)
      .eq('status', 'approved');
    
    avancementiStorici.value = {};
    zones.value.forEach(zona => {
      avancementiStorici.value[zona] = 0;
    });
    
    if (data) {
      data.forEach(resoconto => {
        Object.entries(resoconto.avancementi || {}).forEach(([zona, percentuale]) => {
          avancementiStorici.value[zona] = (avancementiStorici.value[zona] || 0) + percentuale;
        });
      });
    }
  } catch (error) {
    console.log('Tabella resoconti_percentuali non esiste ancora');
    avancementiStorici.value = {};
    zones.value.forEach(zona => {
      avancementiStorici.value[zona] = 0;
    });
  }
};

const loadZoneConvertite = async () => {
  try {
    const { data, error } = await supabase
      .from('zone_convertite')
      .select('*')
      .eq('chantier_id', selectedChantierId.value);
    
    if (data) {
      zoneConvertite.value = new Set(data.map(item => item.zona));
    } else {
      zoneConvertite.value = new Set();
    }
  } catch (error) {
    console.log('Tabella zone_convertite non esiste ancora');
    zoneConvertite.value = new Set();
  }
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
  try {
    const userEmail = localStorage.getItem('userEmail');
    
    const { error } = await supabase
      .from('resoconti_percentuali')
      .insert([{
        chantier_id: selectedChantierId.value,
        periode_month: periodeMonth.value,
        descrizione: descrizione.value,
        avancementi: { ...avancementiMensili.value },
        regies: [...regies.value],
        capocantiere: userEmail,
        draft: false,
        status: 'en_attente',
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    alert('Resoconto sauvegardé avec succès.');
    
    // Reset form
    zones.value.forEach(zona => {
      avancementiMensili.value[zona] = 0;
    });
    descrizione.value = '';
    regies.value = [];
    
    await loadAvancementiStorici();
  } catch (error) {
    console.error('Erreur sauvegarde resoconto:', error);
    alert('Erreur: ' + error.message);
  }
};

const sauvegarderBrouillon = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    
    const { error } = await supabase
      .from('resoconti_percentuali')
      .insert([{
        chantier_id: selectedChantierId.value,
        periode_month: periodeMonth.value,
        descrizione: descrizione.value,
        avancementi: { ...avancementiMensili.value },
        regies: [...regies.value],
        capocantiere: userEmail,
        draft: true,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    alert('Brouillon sauvegardé.');
  } catch (error) {
    console.error('Erreur sauvegarde brouillon:', error);
    alert('Erreur: ' + error.message);
  }
};

const voirHistorique = async () => {
  showHistorique.value = !showHistorique.value;
  if (showHistorique.value) {
    try {
      const { data, error } = await supabase
        .from('resoconti_percentuali')
        .select('*')
        .eq('chantier_id', selectedChantierId.value)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      historiqueResoconti.value = data || [];
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      historiqueResoconti.value = [];
    }
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
    
    // Carica le regie
    regies.value = resoconto.regies ? [...resoconto.regies] : [];
    
    showHistorique.value = false;
    alert('Brouillon chargé. Vous pouvez maintenant le modifier et le sauvegarder.');
  }
};

const supprimerResoconto = async (id) => {
  if (confirm('Supprimer ce resoconto?')) {
    try {
      const { error } = await supabase
        .from('resoconti_percentuali')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await voirHistorique();
      await loadAvancementiStorici();
    } catch (error) {
      console.error('Erreur suppression resoconto:', error);
      alert('Erreur: ' + error.message);
    }
  }
};

const convertirZone = async (zona) => {
  if (confirm(`Convertir la zone "${zona}" en métrage détaillé? Cette action est irréversible.`)) {
    try {
      const { error } = await supabase
        .from('zone_convertite')
        .insert([{
          chantier_id: selectedChantierId.value,
          zona: zona,
          convertita_il: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      // Reindirizza al sistema di metrage classico
      router.push(`/chef/chantiers/metrages-detail?chantier=${selectedChantierId.value}&zona=${zona}&conversion=true`);
    } catch (error) {
      console.error('Erreur conversion zone:', error);
      alert('Erreur: ' + error.message);
    }
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
  if (!date) return '-';
  if (date?.toDate) return date.toDate().toLocaleDateString('fr-FR');
  return new Date(date).toLocaleDateString('fr-FR');
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