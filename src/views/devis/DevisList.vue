<template>
  <div class="container">
    <!-- Mostra il titolo solo se showTitle è true (default) -->
    <h2 v-if="showTitle">Gestion des Devis</h2>

    <!-- Filtri -->
    <div class="row mb-3">
      <div class="col-md-3 mb-2 mb-md-0">
        <select v-model="filterClient" class="form-select">
          <option value="">Tous les clients</option>
          <option v-for="c in clients" :key="c.id" :value="c.nom">{{ c.nom }}</option>
        </select>
      </div>
      <div class="col-md-3 mb-2 mb-md-0">
        <select v-model="filterTechnicien" class="form-select">
          <option value="">Tous les techniciens</option>
          <option v-for="t in techniciens" :key="t.nom" :value="t.nom">{{ t.nom }}</option>
        </select>
      </div>
      <div class="col-md-3">
        <select v-model="filterStatus" class="form-select">
          <option value="">Tous les états</option>
          <option value="Brouillon">Brouillon</option>
          <option value="En cours">En cours</option>
          <option value="Accepté">Accepté</option>
          <option value="Non accepté">Non accepté</option>
        </select>
      </div>
      <div class="col-md-3">
        <select v-model="sortBy" class="form-select">
          <option value="numero">Trier par numéro (récent)</option>
          <option value="date">Trier par date (récent)</option>
        </select>
      </div>
    </div>

    <!-- Tabella raggruppata per cantiere -->
    <div v-for="group in groupedDevis" :key="group.chantier" class="mb-4">
      <!-- Header gruppo cantiere -->
      <div class="card">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <h6 class="mb-0">
            <strong>🏗️ {{ group.chantier }}</strong>
            <span class="badge bg-secondary ms-2">{{ group.devis.length }} devis</span>
          </h6>
          <button 
            class="btn btn-sm btn-success" 
            @click="creerDevisSupplementaire(group.devis[0])"
            title="Créer un devis supplémentaire pour ce chantier"
          >
            ➕ Devis supplémentaire
          </button>
        </div>
        <div class="card-body p-0">
          <table class="table table-sm mb-0">
            <thead class="table-light">
              <tr>
                <th>Date</th>
                <th>Numéro</th>
                <th>Client</th>
                <th>Technicien</th>
                <th>Montant HT (CHF)</th>
                <th>Remise</th>
                <th>État</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="devis in group.devis" :key="devis.id">
                <td>{{ formatDate(devis.created_at) }}</td>
                <td>{{ devis.numero }}</td>
                <td>{{ getClientName(devis.client_id) }}</td>
                <td>{{ devis.technicien }}</td>
                <td>{{ formatMontant(devis.total) }}</td>
                <td>{{ calculerRemise(devis.remises, devis.modalita_prezzi) }}%</td>
                <td>
                  <span v-if="devis.draft === true" class="badge bg-warning">Brouillon</span>
                  <select v-else v-model="devis.status" @change="updateDevisStatus(devis.id, devis.status)" class="form-select form-select-sm">
                    <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-secondary me-1" @click="voirDevis(devis.id)">Voir</button>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="duplicateDevis(devis)" title="Dupliquer pour un autre client">📋</button>
                  <button class="btn btn-sm btn-danger" @click="effacerDevis(devis.id)" title="Effacer le devis">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div v-if="groupedDevis.length === 0" class="text-center py-4">
      <p class="text-muted">Aucun devis trouvé.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../../supabase.js';

// Prop per controllare se visualizzare il titolo
defineProps({
  showTitle: {
    type: Boolean,
    default: true
  }
});

// Data
const devis = ref([]);
const clients = ref([]);
const techniciens = ref([]);
// Sottofamiglie per calcolare le remise totali
const sousfamilles = ref([]);

const filterClient = ref('');
const filterTechnicien = ref('');
const filterStatus = ref('');
const sortBy = ref('numero');

const router = useRouter();
const cantieri = ref([]);

// Opzioni di stato disponibili per i devis (escludiamo "Brouillon" in quanto gestito dal flag draft)
const statusOptions = ['En cours', 'Accepté', 'Non accepté'];



