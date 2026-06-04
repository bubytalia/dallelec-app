<template>
  <div class="container py-4">
    <RetourButton :to="retourPath" />
    
    <h2 class="text-center mb-4">Échéancier Factures</h2>

    <!-- Filtri -->
    <div class="card mb-4">
      <div class="card-header">
        <h5>Filtres</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-3">
            <label>Période:</label>
            <select v-model="filtroPeriodo" class="form-select">
              <option value="tutti">Toutes les factures</option>
              <option value="scadute">Échues</option>
              <option value="30giorni">Prochains 30 jours</option>
              <option value="60giorni">Prochains 60 jours</option>
            </select>
          </div>
          <div class="col-md-3">
            <label>Statut:</label>
            <select v-model="filtroStato" class="form-select">
              <option value="">Tous les statuts</option>
              <option value="emise">Émises</option>
              <option value="envoyee">Envoyées</option>
              <option value="en_retard">En retard</option>
            </select>
          </div>
          <div class="col-md-3">
            <label>Cliente:</label>
            <select v-model="filtroCliente" class="form-select">
              <option value="">Tous les clients</option>
              <option v-for="client in clientsUniques" :key="client" :value="client">{{ client }}</option>
            </select>
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button @click="resetFiltri" class="btn btn-outline-secondary">Reset</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistiche -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-danger text-white text-center">
          <div class="card-body py-2">
            <h6 class="mb-1">Échues</h6>
            <h5 class="mb-1">{{ facturesScadute.length }}</h5>
            <small>{{ formatCurrency(totalScadute) }}</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-white text-center">
          <div class="card-body py-2">
            <h6 class="mb-1">Prochains 7 jours</h6>
            <h5 class="mb-1">{{ facturesProssimi7.length }}</h5>
            <small>{{ formatCurrency(totalProssimi7) }}</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white text-center">
          <div class="card-body py-2">
            <h6 class="mb-1">Prochains 30 jours</h6>
            <h5 class="mb-1">{{ facturesProssimi30.length }}</h5>
            <small>{{ formatCurrency(totalProssimi30) }}</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white text-center">
          <div class="card-body py-2">
            <h6 class="mb-1">Payées</h6>
            <h5 class="mb-1">{{ facturesPayees.length }}</h5>
            <small>{{ formatCurrency(totalPayees) }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabella scadenziario -->
    <div class="card">
      <div class="card-header">
        <h5>Échéancier ({{ facturesFiltrate.length }} factures)</h5>
      </div>
      <div class="card-body">
        <div v-if="facturesFiltrate.length === 0" class="text-center text-muted py-4">
          Aucune facture trouvée avec les filtres sélectionnés
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Client</th>
                <th>Date Facture</th>
                <th>Échéance</th>
                <th>Jours</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="facture in facturesFiltrate" :key="facture.id" :class="getRowClass(facture)">
                <td><strong>{{ facture.numero }}</strong></td>
                <td>{{ facture.client_nom }}</td>
                <td>{{ formatDate(facture.date_facture) }}</td>
                <td>{{ formatDate(facture.date_echeance) }}</td>
                <td>
                  <span :class="getGiorniClass(facture)">
                    {{ getGiorniScadenza(facture) }}
                  </span>
                </td>
                <td>{{ formatCurrency(calculateSoldeFinale(facture)) }}</td>
                <td>
                  <select 
                    v-model="facture.statut" 
                    @change="updateStatut(facture)" :disabled="isReadOnly"
                    class="form-select form-select-sm"
                    :class="getStatutSelectClass(facture.statut)"
                  >
                    <option value="emise">Émise</option>
                    <option value="envoyee">Envoyée</option>
                    <option value="payee">Payée</option>
                    <option value="en_retard">En retard</option>
                  </select>
                </td>
                <td>
                  <button @click="genererPDF(facture)" class="btn btn-sm btn-info me-1" title="Générer PDF">
                    📄
                  </button>
                  <button v-if="!isReadOnly" @click="inviaPromemoria(facture)" class="btn btn-sm btn-warning" title="Envoyer rappel">
                    📧
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  readOnly: { type: Boolean, default: false },
  retourPath: { type: String, default: '/admin' }
});
const isReadOnly = computed(() => props.readOnly);
import { supabase } from '../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

const factures = ref([]);
const filtroPeriodo = ref('tutti');
const filtroStato = ref('');
const filtroCliente = ref('');

const loadFactures = async () => {
  try {
    const { data, error } = await supabase
      .from('factures')
      .select('*')
      .order('date_echeance', { ascending: true });
    
    if (error) throw error;
    factures.value = data || [];
  } catch (error) {
    console.error('Erreur chargement factures:', error);
  }
};

const clientsUniques = computed(() => {
  const clients = new Set();
  factures.value.forEach(f => {
    if (f.client_nom) clients.add(f.client_nom);
  });
  return Array.from(clients).sort();
});

const facturesNonPayees = computed(() => {
  return factures.value.filter(f => f.statut !== 'payee');
});

