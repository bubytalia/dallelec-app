<template>
  <div class="card p-4 mb-4">
    <h5>Métrage Produit</h5>
    
    <!-- Debug info -->
    <div class="alert alert-light mb-3">
      <small>
        <strong>Debug MetrageForm:</strong> 
        Zones: {{ zones?.length || 0 }} | 
        DevisData: {{ devisData ? 'OK' : 'NULL' }} | 
        Produits: {{ produitsDevis.length }} |
        Zone sélectionnée: {{ selectedZone }} |
        Produits zone: {{ produitsZone.length }} |
        Supplementi: {{ supplementsAnagrafica.length }}
      </small>
    </div>
    
    <div class="row mb-3">
      <div class="col-md-2">
        <label>Zone</label>
        <select v-model="selectedZone" class="form-select" @change="loadProduitsForZone">
          <option disabled value="">Sélectionner une zone</option>
          <option v-for="(zone, i) in zones" :key="i" :value="zone">{{ zone }}</option>
        </select>
      </div>
      <div class="col-md-3">
        <label>Produit</label>
        <select v-model="selectedProduitId" class="form-select">
          <option disabled value="">Sélectionner un produit</option>
          <option v-for="p in produitsZone" :key="p.id" :value="p.id">
            {{ p.nom }} ({{ p.taille }})
          </option>
        </select>
      </div>
      <div class="col-md-1">
        <label>ML Prévue</label>
        <input v-model.number="quantiteMLPrevue" type="number" class="form-control" readonly />
      </div>
      <div class="col-md-1">
        <label>ML Posée</label>
        <input v-model.number="quantiteMLPosee" type="number" class="form-control" />
      </div>
      <div class="col-md-3">
        <label>Suppléments</label>
        <div v-for="(sup, i) in supplementsDisponibles" :key="i" class="d-flex align-items-center mb-1">
          <input type="checkbox" :value="sup.nom" v-model="selectedSupplements" class="form-check-input me-2" />
          <span class="me-2">{{ sup.nom }} ({{ sup.valeur }}m)</span>
          <input
            v-if="selectedSupplements.includes(sup.nom)"
            type="number"
            class="form-control form-control-sm w-25"
            v-model.number="suppQuantities[sup.nom]"
            min="0"
            placeholder="Qté"
          />
          <span v-if="selectedSupplements.includes(sup.nom) && suppQuantities[sup.nom]" class="ms-1 text-muted small">
            = {{ (suppQuantities[sup.nom] * sup.valeur).toFixed(2) }}m
          </span>
        </div>
      </div>
      <div class="col-md-1">
        <label>Total ML</label>
        <input :value="totalMLCalculated.toFixed(2)" class="form-control" readonly />
      </div>
      <div class="col-md-1 d-flex align-items-end">
        <button
          class="btn btn-primary w-100"
          @click="localEditingItem ? modifierLigne() : ajouterLigne()"
          :disabled="!formValide"
        >
          {{ localEditingItem ? 'Modifier' : '+' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

const { zones, chantierId, devisData, editingItem } = defineProps({
  zones: Array,
  chantierId: String,
  devisData: Object,
  editingItem: Object
});

const emit = defineEmits(['update-item']);

const selectedProduitId = ref('');
const selectedZone = ref('');
const quantiteMLPrevue = ref(0);
const quantiteMLPosee = ref(0);
const selectedSupplements = ref([]);
const suppQuantities = ref({});
const localEditingItem = ref(null);
const supplementsAnagrafica = ref([]);

// Tous les produits du devis
const produitsDevis = computed(() => {
  console.log('MetrageForm - devisData:', devisData);
  if (!devisData?.produits) {
    console.log('MetrageForm - Pas de produits dans devisData');
    return [];
  }
  const produits = devisData.produits.map(p => ({
    id: p.id || `prod_${Math.random()}`,
    article: p.article || p.codeArticle || '',
    nom: p.nom || p.produit || '',
    taille: p.taille || '',
    unite: p.unite || 'm',
    ml: p.ml || p.quantiteML || 0,
    zone: p.zone,
    supplements: p.supplements || []
  }));
  console.log('MetrageForm - Produits traités:', produits);
  return produits;
});

// Produits filtrés par zone sélectionnée
const produitsZone = ref([]);

const loadProduitsForZone = () => {
  if (!selectedZone.value) {
    produitsZone.value = [];
    return;
  }
  produitsZone.value = produitsDevis.value.filter(p => p.zone === selectedZone.value);
};

// Suppléments disponibles dall'anagrafica (tutti)
const supplementsDisponibles = computed(() => {
  return supplementsAnagrafica.value;
});

// Carica supplementi dall'anagrafica
const fetchSupplements = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'supplements'));
    supplementsAnagrafica.value = snapshot.docs.map(doc => ({
      id: doc.id,
      nom: doc.data().nom,
      valeur: doc.data().valeur || 1
    }));
    console.log('Supplementi caricati:', supplementsAnagrafica.value);
  } catch (error) {
    console.error('Errore caricamento supplementi:', error);
  }
};

