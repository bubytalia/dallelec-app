<template>
  <div class="container py-4">
    <RetourButton to="/chef" />

    <h2 class="text-center mb-4">Métrages du Chantier</h2>

    <!-- Info cantiere e devis -->
    <div class="alert alert-info text-center mb-4" v-if="numeroDevis || nomClient || nomChantier">
      <div v-if="numeroDevis"><strong>Numéro Devis:</strong> {{ numeroDevis }}</div>
      <div v-if="nomClient"><strong>Client:</strong> {{ nomClient }}</div>
      <div v-if="nomChantier"><strong>Chantier:</strong> {{ nomChantier }}</div>
    </div>

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
              <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                {{ chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '' }}{{ chantier.nom }} - {{ chantier.adresse }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Période de référence -->
    <div class="row mb-4" v-if="selectedChantierId">
      <div class="col-md-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Période de référence</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <label class="form-label">Date début:</label>
                <input type="date" v-model="periodeDebut" class="form-control">
              </div>
              <div class="col-md-6">
                <label class="form-label">Date fin:</label>
                <input type="date" v-model="periodeFin" class="form-control">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pulsanti di navigazione e salvataggio -->
    <div class="mb-3 d-flex justify-content-center" v-if="selectedChantierId">
      <button class="btn btn-success me-2" @click="sauvegarderMetrages">📥 Sauvegarder les métrages</button>
      <button class="btn btn-outline-primary me-2" @click="sauvegarderBrouillon">💾 Sauver comme brouillon</button>
      <button class="btn btn-info me-2" @click="voirHistorique">📊 Voir historique métrées</button>
      <button class="btn btn-warning" @click="nouveauMetrage" v-if="metrageItems.length > 0">🆕 Nouveau métrage</button>
    </div>
    
    <!-- Info métrage en cours -->
    <div v-if="selectedChantierId && currentMetrageInfo" class="alert alert-warning text-center mb-4">
      <strong>Métrage en cours:</strong> {{ currentMetrageInfo }}
    </div>

    <!-- Form per aggiungere prodotti (identico a ProduitForm ma senza prezzi) -->
    <MetrageForm
      v-if="selectedChantierId && devisData"
      :editingItem="editingItem"
      :chantierId="selectedChantierId"
      :zones="zones"
      :devisData="devisData"
      @update-item="handleUpdateItem"
    />
    
    <!-- Debug info -->
    <div v-if="selectedChantierId" class="alert alert-secondary mt-2">
      <small>
        <strong>Debug:</strong> 
        Cantiere: {{ selectedChantierId }} | 
        Zones: {{ zones.length }} | 
        Produits devis: {{ devisData?.produits?.length || 0 }}
      </small>
    </div>

    <!-- Détails des Métrages (identico a DevisProduits ma senza prezzi) -->
    <div class="card p-4 mb-4" v-if="selectedChantierId && metrageItems.length > 0">
      <h5>Détails des Métrages</h5>
      <div v-for="(zone, zoneIndex) in metragesParZone" :key="zone.nom">
        <h6 class="mt-3">Zone: {{ zone.nom }}</h6>
        <table class="table">
          <thead>
            <tr>
              <th>Code Article</th>
              <th>Produit</th>
              <th>Taille</th>
              <th>Unité</th>
              <th>Quantité ML Prévue</th>
              <th>Quantité ML Posée</th>
              <th>Total Suppl. (ML)</th>
              <th>Total ML</th>
              <th>Progression</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, itemIndex) in zone.produits" :key="itemIndex">
              <td>{{ item.article }}</td>
              <td>{{ item.nom }}</td>
              <td>{{ item.taille }}</td>
              <td>{{ item.unite }}</td>
              <td>{{ item.mlPrevue }}</td>
              <td>{{ item.mlPosee }}</td>
              <td>{{ item.totalSuppML?.toFixed(2) || '0.00' }}</td>
              <td><strong>{{ item.totalML?.toFixed(2) || '0.00' }}</strong></td>
              <td>
                <span class="badge" :class="getProgressClass(item)">
                  {{ getProgressPercentage(item) }}%
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-warning me-2" @click="modifierItem(zone.nom, itemIndex)">✎</button>
                <button class="btn btn-sm btn-danger" @click="supprimerItem(zone.nom, itemIndex)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="text-end fw-bold">
          Total ML zone: {{ getSubtotalTotalML(zone.produits).toFixed(2) }} ML
        </div>
      </div>
      <div class="text-end fs-5 fw-bold mt-3">
        Total Général ML: {{ totalMLGeneral.toFixed(2) }} ML
      </div>
    </div>

    <!-- Suppléments (identico a SupplementDetails ma senza prezzi) -->
    <MetrageSupplementDetails 
      v-if="selectedChantierId"
      :supplementParZone="supplementParZone" 
    />

    <!-- Historique des métrages -->
    <div v-if="showHistorique" class="card p-4 mb-4">
      <h5>Historique des Métrages</h5>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Date</th>
            <th>Période</th>
            <th>Zone</th>
            <th>Produits</th>
            <th>ML Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="historique in historiqueMetrages" :key="historique.id">
            <td>{{ formatDate(historique.createdAt) }}</td>
            <td>
              <small v-if="historique.periodeDebut || historique.periodeFin">
                {{ historique.periodeDebut || '' }} - {{ historique.periodeFin || '' }}
              </small>
              <span v-else class="text-muted">-</span>
            </td>
            <td>{{ historique.zones?.join(', ') || 'Toutes' }}</td>
            <td>{{ historique.totalProduits || 0 }}</td>
            <td>{{ calculateTotalMLWithSupplements(historique).toFixed(2) }} ML</td>
            <td>
              <button class="btn btn-sm btn-info me-2" @click="chargerMetrage(historique)" title="Charger ce métrage">📥</button>
              <button class="btn btn-sm btn-warning me-2" @click="dupliquerMetrage(historique)" title="Dupliquer ce métrage">📋</button>
              <button class="btn btn-sm btn-danger" @click="supprimerMetrage(historique.id)" title="Supprimer ce métrage">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '@/firebase';