const facturesScadute = computed(() => {
  const oggi = new Date();
  return facturesNonPayees.value.filter(f => {
    const scadenza = new Date(f.date_echeance);
    return scadenza < oggi;
  });
});

const facturesProssimi7 = computed(() => {
  const oggi = new Date();
  const tra7giorni = new Date(oggi.getTime() + 7 * 24 * 60 * 60 * 1000);
  return facturesNonPayees.value.filter(f => {
    const scadenza = new Date(f.date_echeance);
    return scadenza >= oggi && scadenza <= tra7giorni;
  });
});

const facturesProssimi30 = computed(() => {
  const oggi = new Date();
  const tra30giorni = new Date(oggi.getTime() + 30 * 24 * 60 * 60 * 1000);
  return facturesNonPayees.value.filter(f => {
    const scadenza = new Date(f.date_echeance);
    return scadenza >= oggi && scadenza <= tra30giorni;
  });
});

const facturesPayees = computed(() => {
  return factures.value.filter(f => f.statut === 'payee');
});

const totalScadute = computed(() => {
  return facturesScadute.value.reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const totalProssimi7 = computed(() => {
  return facturesProssimi7.value.reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const totalProssimi30 = computed(() => {
  return facturesProssimi30.value.reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const totalPayees = computed(() => {
  return facturesPayees.value.reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const facturesFiltrate = computed(() => {
  // ✅ ESCLUDI SEMPRE le fatture pagate dallo scadenziario
  let filtered = factures.value.filter(f => f.statut !== 'payee');
  
  // Filtro per periodo
  if (filtroPeriodo.value === 'scadute') {
    filtered = facturesScadute.value;
  } else if (filtroPeriodo.value === '30giorni') {
    filtered = facturesProssimi30.value;
  } else if (filtroPeriodo.value === '60giorni') {
    const oggi = new Date();
    const tra60giorni = new Date(oggi.getTime() + 60 * 24 * 60 * 60 * 1000);
    filtered = facturesNonPayees.value.filter(f => {
      const scadenza = new Date(f.date_echeance);
      return scadenza >= oggi && scadenza <= tra60giorni;
    });
  }
  
  // Filtro per stato (solo se non è 'payee')
  if (filtroStato.value && filtroStato.value !== 'payee') {
    filtered = filtered.filter(f => f.statut === filtroStato.value);
  }
  
  // Filtro per cliente
  if (filtroCliente.value) {
    filtered = filtered.filter(f => f.client_nom === filtroCliente.value);
  }
  
  return filtered.sort((a, b) => new Date(a.date_echeance) - new Date(b.date_echeance));
});

const getGiorniScadenza = (facture) => {
  const oggi = new Date();
  const scadenza = new Date(facture.date_echeance);
  const diffTime = scadenza - oggi;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} j échu`;
  } else if (diffDays === 0) {
    return 'Aujourd\'hui';
  } else {
    return `${diffDays} jours`;
  }
};

const getGiorniClass = (facture) => {
  const oggi = new Date();
  const scadenza = new Date(facture.date_echeance);
  const diffTime = scadenza - oggi;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'badge bg-danger';
  if (diffDays <= 7) return 'badge bg-warning';
  if (diffDays <= 30) return 'badge bg-info';
  return 'badge bg-success';
};

const getRowClass = (facture) => {
  const oggi = new Date();
  const scadenza = new Date(facture.date_echeance);
  
  if (facture.statut === 'payee') return 'table-success';
  if (scadenza < oggi) return 'table-danger';
  
  const diffTime = scadenza - oggi;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) return 'table-warning';
  return '';
};

const getStatutSelectClass = (statut) => {
  const classes = {
    emise: 'text-secondary',
    envoyee: 'text-info',
    payee: 'text-success',
    en_retard: 'text-danger'
  };
  return classes[statut] || 'text-secondary';
};

const calculateSoldeFinale = (facture) => {
  const acconti = Number(facture.acconti_precedenti || 0);
  
  if (acconti === 0) {
    return Number(facture.montant_ttc || 0);
  }
  
  const montantHT = Number(facture.montant_ht || 0);
  const montantNetHT = montantHT - acconti;
  const tva = montantNetHT * 0.081;
  return montantNetHT + tva;
};

const updateStatut = async (facture) => {
  try {
    const { error } = await supabase
      .from('factures')
      .update({ statut: facture.statut })
      .eq('id', facture.id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    alert('Erreur: ' + error.message);
  }
};

const genererPDF = (facture) => {
  // Reindirizza alla pagina fatturazione per generare il PDF
  window.open(`/admin/facturation`, '_blank');
};

const inviaPromemoria = (facture) => {
  alert(`Rappel pour facture ${facture.numero} - Fonctionnalité à implémenter`);
};

const resetFiltri = () => {
  filtroPeriodo.value = 'tutti';
  filtroStato.value = '';
  filtroCliente.value = '';
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('it-IT');
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF'
  }).format(amount);
};

onMounted(() => {
  loadFactures();
});
</script>

<style scoped>
.table-hover tbody tr:hover {
  background-color: rgba(0,0,0,.075);
}

.form-select-sm {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
}
</style>