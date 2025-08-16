<template>
  <div class="container py-4">
    <RetourButton to="/admin/facturation" />
    
    <h2 class="text-center mb-4">Facture Manuelle</h2>

    <div class="card">
      <div class="card-header">
        <h5>Créer une facture libre</h5>
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
              <th>Description</th>
              <th>Unité</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ligne, index) in facture.lignes" :key="index">
              <td>
                <input v-model="ligne.description" type="text" class="form-control" placeholder="Description">
              </td>
              <td>
                <input v-model="ligne.unite" type="text" class="form-control" placeholder="pcs, h, ml...">
              </td>
              <td>
                <input v-model.number="ligne.quantite" type="number" step="0.01" class="form-control" @input="calculerTotal(index)">
              </td>
              <td>
                <input v-model.number="ligne.prixUnitaire" type="number" step="0.01" class="form-control" @input="calculerTotal(index)">
              </td>
              <td>
                <strong>{{ (ligne.quantite * ligne.prixUnitaire).toFixed(2) }} CHF</strong>
              </td>
              <td>
                <button @click="supprimerLigne(index)" class="btn btn-danger btn-sm">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mb-3">
          <button @click="ajouterLigne" class="btn btn-secondary">➕ Ajouter ligne</button>
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
                  <td>TVA (7.7%):</td>
                  <td>{{ (totalHT * 0.077).toFixed(2) }} CHF</td>
                </tr>
                <tr class="table-primary">
                  <td><strong>Total TTC:</strong></td>
                  <td><strong>{{ (totalHT * 1.077).toFixed(2) }} CHF</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Notes -->
        <div class="mb-3">
          <label>Notes (optionnel):</label>
          <textarea v-model="facture.notes" class="form-control" rows="3" placeholder="Notes additionnelles..."></textarea>
        </div>

        <!-- Actions -->
        <div class="text-center">
          <button @click="sauvegarderFacture" class="btn btn-success me-2" :disabled="!factureValide">
            💾 Sauvegarder facture
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
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

const chantiers = ref([]);
const clients = ref([]);
const facture = ref({
  clientId: '',
  clientNom: '',
  dateFacture: new Date().toISOString().split('T')[0],
  chantierId: '',
  notes: '',
  lignes: [
    { description: '', unite: '', quantite: 1, prixUnitaire: 0 }
  ]
});

const totalHT = computed(() => {
  return facture.value.lignes.reduce((sum, ligne) => {
    return sum + (ligne.quantite * ligne.prixUnitaire);
  }, 0);
});

const factureValide = computed(() => {
  return facture.value.clientId && 
         facture.value.lignes.some(l => l.description && l.quantite > 0 && l.prixUnitaire > 0);
});

const onClientChange = () => {
  const selectedClient = clients.value.find(c => c.id === facture.value.clientId);
  facture.value.clientNom = selectedClient ? selectedClient.nom : '';
  console.log('Client sélectionné:', selectedClient);
};

const fetchChantiers = async () => {
  const snapshot = await getDocs(collection(db, 'chantiers'));
  chantiers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchClients = async () => {
  console.log('Caricamento clienti...');
  const snapshot = await getDocs(collection(db, 'clients'));
  clients.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.nom.localeCompare(b.nom));
  console.log('Clienti caricati:', clients.value);
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

const sauvegarderFacture = async () => {
  console.log('Début sauvegarde facture...');
  console.log('Données facture:', facture.value);
  console.log('Total HT:', totalHT.value);
  console.log('Facture valide:', factureValide.value);
  
  if (!factureValide.value) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }
  try {
    // Genera numero fattura progressivo
    const facturesSnapshot = await getDocs(collection(db, 'factures'));
    const numeroFacture = `F${new Date().getFullYear()}-${String(facturesSnapshot.size + 1).padStart(3, '0')}`;
    
    const factureData = {
      numero: numeroFacture,
      type: 'manuelle',
      clientNom: facture.value.clientNom,
      chantierId: facture.value.chantierId || null,
      dateFacture: facture.value.dateFacture,
      lignes: facture.value.lignes.filter(l => l.description && l.quantite > 0),
      montantHT: totalHT.value,
      tauxTVA: 7.7,
      montantTTC: totalHT.value * 1.077,
      statut: 'emise',
      notes: facture.value.notes,
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date()
    };
    
    console.log('Données à sauvegarder:', factureData);
    
    const docRef = await addDoc(collection(db, 'factures'), factureData);
    console.log('Facture sauvegardée avec ID:', docRef.id);
    
    alert(`Facture ${numeroFacture} créée avec succès!`);
    resetFacture();
    
  } catch (error) {
    console.error('Erreur création facture:', error);
    alert('Erreur: ' + error.message);
  }
};

const resetFacture = () => {
  facture.value = {
    clientId: '',
    clientNom: '',
    dateFacture: new Date().toISOString().split('T')[0],
    chantierId: '',
    notes: '',
    lignes: [
      { description: '', unite: '', quantite: 1, prixUnitaire: 0 }
    ]
  };
};

onMounted(async () => {
  console.log('Componente montato, caricamento dati...');
  await fetchChantiers();
  await fetchClients();
  console.log('Caricamento completato');
});
</script>