import { doc, getDoc, collection, getDocs, addDoc, query, where, deleteDoc } from 'firebase/firestore';
import RetourButton from '@/components/RetourButton.vue';
import MetrageForm from '@/components/MetrageForm.vue';
import MetrageSupplementDetails from '@/components/MetrageSupplementDetails.vue';

const router = useRouter();
const chantiers = ref([]);
const selectedChantierId = ref('');
const devisData = ref(null);
const zones = ref([]);
const metrageItems = ref([]);
const editingItem = ref(null);
const numeroDevis = ref('');
const nomClient = ref('');
const nomChantier = ref('');
const showHistorique = ref(false);
const historiqueMetrages = ref([]);
const currentMetrageId = ref(null);
const currentMetrageInfo = ref('');
const periodeDebut = ref('');
const periodeFin = ref('');

const fetchChantiers = async () => {
  const snapshot = await getDocs(collection(db, 'chantiers'));
  chantiers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const loadChantierData = async () => {
  if (!selectedChantierId.value) return;
  
  try {
    // Trova il cantiere selezionato
    const chantier = chantiers.value.find(c => c.id === selectedChantierId.value);
    if (!chantier || !chantier.devisId) {
      alert('Ce chantier n\'a pas de devis associé.');
      return;
    }
    
    const numeroDisplay = chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '';
    nomChantier.value = `${numeroDisplay}${chantier.nom} - ${chantier.adresse}`;
    
    // Carica il devis associato
    const devisDoc = await getDoc(doc(db, 'devis', chantier.devisId));
    if (!devisDoc.exists()) {
      alert('Devis non trouvé.');
      return;
    }
    
    const devisDocData = devisDoc.data();
    devisData.value = devisDocData;
    numeroDevis.value = devisDocData.numero || '';
    nomClient.value = devisDocData.nom || '';
    
    // Estrai le zone dai prodotti del devis
    if (devisDocData.produits && devisDocData.produits.length > 0) {
      const zoneSet = new Set();
      devisDocData.produits.forEach(produit => {
        if (produit.zone) {
          zoneSet.add(produit.zone);
        }
      });
      zones.value = Array.from(zoneSet).sort();
      console.log('Zones trovate:', zones.value);
      console.log('Produits devis:', devisDocData.produits);
    } else {
      console.log('Nessun prodotto trovato nel devis');
    }
    
    // Carica métrages esistenti per questo cantiere
    await loadExistingMetrages();
    
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    alert('Erreur lors du chargement: ' + error.message);
  }
};

const loadExistingMetrages = async () => {
  try {
    const q = query(collection(db, 'metrages'), where('chantierId', '==', selectedChantierId.value));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Prendi l'ultimo métrage salvato
      const docs = snapshot.docs.sort((a, b) => b.data().createdAt?.toDate() - a.data().createdAt?.toDate());
      const latestDoc = docs[0];
      const latestMetrage = latestDoc.data();
      
      if (latestMetrage.items) {
        metrageItems.value = latestMetrage.items;
        currentMetrageId.value = latestDoc.id;
        periodeDebut.value = latestMetrage.periodeDebut || '';
        periodeFin.value = latestMetrage.periodeFin || '';
        const date = latestMetrage.createdAt?.toDate()?.toLocaleDateString('fr-FR') || 'Date inconnue';
        const status = latestMetrage.draft ? 'Brouillon' : 'Sauvegardé';
        currentMetrageInfo.value = `${status} le ${date} - ${latestMetrage.totalProduits || 0} produits - ${calculateTotalMLWithSupplements(latestMetrage).toFixed(2)} ML`;
      }
    } else {
      // Aucun métrage existant
      metrageItems.value = [];
      currentMetrageId.value = null;
      currentMetrageInfo.value = '';
    }
  } catch (error) {
    console.error('Erreur lors du chargement des métrages existants:', error);
  }
};

