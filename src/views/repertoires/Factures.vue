<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Gestion des Factures</h2>

    <!-- Form per creare fattura -->
    <div class="card p-4 mb-4">
      <h5>{{ editingFacture ? 'Modifier' : 'Créer' }} une facture</h5>
      <div class="row">
        <div class="col-md-4 mb-3">
          <label>Numéro Facture:</label>
          <input v-model="newFacture.numero" type="text" class="form-control" required />
        </div>
        <div class="col-md-4 mb-3">
          <label>Chantier:</label>
          <select v-model="newFacture.chantierId" class="form-control" required>
            <option value="">Sélectionner un chantier</option>
            <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
              {{ chantier.nom }} - {{ chantier.adresse }}
            </option>
          </select>
        </div>
        <div class="col-md-4 mb-3">
          <label>Date Facture:</label>
          <input v-model="newFacture.dateFacture" type="date" class="form-control" required />
        </div>
      </div>
      <div class="row">
        <div class="col-md-3 mb-3">
          <label>Montant HT (€):</label>
          <input v-model.number="newFacture.montantHT" type="number" step="0.01" class="form-control" required />
        </div>
        <div class="col-md-3 mb-3">
          <label>TVA (%):</label>
          <input v-model.number="newFacture.tauxTVA" type="number" step="0.01" class="form-control" value="7.7" />
        </div>
        <div class="col-md-3 mb-3">
          <label>Montant TTC (€):</label>
          <input :value="montantTTCCalcule" class="form-control" readonly />
        </div>
        <div class="col-md-3 mb-3">
          <label>Statut:</label>
          <select v-model="newFacture.statut" class="form-control">
            <option value="emise">Émise</option>
            <option value="envoyee">Envoyée</option>
            <option value="payee">Payée</option>
            <option value="en_retard">En retard</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label>Client:</label>
          <select v-model="newFacture.clientId" class="form-control">
            <option value="">Sélectionner un client</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.nom }}
            </option>
          </select>
        </div>
        <div class="col-md-6 mb-3">
          <label>Date Échéance:</label>
          <input v-model="newFacture.dateEcheance" type="date" class="form-control" />
        </div>
      </div>
      <div class="mb-3">
        <label>Notes:</label>
        <textarea v-model="newFacture.notes" class="form-control" rows="2"></textarea>
      </div>
      <div>
        <button @click="saveFacture" class="btn btn-primary me-2">
          {{ editingFacture ? 'Modifier' : 'Créer' }} Facture
        </button>
        <button v-if="editingFacture" @click="cancelEdit" class="btn btn-secondary">Annuler</button>
      </div>
    </div>

    <!-- Liste des factures -->
    <div class="card p-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5>Liste des Factures ({{ factures.length }})</h5>
        <div>
          <select v-model="filtreStatut" class="form-select">
            <option value="">Tous les statuts</option>
            <option value="emise">Émises</option>
            <option value="envoyee">Envoyées</option>
            <option value="payee">Payées</option>
            <option value="en_retard">En retard</option>
          </select>
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>N° Facture</th>
              <th>Chantier</th>
              <th>Client</th>
              <th>Date</th>
              <th>Montant HT</th>
              <th>Montant TTC</th>
              <th>Statut</th>
              <th>Échéance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="facture in facturesFiltrees" :key="facture.id">
              <td><strong>{{ facture.numero }}</strong></td>
              <td>{{ getChantierName(facture.chantier_id || facture.chantierId) }}</td>
              <td>{{ facture.client_nom || facture.clientNom || '-' }}</td>
              <td>{{ formatDate(facture.date_facture || facture.dateFacture) }}</td>
              <td>{{ formatCurrency(facture.montant_ht || facture.montantHT) }}</td>
              <td>{{ formatCurrency(facture.montant_ttc || facture.montantTTC) }}</td>
              <td>
                <span :class="getStatutClass(facture.statut)">
                  {{ getStatutLabel(facture.statut) }}
                </span>
              </td>
              <td>{{ (facture.date_echeance || facture.dateEcheance) ? formatDate(facture.date_echeance || facture.dateEcheance) : '-' }}</td>
              <td>
                <button @click="editFacture(facture)" class="btn btn-sm btn-warning me-1">✎</button>
                <button @click="genererPDF(facture)" class="btn btn-sm btn-info me-1">📄</button>
                <button @click="deleteFacture(facture.id)" class="btn btn-sm btn-danger">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="facturesFiltrees.length === 0" class="text-center text-muted py-4">
          {{ filtreStatut ? 'Aucune facture avec ce statut' : 'Aucune facture enregistrée' }}
        </div>
      </div>

      <!-- Résumé -->
      <div class="row mt-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white text-center">
            <div class="card-body">
              <h6>Total Facturé</h6>
              <h4>{{ formatCurrency(totalFacture) }}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white text-center">
            <div class="card-body">
              <h6>Payées</h6>
              <h4>{{ formatCurrency(totalPayees) }}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white text-center">
            <div class="card-body">
              <h6>En Attente</h6>
              <h4>{{ formatCurrency(totalEnAttente) }}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-danger text-white text-center">
            <div class="card-body">
              <h6>En Retard</h6>
              <h4>{{ formatCurrency(totalEnRetard) }}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import RetourButton from '@/components/RetourButton.vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const factures = ref([]);
