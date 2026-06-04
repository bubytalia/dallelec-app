<template>
  <div class="container py-4">
    <RetourButton to="/admin/facturation" />
    
    <h2 class="text-center mb-4">{{ isEditing ? 'Modifier' : 'Créer' }} Facture Manuelle</h2>

    <div class="card">
      <div class="card-header">
        <h5>{{ isEditing ? 'Modifier la facture' : 'Créer une facture libre' }}</h5>
        <small v-if="isEditing" class="text-muted">Modification de la facture existante</small>
      </div>
      <div class="card-body">
        <!-- Informations générales -->
        <div class="row mb-4">
          <div class="col-md-6">
            <label>Client:</label>
            <select v-model="facture.clientId" @change="onClientChange" class="form-control" required>
              <option value="">Sélectionner un client</option>
              <option v-for="client in clients" :key="client.id" :value="client.id">
                {{ client.nom }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label>Date facture:</label>
            <input v-model="facture.dateFacture" type="date" class="form-control">
          </div>
          <div class="col-md-3">
            <label>Chantier (optionnel):</label>
            <select v-model="facture.chantierId" class="form-control">
              <option value="">Aucun chantier</option>
              <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                {{ chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '' }}{{ chantier.nom }}
              </option>
            </select>
          </div>
        </div>

        <!-- Lignes de facturation -->
        <h6>Lignes de facturation</h6>
        <table class="table">
          <thead>
            <tr>
              <th style="width: 45%;">Description</th>
              <th style="width: 8%;">Unité</th>
              <th style="width: 12%;">Quantité</th>
              <th style="width: 15%;">Prix unitaire</th>
              <th style="width: 12%;">Total</th>
              <th style="width: 8%;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ligne, index) in facture.lignes" :key="index">
              <td style="width: 45%;">
                <input v-model="ligne.description" type="text" class="form-control" placeholder="Description">
              </td>
              <td style="width: 8%;">
                <input v-model="ligne.unite" type="text" class="form-control form-control-sm" placeholder="pcs">
              </td>
              <td style="width: 12%;">
                <input v-model.number="ligne.quantite" type="number" step="0.01" class="form-control form-control-sm" @input="calculerTotal(index)">
              </td>
              <td style="width: 15%;">
                <input v-model.number="ligne.prixUnitaire" type="number" step="0.01" class="form-control form-control-sm" @input="calculerTotal(index)">
              </td>
              <td style="width: 12%;">
                <strong>{{ (ligne.quantite * ligne.prixUnitaire).toFixed(2) }} CHF</strong>
              </td>
              <td style="width: 8%;">
                <button @click="supprimerLigne(index)" class="btn btn-danger btn-sm">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mb-3">
          <button @click="ajouterLigne" class="btn btn-secondary">➕ Ajouter ligne</button>
        </div>

        <!-- Heures de régies -->
        <div v-if="facture.chantierId" class="card mb-4 border-warning">
          <div class="card-header bg-warning bg-opacity-25">
            <h6 class="mb-0">⏱ Heures de régies (pour calcul primes)</h6>
          </div>
          <div class="card-body">
            <p class="text-muted small mb-3">
              Indiquer ici les heures de régies incluses dans cette facture. Elles seront prises en compte dans le calcul des primes du chef de chantier.
            </p>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="width:120px">Heures</th>
                  <th style="width:120px">Prix/h (CHF)</th>
                  <th style="width:100px">Total</th>
                  <th style="width:60px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(regie, idx) in facture.regies" :key="idx">
                  <td><input v-model="regie.description" type="text" class="form-control form-control-sm" placeholder="Description régie"></td>
                  <td><input v-model.number="regie.heures" type="number" step="0.5" class="form-control form-control-sm"></td>
                  <td><input v-model.number="regie.prixHeure" type="number" step="0.01" class="form-control form-control-sm"></td>
                  <td><strong>{{ ((regie.heures || 0) * (regie.prixHeure || 0)).toFixed(2) }}</strong></td>
                  <td><button @click="facture.regies.splice(idx, 1)" class="btn btn-danger btn-sm">🗑</button></td>
                </tr>
              </tbody>
            </table>
            <button @click="facture.regies.push({ description: '', heures: 0, prixHeure: selectedChantierPrixRegie })"
                    class="btn btn-outline-warning btn-sm">
              ➕ Ajouter régie
            </button>
            <div v-if="facture.regies.length > 0" class="mt-2">
              <small class="text-muted">
                Total régies: <strong>{{ totalRegiesHeures }}h</strong> = <strong>{{ totalRegiesMontant.toFixed(2) }} CHF</strong>
              </small>
            </div>
          </div>
        </div>

        <!-- Totaux -->
        <div class="row">
          <div class="col-md-8"></div>
          <div class="col-md-4">
            <table class="table">
              <tbody>
                <tr>
                  <td><strong>Sous-total HT:</strong></td>
                  <td><strong>{{ totalHT.toFixed(2) }} CHF</strong></td>
                </tr>
                <tr>
                  <td>TVA (8.1%):</td>
                  <td>{{ (totalHT * 0.081).toFixed(2) }} CHF</td>
                </tr>
                <tr class="table-primary">
                  <td><strong>Total TTC:</strong></td>
                  <td><strong>{{ (totalHT * 1.081).toFixed(2) }} CHF</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Conditions de paiement -->
        <div class="mb-3">
          <label>Conditions de paiement:</label>
          <select v-model="facture.conditionsPaiement" class="form-control">
            <option value="30 jours net">30 jours net</option>
            <option v-for="modalita in modalitaPagamento" :key="modalita.id" :value="modalita.nom">
              {{ modalita.nom }}
            </option>
          </select>
        </div>

        <!-- Notes -->
        <div class="mb-3">
          <label>Notes (optionnel):</label>
          <textarea v-model="facture.notes" class="form-control" rows="3" placeholder="Notes additionnelles..."></textarea>
        </div>

        <!-- Actions -->
        <div class="text-center">
          <button @click="sauvegarderFacture" class="btn btn-success me-2" :disabled="!factureValide">
            💾 {{ isEditing ? 'Mettre à jour' : 'Sauvegarder' }} facture
          </button>
          <button @click="resetFacture" class="btn btn-secondary">
            🔄 Reset
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

const route = useRoute();
const router = useRouter();
const chantiers = ref([]);
const clients = ref([]);
const modalitaPagamento = ref([]);
const isEditing = ref(false);
const editingId = ref(null);
const facture = ref({
  clientId: '',
  clientNom: '',
  dateFacture: new Date().toISOString().split('T')[0],
  chantierId: '',
  conditionsPaiement: '30 jours net',
  notes: '',
  lignes: [
    { description: '', unite: '', quantite: 1, prixUnitaire: 0 }
  ],
  regies: []
});

const selectedChantierPrixRegie = computed(() => {
  if (!facture.value.chantierId) return 75;
  const ch = chantiers.value.find(c => c.id === facture.value.chantierId || String(c.id) === String(facture.value.chantierId));
  return ch?.prix_regie || 75;
});

const totalRegiesHeures = computed(() => {
  return facture.value.regies.reduce((sum, r) => sum + (r.heures || 0), 0);
});

const totalRegiesMontant = computed(() => {
  return facture.value.regies.reduce((sum, r) => sum + (r.heures || 0) * (r.prixHeure || 0), 0);
});

const totalHT = computed(() => {
  const totalLignes = facture.value.lignes.reduce((sum, ligne) => {
    return sum + (ligne.quantite * ligne.prixUnitaire);
  }, 0);
  return totalLignes + totalRegiesMontant.value;
});

const factureValide = computed(() => {
  const hasLignes = facture.value.lignes.some(l => l.description && l.quantite > 0 && l.prixUnitaire > 0);
  const hasRegies = facture.value.regies.some(r => r.heures > 0 && r.prixHeure > 0);
  return facture.value.clientId && (hasLignes || hasRegies);
});

const onClientChange = () => {
  const selectedClient = clients.value.find(c => c.id === facture.value.clientId);
  facture.value.clientNom = selectedClient ? selectedClient.nom : '';
  console.log('Client sélectionné:', selectedClient);
};

const fetchChantiers = async () => {
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .select('*')
      .neq('type', 'interne');
    
    if (error) throw error;
    chantiers.value = data || [];
  } catch (error) {
    console.error('Erreur chargement chantiers:', error);
  }
};

