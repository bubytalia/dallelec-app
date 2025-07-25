<template>
  <div class="card p-4 mb-4">
    <h5>Produit</h5>
    <div class="row mb-3">
      <div class="col-md-3">
        <label>Produit</label>
        <select v-model="selectedProduitId" class="form-select">
          <option disabled value="">Sélectionner un produit</option>
          <option v-for="p in produits" :key="p.id" :value="p.id">
            {{ p.description }} ({{ p.taille }})
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <label>Quantité ML</label>
        <input v-model.number="quantiteML" type="number" class="form-control" />
      </div>
      <div class="col-md-4">
        <label>Suppléments</label>
        <div v-for="(sup, i) in supplements" :key="i" class="d-flex align-items-center mb-1">
          <input type="checkbox" :value="sup.nom" v-model="selectedSupplements" class="form-check-input me-2" />
          <span class="me-2">{{ sup.nom }}</span>
          <input
            v-if="selectedSupplements.includes(sup.nom)"
            type="number"
            class="form-control form-control-sm w-25"
            v-model.number="suppQuantities[sup.nom]"
            min="0"
            placeholder="Qté"
          />
        </div>
      </div>
      <div class="col-md-2">
        <label>Zone</label>
        <select v-model="selectedZone" class="form-select">
          <option disabled value="">Sélectionner une zone</option>
          <option v-for="(zone, i) in zones" :key="i" :value="zone">{{ zone }}</option>
        </select>
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
import { ref, watch, onMounted, computed, watchEffect } from 'vue';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

const props = defineProps({ editingItem: Object });
const emit = defineEmits(['update-item']);

const produits = ref([]);
const supplements = ref([]);
const zones = ref([]);

const selectedProduitId = ref('');
const selectedZone = ref('');
const quantiteML = ref(0);
const selectedSupplements = ref([]);
const suppQuantities = ref({});
const localEditingItem = ref(null);

const formValide = computed(() => selectedProduitId.value && selectedZone.value && quantiteML.value > 0);

// Caricamento prodotti e supplementi
onMounted(async () => {
  const produitsSnap = await getDocs(collection(db, 'produits'));
  produits.value = produitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const supplementsSnap = await getDocs(collection(db, 'supplements'));
  supplements.value = supplementsSnap.docs.map(d => d.data());
});

// Caricamento dinamico delle zone da localStorage
onMounted(() => {
  const savedZones = localStorage.getItem('zonesCantiere');
  if (savedZones) {
    try {
      zones.value = JSON.parse(savedZones);
    } catch (e) {
      console.error('Erreur parsing zonesCantiere:', e);
      zones.value = [];
    }
  }
});

watch(() => props.editingItem, (item) => {
  if (!item || JSON.stringify(item) === JSON.stringify(localEditingItem.value)) return;
  localEditingItem.value = { ...item };
  const produit = produits.value.find(p => p.code === item.article);
  selectedProduitId.value = produit?.id || '';
  selectedZone.value = item.zone;
  quantiteML.value = item.ml;
  selectedSupplements.value = item.supplements?.map(s => s.supplement) || [];
  suppQuantities.value = {};
  item.supplements?.forEach(s => {
    suppQuantities.value[s.supplement] = s.qte;
  });
}, { immediate: true });

const ajouterLigne = () => {
  const produit = produits.value.find(p => p.id === selectedProduitId.value);
  if (!produit) return;

  const supplementDetails = selectedSupplements.value.map(nom => {
    const supp = supplements.value.find(s => s.nom === nom);
    const qte = suppQuantities.value[nom] || 0;
    return {
      article: produit.code,
      nom: produit.description,
      taille: produit.taille,
      supplement: nom,
      valeur: supp?.valeur || 0,
      qte,
      qteTotale: qte * (supp?.valeur || 0),
      zone: selectedZone.value
    };
  });

  const totalSuppML = supplementDetails.reduce((sum, s) => sum + s.qteTotale, 0);
  const totalML = quantiteML.value + totalSuppML;
  const total = totalML * produit.prix;

  const newItem = {
    zone: selectedZone.value,
    article: produit.code,
    nom: produit.description,
    taille: produit.taille,
    unite: produit.unite,
    ml: quantiteML.value,
    supplements: supplementDetails,
    totalSuppML,
    totalML,
    prix: produit.prix,
    total
  };

  emit('update-item', null, newItem);
  resetForm();
};

const modifierLigne = () => {
  if (!localEditingItem.value) return;
  const index = localEditingItem.value.index;
  const produit = produits.value.find(p => p.id === selectedProduitId.value);
  if (!produit) return;

  const supplementDetails = selectedSupplements.value.map(nom => {
    const supp = supplements.value.find(s => s.nom === nom);
    const qte = suppQuantities.value[nom] || 0;
    return {
      article: produit.code,
      nom: produit.description,
      taille: produit.taille,
      supplement: nom,
      valeur: supp?.valeur || 0,
      qte,
      qteTotale: qte * (supp?.valeur || 0),
      zone: selectedZone.value
    };
  });

  const totalSuppML = supplementDetails.reduce((sum, s) => sum + s.qteTotale, 0);
  const totalML = quantiteML.value + totalSuppML;
  const total = totalML * produit.prix;

  const updatedItem = {
    zone: selectedZone.value,
    article: produit.code,
    nom: produit.description,
    taille: produit.taille,
    unite: produit.unite,
    ml: quantiteML.value,
    supplements: supplementDetails,
    totalSuppML,
    totalML,
    prix: produit.prix,
    total
  };

  emit('update-item', index, updatedItem);
  resetForm();
};

const resetForm = () => {
  selectedProduitId.value = '';
  selectedZone.value = '';
  quantiteML.value = 0;
  selectedSupplements.value = [];
  suppQuantities.value = {};
  localEditingItem.value = null;
};
</script>