const chantiers = ref([]);
const editingFacture = ref(null);
const filtreStatut = ref('');

const newFacture = ref({
  numero: '',
  chantierId: '',
  dateFacture: new Date().toISOString().split('T')[0],
  montantHT: 0,
  tauxTVA: 7.7,
  statut: 'emise',
  clientId: '',
  dateEcheance: '',
  notes: ''
});

const montantTTCCalcule = computed(() => {
  const ht = newFacture.value.montantHT || 0;
  const tva = newFacture.value.tauxTVA || 0;
  return (ht * (1 + tva / 100)).toFixed(2);
});

const facturesFiltrees = computed(() => {
  if (!filtreStatut.value) return factures.value;
  return factures.value.filter(f => f.statut === filtreStatut.value);
});

const totalFacture = computed(() => {
  return factures.value.reduce((sum, f) => sum + (f.montant_ttc || f.montantTTC || 0), 0);
});

const totalPayees = computed(() => {
  return factures.value
    .filter(f => f.statut === 'payee')
    .reduce((sum, f) => sum + (f.montant_ttc || f.montantTTC || 0), 0);
});

const totalEnAttente = computed(() => {
  return factures.value
    .filter(f => ['emise', 'envoyee'].includes(f.statut))
    .reduce((sum, f) => sum + (f.montant_ttc || f.montantTTC || 0), 0);
});

const totalEnRetard = computed(() => {
  return factures.value
    .filter(f => f.statut === 'en_retard')
    .reduce((sum, f) => sum + (f.montant_ttc || f.montantTTC || 0), 0);
});

const fetchFactures = async () => {
  try {
    console.log('🔍 Caricamento factures...');
    const { data, error } = await supabase
      .from('factures')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Factures data:', data);
    console.log('Factures error:', error);
    
    if (error) throw error;
    factures.value = data || [];
    console.log('Factures caricate:', factures.value.length);
  } catch (error) {
    console.error('Erreur chargement factures:', error);
  }
};

const clients = ref([]);

const fetchChantiers = async () => {
  try {
    console.log('🔍 Caricamento chantiers...');
    const { data, error } = await supabase
      .from('chantiers')
      .select('*');
    
    console.log('Chantiers data:', data);
    console.log('Chantiers error:', error);
    
    if (error) throw error;
    chantiers.value = data || [];
    console.log('Chantiers caricati:', chantiers.value.length);
  } catch (error) {
    console.error('Erreur chargement chantiers:', error);
  }
};

const fetchClients = async () => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
    
    if (error) throw error;
    clients.value = data || [];
  } catch (error) {
    console.error('Erreur chargement clients:', error);
  }
};

const saveFacture = async () => {
  if (!newFacture.value.numero || !newFacture.value.chantierId || !newFacture.value.montantHT) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }

  try {
    const factureData = {
      numero: newFacture.value.numero,
      chantier_id: newFacture.value.chantierId,
      date_facture: newFacture.value.dateFacture,
      montant_ht: newFacture.value.montantHT,
      taux_tva: newFacture.value.tauxTVA,
      montant_ttc: parseFloat(montantTTCCalcule.value),
      statut: newFacture.value.statut,
      client_nom: newFacture.value.clientNom,
      date_echeance: newFacture.value.dateEcheance,
      notes: newFacture.value.notes,
      created_at: new Date().toISOString()
    };

    if (editingFacture.value) {
      const { error } = await supabase
        .from('factures')
        .update(factureData)
        .eq('id', editingFacture.value.id);
      
      if (error) throw error;
      alert('Facture modifiée avec succès');
    } else {
      const { error } = await supabase
        .from('factures')
        .insert([factureData]);
      
      if (error) throw error;
      alert('Facture créée avec succès');
    }

    resetForm();
    fetchFactures();
  } catch (error) {
    console.error('Erreur sauvegarde facture:', error);
    alert('Erreur: ' + error.message);
  }
};

const editFacture = (facture) => {
  editingFacture.value = facture;
  newFacture.value = {
    numero: facture.numero,
    chantierId: facture.chantier_id || facture.chantierId,
    dateFacture: facture.date_facture || facture.dateFacture,
    montantHT: facture.montant_ht || facture.montantHT,
    tauxTVA: facture.taux_tva || facture.tauxTVA,
    statut: facture.statut,
    clientNom: facture.client_nom || facture.clientNom || '',
    dateEcheance: facture.date_echeance || facture.dateEcheance || '',
    notes: facture.notes || ''
  };
};

const cancelEdit = () => {
  editingFacture.value = null;
  resetForm();
};