// Fetch data da Supabase (devis, clients, techniciens e sousfamilles)
onMounted(async () => {
  try {
    const [devisRes, clientsRes, techRes, sousRes] = await Promise.all([
      supabase.from('devis').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('techniciens').select('*'),
      supabase.from('sousfamilles').select('*')
    ]);

    devis.value = devisRes.data || [];
    clients.value = clientsRes.data || [];
    techniciens.value = techRes.data || [];
    sousfamilles.value = sousRes.data || [];
    
    // Correggi devis esistenti senza campo draft
    const devisToFix = devis.value.filter(d => d.draft === null && d.total > 0);
    if (devisToFix.length > 0) {
      console.log(`Correzione ${devisToFix.length} devis esistenti...`);
      for (const d of devisToFix) {
        await supabase.from('devis').update({ draft: false }).eq('id', d.id);
        d.draft = false; // Aggiorna anche localmente
      }
    }
  } catch (error) {
    console.error('Errore caricamento dati:', error);
  }
});

// Computed per filtrare e ordinare i devis in base a client, technicien, stato e numero
const filteredDevis = computed(() => {
  // Applichiamo i filtri
  const list = devis.value.filter(d => {
    const clientName = getClientName(d.client_id);
    const matchClient = !filterClient.value || clientName === filterClient.value;
    const matchTech = !filterTechnicien.value || d.technicien === filterTechnicien.value;
    const state = getStatus(d);
    const matchStatus = !filterStatus.value || state === filterStatus.value;
    return matchClient && matchTech && matchStatus;
  });
  // Ordiniamo in base alla selezione
  return list.slice().sort((a, b) => {
    if (sortBy.value === 'date') {
      // Ordinamento per data (più recenti per primi)
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB - dateA;
    } else {
      // Ordinamento per numero devis (più alti per primi)
      const numA = parseInt(String(a.numero).split('-')[1] || '0', 10);
      const numB = parseInt(String(b.numero).split('-')[1] || '0', 10);
      return numB - numA;
    }
  });
});

// Computed per raggruppare devis per cantiere
const groupedDevis = computed(() => {
  const groups = {};
  
  filteredDevis.value.forEach(d => {
    const chantier = d.nom || d.adresse || 'Chantier inconnu';
    if (!groups[chantier]) {
      groups[chantier] = {
        chantier,
        devis: []
      };
    }
    groups[chantier].devis.push(d);
  });
  
  // Ordina i gruppi per nome cantiere
  return Object.values(groups).sort((a, b) => a.chantier.localeCompare(b.chantier));
});

// Helpers
const getClientName = (clientId) => {
  if (!clientId) return 'Inconnu';
  const client = clients.value.find(c => c.id == clientId);
  return client ? client.nom : 'Inconnu';
};

const formatDate = (date) => {
  if (!date) return '';
  let d = date;
  // Se viene da database come Timestamp
  if (typeof date === 'object' && typeof date.toDate === 'function') {
    d = date.toDate();
  }
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString();
};

// Calcola la somma dei pourcentage delle sottofamiglie selezionate
// Solo per devis con modalità scontistica
const calculerRemise = (remises = {}, modalitaPrezzi = 'scontistica') => {
  // Se è modalità prezzi fissi, non mostrare remise
  if (modalitaPrezzi === 'prezziFissi') {
    return 0;
  }
  
  const ids = Object.values(remises || {});
  return ids.reduce((sum, id) => {
    const sous = sousfamilles.value.find(s => s.id === id);
    const pct = sous ? Number(sous.pourcentage) || 0 : 0;
    return sum + pct;
  }, 0);
};

// Ritorna lo stato del devis: "Brouillon" se draft=true, altrimenti il campo status
const getStatus = (devisItem) => {
  // Gestisce draft come boolean o stringa
  const isDraft = devisItem.draft === true || devisItem.draft === 'true';
  return isDraft ? 'Brouillon' : (devisItem.status || 'En cours');
};

// Format euro con due decimali
const formatMontant = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