// Aggiunta/modifica riga (identico a DevisProduits)
const handleUpdateItem = (index, item) => {
  const duplicate = metrageItems.value.find(i =>
    i.zone === item.zone && i.nom === item.nom && i.taille === item.taille && i !== metrageItems.value[index]
  );
  if (duplicate) {
    alert("Ce produit existe déjà dans cette zone.");
    return;
  }

  if (index !== null && index !== undefined) {
    metrageItems.value[index] = item;
  } else {
    metrageItems.value.push(item);
  }
  editingItem.value = null;
};

// Modifica esistente (identico a DevisProduits)
const modifierItem = (zoneNom, itemIndex) => {
  const zoneItems = metragesParZone.value.find(z => z.nom === zoneNom)?.produits || [];
  const targetItem = zoneItems[itemIndex];
  const globalIndex = metrageItems.value.findIndex(i => i === targetItem);
  if (globalIndex !== -1) {
    const item = metrageItems.value[globalIndex];
    editingItem.value = {
      index: globalIndex,
      zone: item.zone,
      article: item.article,
      nom: item.nom,
      taille: item.taille,
      unite: item.unite,
      mlPrevue: item.mlPrevue,
      mlPosee: item.mlPosee,
      supplements: JSON.parse(JSON.stringify(item.supplements || []))
    };
  }
};

// Elimina riga (identico a DevisProduits)
const supprimerItem = (zoneNom, itemIndex) => {
  if (confirm('Sicuro di voler eliminare la riga?')) {
    const zoneItems = metragesParZone.value.find(z => z.nom === zoneNom)?.produits || [];
    const targetItem = zoneItems[itemIndex];
    const indexToRemove = metrageItems.value.findIndex(i => i === targetItem);
    if (indexToRemove !== -1) metrageItems.value.splice(indexToRemove, 1);
  }
};

// Computed properties (identici a DevisProduits ma per ML invece di prezzi)
const metragesParZone = computed(() => {
  const grouped = {};
  metrageItems.value.forEach(item => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone].push(item);
  });
  return Object.entries(grouped).map(([nom, produits]) => ({ nom, produits }));
});

const supplementParZone = computed(() => {
  const grouped = {};
  metrageItems.value.forEach(item => {
    if (Array.isArray(item.supplements)) {
      if (!grouped[item.zone]) grouped[item.zone] = [];
      grouped[item.zone].push(...item.supplements.map(s => ({
        ...s,
        code: item.article,
        nom: item.nom,
        taille: item.taille
      })));
    }
  });
  return Object.entries(grouped).map(([nom, details]) => ({ nom, details }));
});

const getSubtotalML = (items) => items.reduce((sum, i) => sum + (i.mlPosee || 0), 0);

const getSubtotalTotalML = (items) => items.reduce((sum, i) => sum + (i.totalML || 0), 0);

const totalMLPose = computed(() => {
  return metrageItems.value.reduce((sum, i) => sum + (i.mlPosee || 0), 0);
});

const totalMLGeneral = computed(() => {
  return metrageItems.value.reduce((sum, i) => sum + (i.totalML || 0), 0);
});

const getProgressPercentage = (item) => {
  const prevue = item.mlPrevue || 0;
  const posee = item.mlPosee || 0;
  return prevue > 0 ? Math.round((posee / prevue) * 100) : 0;
};