const deleteFacture = async (id) => {
  if (!confirm('Supprimer cette facture ?')) return;
  
  try {
    const { error } = await supabase
      .from('factures')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    alert('Facture supprimée');
    fetchFactures();
  } catch (error) {
    console.error('Erreur suppression:', error);
    alert('Erreur: ' + error.message);
  }
};

const resetForm = () => {
  newFacture.value = {
    numero: '',
    chantierId: '',
    dateFacture: new Date().toISOString().split('T')[0],
    montantHT: 0,
    tauxTVA: 7.7,
    statut: 'emise',
    clientNom: '',
    dateEcheance: '',
    notes: ''
  };
  editingFacture.value = null;
};

const getChantierName = (id) => {
  const chantier = chantiers.value.find(c => c.id === id);
  return chantier ? `${chantier.nom}` : 'N/A';
};

const getStatutLabel = (statut) => {
  const labels = {
    emise: 'Émise',
    envoyee: 'Envoyée',
    payee: 'Payée',
    en_retard: 'En retard'
  };
  return labels[statut] || statut;
};

const getStatutClass = (statut) => {
  const classes = {
    emise: 'badge bg-secondary',
    envoyee: 'badge bg-info',
    payee: 'badge bg-success',
    en_retard: 'badge bg-danger'
  };
  return classes[statut] || 'badge bg-secondary';
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const genererPDF = async (facture) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  
  // Import logo
  let logo;
  try {
    const logoModule = await import('@/assets/logo.jpg');
    logo = logoModule.default;
  } catch (e) {
    console.warn('Logo non trovato');
  }
  
  // Logo Dallelec
  if (logo) {
    const logoW = 55;
    const logoH = logoW / 5.32;
    doc.addImage(logo, 'JPEG', 10, 10, logoW, logoH);
  }
  
  // Dati aziendali reali Dallelec
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const companyInfo = [
    'DALLELEC Sarl',
    'Rue de Bourgogne 25', 
    '1203 Genève',
    'contact@dallelec.ch'
  ];
  let y = 12;
  doc.setTextColor(80);
  companyInfo.forEach((line) => {
    doc.text(line, 200, y, { align: 'right' });
    y += 4;
  });
  
  // Titolo FACTURE
  doc.setFontSize(20);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(40);
  doc.text(`FACTURE N. ${facture.numero}`, 10, 40);
  
  // Date e informazioni
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Date: ${formatDate(facture.dateFacture)}`, 10, 55);
  if (facture.dateEcheance) {
    doc.text(`Échéance: ${formatDate(facture.dateEcheance)}`, 10, 63);
  }
  
  // Informations client (ragione sociale + chantier)
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text('FACTURÉ À:', 10, 85);
  
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(facture.clientNom || 'Client', 10, 95);
  doc.text(`Chantier: ${getChantierName(facture.chantierId)}`, 10, 103);
  
  // Tabella semplificata
  const head = [['Description', 'Quantité', 'Prix unitaire', 'Total HT']];
  const body = [[
    `Travaux électriques - ${getChantierName(facture.chantierId)}`,
    '1',
    facture.montantHT.toFixed(2) + ' CHF',
    facture.montantHT.toFixed(2) + ' CHF'
  ]];
  
  autoTable(doc, {
    head,
    body,
    startY: 115,
    theme: 'grid',
    headStyles: { fillColor: [230, 230, 230] }
  });
  
  const tableEndY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 150;
  const finalY = tableEndY + 10;
  
  // Totaux (TVA Suisse 7.7%)
  doc.setFontSize(10);
  doc.text(`Sous-total HT:`, 130, finalY);
  doc.text(`${facture.montantHT.toFixed(2)} CHF`, 170, finalY);
  
  const tvaRate = 7.7; // TVA Suisse
  const montantTVA = facture.montantHT * (tvaRate / 100);
  const montantTTC = facture.montantHT + montantTVA;
  
  doc.text(`TVA (${tvaRate}%):`, 130, finalY + 7);
  doc.text(`${montantTVA.toFixed(2)} CHF`, 170, finalY + 7);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL TTC:`, 130, finalY + 17);
  doc.text(`${montantTTC.toFixed(2)} CHF`, 170, finalY + 17);
  
  // Conditions de paiement (Suisse - rimossa dicitura francese)
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100);
  doc.text('Conditions de paiement: 30 jours net', 20, finalY + 35);
  
  if (facture.notes) {
    doc.text(`Notes: ${facture.notes}`, 20, finalY + 45);
  }
  
  // Pied de page (dati Svizzera)
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('DALLELEC Sarl - CHE-123.456.789 TVA - 1203 Genève', 105, 280, { align: 'center' });
  
  // Télécharger le PDF
  doc.save(`Facture_${facture.numero}.pdf`);
};

onMounted(() => {
  fetchFactures();
  fetchChantiers();
  fetchClients();
});
</script>

<style scoped>
.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>