// Naviga alla pagina di visualizzazione/edizione del devis
const voirDevis = (id) => {
  // Trova il devis per determinare dove andare
  const devisItem = devis.value.find(d => d.id == id);
  if (!devisItem) return;
  
  if (devisItem.draft) {
    // Se è bozza, vai alla prima pagina per completarlo
    router.push(`/admin/devis/edit/${id}`);
  } else if (devisItem.modalita_prezzi === 'aCorps') {
    // Devis à corps completato → Prima pagina per vedere/modificare info
    router.push(`/admin/devis/edit/${id}`);
  } else {
    // Devis détaillé completato → Pagina prodotti
    router.push(`/devis/produits/${id}`);
  }
};

// Aggiorna lo stato del devis su Supabase quando l'utente seleziona un nuovo stato.
const updateDevisStatus = async (id, newStatus) => {
  try {
    const { error } = await supabase.from('devis').update({ status: newStatus }).eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du devis:', error);
  }
};

// ✅ AGGIUNTO: Funzione per eliminare un devis
const effacerDevis = async (id) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.')) {
    return;
  }
  
  try {
    const { error } = await supabase.from('devis').delete().eq('id', id);
    if (error) throw error;
    // Rimuovi il devis dalla lista locale
    devis.value = devis.value.filter(d => d.id !== id);
    alert('Devis supprimé avec succès.');
  } catch (error) {
    console.error('Erreur lors de la suppression du devis:', error);
    alert('Erreur lors de la suppression du devis: ' + error.message);
  }
};

// ✅ NUOVO: Funzione per creare devis supplementare
const creerDevisSupplementaire = (devisBase) => {
  // Naviga alla creazione devis con parametri del devis base
  const params = new URLSearchParams({
    duplicate: 'true',
    baseDevisId: devisBase.id,
    client: devisBase.client_id,
    chantier: devisBase.nom || devisBase.adresse,
    technicien: devisBase.technicien
  });
  
  router.push(`/admin/devis/create?${params.toString()}`);
};

// ✅ NUOVO: Funzione per duplicare devis per altro cliente
const duplicateDevis = async (devisOriginale) => {
  try {
    // Genera nuovo numero devis
    const numeroDevis = `DEV-${Date.now().toString().slice(-6)}`;
    
    // Crea una copia completa del devis originale
    const nuovoDevis = {
      numero: numeroDevis,
      nom: `${devisOriginale.nom} - COPIE`,
      adresse: devisOriginale.adresse,
      client_id: null, // Sarà selezionato dall'utente
      technicien: devisOriginale.technicien,
      zones: devisOriginale.zones || [],
      modalita_prezzi: devisOriginale.modalita_prezzi || 'scontistica',
      remises: devisOriginale.remises || {},
      produits: devisOriginale.produits || [],
      total: devisOriginale.total || 0,
      // Campi specifici per devis à corps
      description_corps: devisOriginale.description_corps || null,
      montant_corps: devisOriginale.montant_corps || null,
      // Altri campi
      discount: devisOriginale.discount || 0,
      conditions_generales: devisOriginale.conditions_generales || [],
      conditions_comprend: devisOriginale.conditions_comprend || [],
      conditions_ne_comprend_pas: devisOriginale.conditions_ne_comprend_pas || [],
      notes: devisOriginale.notes || '',
      hide_supplements_list: devisOriginale.hide_supplements_list || false,
      paiement: devisOriginale.paiement || null,
      // Stato iniziale
      draft: true, // Inizia come bozza per permettere modifica cliente
      status: 'En cours',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Inserisci il nuovo devis nel database
    const { data: newDevis, error } = await supabase
      .from('devis')
      .insert([nuovoDevis])
      .select()
      .single();
    
    if (error) throw error;
    
    // Aggiorna la lista locale
    devis.value.push(newDevis);
    
    alert(`Devis dupliqué avec succès! Numéro: ${numeroDevis}\nVous pouvez maintenant changer le client.`);
    
    // Naviga alla modifica del nuovo devis
    router.push(`/admin/devis/edit/${newDevis.id}`);
    
  } catch (error) {
    console.error('Erreur lors de la duplication du devis:', error);
    alert('Erreur lors de la duplication: ' + error.message);
  }
};
</script>