const getProgressClass = (item) => {
  const percentage = getProgressPercentage(item);
  if (percentage === 0) return 'bg-secondary';
  if (percentage < 50) return 'bg-danger';
  if (percentage < 100) return 'bg-warning';
  return 'bg-success';
};

// Salvataggio (identico a DevisProduits)
const sauvegarderMetrages = async () => {
  try {
    const metrageData = {
      chantierId: selectedChantierId.value,
      items: metrageItems.value,
      totalML: totalMLPose.value,
      zones: zones.value,
      totalProduits: metrageItems.value.length,
      periodeDebut: periodeDebut.value,
      periodeFin: periodeFin.value,
      draft: false,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'metrages'), metrageData);
    alert('Métrages sauvegardés avec succès.');
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert('Erreur lors de la sauvegarde: ' + error.message);
  }
};

const sauvegarderBrouillon = async () => {
  try {
    const metrageData = {
      chantierId: selectedChantierId.value,
      items: metrageItems.value,
      totalML: totalMLPose.value,
      zones: zones.value,
      totalProduits: metrageItems.value.length,
      periodeDebut: periodeDebut.value,
      periodeFin: periodeFin.value,
      draft: true,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'metrages'), metrageData);
    alert('Brouillon sauvegardé.');
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert('Erreur lors de la sauvegarde: ' + error.message);
  }
};

const voirHistorique = async () => {
  showHistorique.value = !showHistorique.value;
  if (showHistorique.value) {
    try {
      const q = query(collection(db, 'metrages'), where('chantierId', '==', selectedChantierId.value));
      const snapshot = await getDocs(q);
      historiqueMetrages.value = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  }
};

const chargerMetrage = (historique) => {
  if (confirm('Charger ce métrage? Les données actuelles seront remplacées.')) {
    metrageItems.value = historique.items || [];
    currentMetrageId.value = historique.id;
    periodeDebut.value = historique.periodeDebut || '';
    periodeFin.value = historique.periodeFin || '';
    const date = historique.createdAt?.toDate()?.toLocaleDateString('fr-FR') || 'Date inconnue';
    const status = historique.draft ? 'Brouillon' : 'Sauvegardé';
    currentMetrageInfo.value = `${status} le ${date} - ${historique.totalProduits || 0} produits - ${calculateTotalMLWithSupplements(historique).toFixed(2)} ML`;
    showHistorique.value = false;
  }
};

const nouveauMetrage = () => {
  if (confirm('Créer un nouveau métrage? Les données actuelles seront perdues.')) {
    metrageItems.value = [];
    currentMetrageId.value = null;
    currentMetrageInfo.value = '';
    periodeDebut.value = '';
    periodeFin.value = '';
    editingItem.value = null;
  }
};

const supprimerMetrage = async (metrageId) => {
  if (confirm('Supprimer ce métrage?')) {
    try {
      await deleteDoc(doc(db, 'metrages', metrageId));
      
      // Si on supprime le métrage actuellement chargé, reset
      if (currentMetrageId.value === metrageId) {
        metrageItems.value = [];
        currentMetrageId.value = null;
        currentMetrageInfo.value = '';
      }
      
      await voirHistorique(); // Refresh
      alert('Métrage supprimé.');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  }
};

const dupliquerMetrage = (historique) => {
  if (confirm('Dupliquer ce métrage comme nouveau?')) {
    metrageItems.value = JSON.parse(JSON.stringify(historique.items || []));
    currentMetrageId.value = null; // Nouveau métrage
    periodeDebut.value = historique.periodeDebut || '';
    periodeFin.value = historique.periodeFin || '';
    currentMetrageInfo.value = `Dupliqué de: ${historique.createdAt?.toDate()?.toLocaleDateString('fr-FR') || 'Date inconnue'} - ${calculateTotalMLWithSupplements(historique).toFixed(2)} ML`;
    showHistorique.value = false;
  }
};

const calculateTotalMLWithSupplements = (metrage) => {
  if (!metrage.items) return 0;
  return metrage.items.reduce((sum, item) => sum + (item.totalML || 0), 0);
};

const formatDate = (date) => {
  return date?.toDate ? date.toDate().toLocaleDateString('fr-FR') : new Date(date).toLocaleDateString('fr-FR');
};

onMounted(async () => {
  await fetchChantiers();
});
</script>

<style scoped>
.badge {
  font-size: 0.8em;
  padding: 0.4em 0.6em;
}
</style>