const fetchClients = async () => {
  console.log('Caricamento clienti...');
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('nom', { ascending: true });
    
    if (error) throw error;
    clients.value = data || [];
    console.log('Clienti caricati:', clients.value);
  } catch (error) {
    console.error('Erreur chargement clients:', error);
  }
};

const fetchModalitaPagamento = async () => {
  try {
    const { data, error } = await supabase
      .from('paiements')
      .select('*')
      .order('nom', { ascending: true });
    
    if (error) throw error;
    modalitaPagamento.value = data || [];
    console.log('Modalità pagamento caricate:', modalitaPagamento.value);
  } catch (error) {
    console.error('Erreur chargement modalità pagamento:', error);
  }
};

const ajouterLigne = () => {
  facture.value.lignes.push({
    description: '',
    unite: '',
    quantite: 1,
    prixUnitaire: 0
  });
};

const supprimerLigne = (index) => {
  if (facture.value.lignes.length > 1) {
    facture.value.lignes.splice(index, 1);
  }
};

const calculerTotal = (index) => {
  // Trigger reactive update
};

const calculateDateEcheance = (dateFacture, conditionsPaiement) => {
  const date = new Date(dateFacture);
  
  // Virement bancaire = à vue (0 jours)
  if (conditionsPaiement && conditionsPaiement.toLowerCase().includes('virement')) {
    return date.toISOString().split('T')[0];
  }
  
  // Estrai i giorni dalle condizioni di pagamento
  const match = conditionsPaiement.match(/(\d+)\s*jours?/i);
  const giorni = match ? parseInt(match[1]) : 30; // Default 30 giorni
  
  // Aggiungi i giorni alla data fattura
  date.setDate(date.getDate() + giorni);
  
  return date.toISOString().split('T')[0];
};

