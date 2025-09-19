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
    </div>

    <!-- Tabella -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Date</th>
          <th>Numéro</th>
          <th>Client</th>
          <th>Technicien</th>
          <th>Chantier</th>
          <th>Montant (\u20AC)</th>
          <th>Remise Totale</th>
          <th>État</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="devis in filteredDevis" :key="devis.id">
          <td>{{ formatDate(devis.createdAt) }}</td>
          <td>{{ devis.numero }}</td>
          <td>{{ getClientName(devis.client_id) }}</td>
          <td>{{ devis.technicien }}</td>
          <td>{{ devis.nom || devis.adresse }}</td>
          <td>{{ formatMontant(devis.total) }}</td>
          <td>{{ calculerRemise(devis.remises, devis.modalita_prezzi) }}%</td>
          <td>
            <!-- Se il devis è in bozza, mostriamo lo stato senza possibilità di modifica -->
            <span v-if="devis.draft === true">Brouillon</span>
            <select v-else v-model="devis.status" @change="updateDevisStatus(devis.id, devis.status)" class="form-select form-select-sm">
              <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-secondary me-2" @click="voirDevis(devis.id)">Voir</button>
            <button class="btn btn-sm btn-danger" @click="effacerDevis(devis.id)" title="Effacer le devis">🗑️</button>
          </td>
        </tr>
        <tr v-if="filteredDevis.length === 0">
          <td colspan="9" class="text-center">Aucun devis trouvé.</td>
        </tr>
      </tbody>
    </table>
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

const router = useRouter();

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
  // Ordiniamo per numero devis (es. DEV-0001, DEV-0010) confrontando la parte numerica
  return list.slice().sort((a, b) => {
    const numA = parseInt(String(a.numero).split('-')[1] || '0', 10);
    const numB = parseInt(String(b.numero).split('-')[1] || '0', 10);
    // Ordine decrescente: numeri più alti per primi
    return numB - numA;
  });
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
  return devisItem.draft === true ? 'Brouillon' : (devisItem.status || 'En cours');
};

// Format euro con due decimali
const formatMontant = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

// Naviga alla pagina di visualizzazione/edizione del devis
const voirDevis = (id) => {
  // Quando si clicca su "Voir", apriamo la pagina di modifica del devis (prima pagina)
  router.push(`/admin/devis/edit/${id}`);
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
</script>