const formValide = computed(() => {
  return selectedProduitId.value && selectedZone.value && quantiteMLPosee.value >= 0;
});

// Calcola total ML (ML + supplementi)
const totalMLCalculated = computed(() => {
  const mlBase = quantiteMLPosee.value || 0;
  const mlSupp = selectedSupplements.value.reduce((sum, suppNom) => {
    const qte = suppQuantities.value[suppNom] || 0;
    const supp = supplementsAnagrafica.value.find(s => s.nom === suppNom);
    const valeur = supp?.valeur || 1;
    return sum + (qte * valeur);
  }, 0);
  return mlBase + mlSupp;
});

// Watch sur le produit sélectionné pour charger la quantité prévue
watch(selectedProduitId, (newId) => {
  const produit = produitsZone.value.find(p => p.id === newId);
  if (produit) {
    quantiteMLPrevue.value = produit.ml;
  } else {
    quantiteMLPrevue.value = 0;
  }
});

// Quand editingItem change, populate le form
watch(
  () => editingItem,
  (item) => {
    if (!item || JSON.stringify(item) === JSON.stringify(localEditingItem.value)) return;
    localEditingItem.value = { ...item };
    
    // Prima imposta la zona
    selectedZone.value = item.zone;
    // Poi carica i prodotti per quella zona
    loadProduitsForZone();
    
    // Aspetta che i prodotti siano caricati, poi trova il prodotto
    setTimeout(() => {
      const produit = produitsZone.value.find(p => p.article === item.article && p.nom === item.nom && p.taille === item.taille);
      selectedProduitId.value = produit?.id || '';
      quantiteMLPrevue.value = item.mlPrevue || 0;
      quantiteMLPosee.value = item.mlPosee || 0;
      selectedSupplements.value = item.supplements?.map(s => s.supplement) || [];
      suppQuantities.value = {};
      item.supplements?.forEach(s => {
        suppQuantities.value[s.supplement] = s.qte || s.qtePosee || 0;
      });
    }, 100);
  },
  { immediate: true }
);

// Ajouter une nouvelle ligne
const ajouterLigne = () => {
  const produit = produitsZone.value.find(p => p.id === selectedProduitId.value);
  if (!produit) return;

  const supplementDetails = selectedSupplements.value.map(nom => {
    const supp = supplementsAnagrafica.value.find(s => s.nom === nom);
    const qtePosee = suppQuantities.value[nom] || 0;
    return {
      article: produit.article,
      nom: produit.nom,
      taille: produit.taille,
      supplement: nom,
      valeur: supp?.valeur || 1,
      qtePosee,
      totalML: qtePosee * (supp?.valeur || 1),
      zone: selectedZone.value
    };
  });

  const totalSuppML = supplementDetails.reduce((sum, s) => sum + (s.totalML || 0), 0);

  const newItem = {
    zone: selectedZone.value,
    article: produit.article,
    nom: produit.nom,
    taille: produit.taille,
    unite: produit.unite,
    mlPrevue: quantiteMLPrevue.value,
    mlPosee: quantiteMLPosee.value,
    supplements: supplementDetails,
    totalSuppML,
    totalML: quantiteMLPosee.value + totalSuppML
  };

  emit('update-item', null, newItem);
  resetForm();
};

// Modifier une ligne existante
const modifierLigne = () => {
  if (!localEditingItem.value) return;
  const index = localEditingItem.value.index;
  const produit = produitsZone.value.find(p => p.id === selectedProduitId.value);
  if (!produit) return;

  const supplementDetails = selectedSupplements.value.map(nom => {
    const supp = supplementsAnagrafica.value.find(s => s.nom === nom);
    const qtePosee = suppQuantities.value[nom] || 0;
    return {
      article: produit.article,
      nom: produit.nom,
      taille: produit.taille,
      supplement: nom,
      valeur: supp?.valeur || 1,
      qtePosee,
      totalML: qtePosee * (supp?.valeur || 1),
      zone: selectedZone.value
    };
  });

  const totalSuppML = supplementDetails.reduce((sum, s) => sum + (s.totalML || 0), 0);

  const updatedItem = {
    zone: selectedZone.value,
    article: produit.article,
    nom: produit.nom,
    taille: produit.taille,
    unite: produit.unite,
    mlPrevue: quantiteMLPrevue.value,
    mlPosee: quantiteMLPosee.value,
    supplements: supplementDetails,
    totalSuppML,
    totalML: quantiteMLPosee.value + totalSuppML
  };

  emit('update-item', index, updatedItem);
  resetForm();
};

// Reset form
const resetForm = () => {
  selectedProduitId.value = '';
  selectedZone.value = '';
  quantiteMLPrevue.value = 0;
  quantiteMLPosee.value = 0;
  selectedSupplements.value = [];
  suppQuantities.value = {};
  localEditingItem.value = null;
};

onMounted(() => {
  fetchSupplements();
});
</script>