const generateNumeroFacture = async () => {
  try {
    // Usa sempre l'anno corrente
    const anno = new Date().getFullYear();
    const prefisso = 'F';
    
    // Carica tutte le fatture dell'anno corrente
    const { data: factures, error } = await supabase
      .from('factures')
      .select('numero')
      .like('numero', `${prefisso}${anno}-%`)
      .order('numero', { ascending: false });
    
    if (error) throw error;
    
    // Trova il numero più alto
    let ultimoNumero = 0;
    if (factures && factures.length > 0) {
      factures.forEach(f => {
        const match = f.numero.match(/F\d{4}-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > ultimoNumero) ultimoNumero = num;
        }
      });
    }
    
    const prossimoNumero = ultimoNumero + 1;
    return `${prefisso}${anno}-${String(prossimoNumero).padStart(3, '0')}`;
  } catch (error) {
    return `F${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
  }
};

const loadFactureForEdit = async (factureId) => {
  try {
    const { data, error } = await supabase
      .from('factures')
      .select('*')
      .eq('id', factureId)
      .single();
    
    if (error) throw error;
    
    // Popola il form con i dati esistenti
    const clientData = clients.value.find(c => c.nom === data.client_nom);
    facture.value = {
      clientId: clientData?.id || '',
      clientNom: data.client_nom,
      dateFacture: data.date_facture,
      chantierId: data.chantier_id || '',
      conditionsPaiement: data.notes?.includes('Conditions:') ? 
        data.notes.split('Conditions: ')[1]?.split('\n')[0] || '30 jours net' : '30 jours net',
      notes: data.notes?.split('Conditions:')[0]?.trim() || '',
      lignes: data.lignes || [{ description: '', unite: '', quantite: 1, prixUnitaire: 0 }],
      regies: data.regies_manuelles || []
    };
    
    isEditing.value = true;
    editingId.value = factureId;
    
  } catch (error) {
    console.error('Erreur chargement facture:', error);
    alert('Erreur chargement facture: ' + error.message);
  }
};

const sauvegarderFacture = async () => {
  if (!factureValide.value) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }
  
  try {
    const lignesFiltered = facture.value.lignes.filter(l => l.description && l.quantite > 0);
    const notesComplete = `${facture.value.notes}${facture.value.notes ? '\n' : ''}Conditions: ${facture.value.conditionsPaiement}`;
    
    if (isEditing.value) {
      // Modifica fattura esistente
      const { error } = await supabase
        .from('factures')
        .update({
          client_nom: facture.value.clientNom,
          chantier_id: facture.value.chantierId || null,
          date_facture: facture.value.dateFacture,
          date_echeance: calculateDateEcheance(facture.value.dateFacture, facture.value.conditionsPaiement),
          lignes: lignesFiltered,
          montant_ht: totalHT.value,
          montant_ttc: totalHT.value * 1.081,
          notes: notesComplete,
          regies_manuelles: facture.value.regies.length > 0 ? facture.value.regies : null
        })
        .eq('id', editingId.value);
      
      if (error) throw error;
      alert('Facture modifiée avec succès!');
      
    } else {
      // Crea nuova fattura
      const numeroFacture = await generateNumeroFacture();
      
      const { error } = await supabase
        .from('factures')
        .insert([{
          numero: numeroFacture,
          type: 'manuelle',
          client_nom: facture.value.clientNom,
          chantier_id: facture.value.chantierId || null,
          date_facture: facture.value.dateFacture,
          lignes: lignesFiltered,
          montant_ht: totalHT.value,
          taux_tva: 8.1,
          montant_ttc: totalHT.value * 1.081,
          statut: 'emise',
          notes: notesComplete,
          date_echeance: calculateDateEcheance(facture.value.dateFacture, facture.value.conditionsPaiement),
          regies_manuelles: facture.value.regies.length > 0 ? facture.value.regies : null,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      alert(`Facture ${numeroFacture} créée avec succès!`);
    }
    
    // Torna alla pagina fatturazione
    router.push('/admin/facturation');
    
  } catch (error) {
    console.error('Erreur sauvegarde facture:', error);
    alert('Erreur: ' + error.message);
  }
};

const resetFacture = () => {
    facture.value = {
      clientId: '',
      clientNom: '',
      dateFacture: new Date().toISOString().split('T')[0],
      chantierId: '',
      conditionsPaiement: '30 jours net',
      notes: '',
      lignes: [
        { description: '', unite: '', quantite: 1, prixUnitaire: 0 }
      ],
      regies: []
    };
};

onMounted(async () => {
  console.log('Componente montato, caricamento dati...');
  await fetchChantiers();
  await fetchClients();
  await fetchModalitaPagamento();
  
  // Controlla se c'è un parametro edit nell'URL
  const editId = route.query.edit;
  if (editId) {
    console.log('Modalità modifica per fattura ID:', editId);
    await loadFactureForEdit(editId);
  }
  
  console.log('Caricamento completato');
});
</script>