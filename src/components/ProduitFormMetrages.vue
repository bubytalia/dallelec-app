<template>
  <div class="card p-4 mb-4">
    <h5>Ajouter/Modifier un Produit</h5>
    <div class="row mb-3">
      <div class="col-md-3">
        <label class="form-label">Produit</label>
        <select v-model="selectedProduitId" class="form-select" @change="onProductChange">
          <option disabled value="">Sélectionner un produit</option>
          <option v-for="p in produitsDisponibili" :key="p.id" :value="p.id">
            {{ p.description }} ({{ p.taille }})
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <label class="form-label">Quantité posée (ML)</label>
        <input v-model.number="quantitePosee" type="number" class="form-control" step="1" min="0" />
      </div>
      <div class="col-md-4">
        <label class="form-label">Suppléménts</label>
        <div v-for="(sup, i) in supplements" :key="i" class="d-flex align-items-center mb-1">
          <input type="checkbox" :value="sup.nom" v-model="selectedSupplements" class="form-check-input me-2" />
          <span class="me-2">{{ sup.nom }}</span>
          <input
            v-if="selectedSupplements.includes(sup.nom)"
            type="number"
            class="form-control form-control-sm w-25"
            v-model.number="suppQuantities[sup.nom]"
            min="0"
            step="1"
            placeholder="Qté"
          />
        </div>
      </div>
      <div class="col-md-2">
        <label class="form-label">Zone</label>
        <select v-model="selectedZone" class="form-select" @change="onZoneChange">
          <option value="">Sélectionner une zone</option>
          <option v-for="zone in zonesChantier" :key="zone" :value="zone">
            {{ zone }}
          </option>
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

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { supabase } from '../supabase.js';

const { editingItem, chantierId, zone, produits, zonesChantier, produitsDevis } = defineProps<{
  editingItem: any;
  chantierId: string;
  zone: string;
  produits: any[];
  zonesChantier: string[];
  produitsDevis: any[];
}>();

const emit = defineEmits(['update-item', 'zone-change']);

type Supplement = {
  nom: string;
  valeur: number;
};

const supplements = ref<Supplement[]>([]);

const selectedProduitId = ref('');
const quantitePosee = ref(0);
const selectedSupplements = ref<string[]>([]);
const suppQuantities = ref<Record<string, number>>({});
const localEditingItem = ref<any>(null);
const selectedZone = ref(zone);

const formValide = computed(() => {
  return selectedProduitId.value && quantitePosee.value > 0;
});

// Usa i prodotti del devis invece di tutti i prodotti
const produitsDisponibili = computed(() => {
  return produitsDevis && produitsDevis.length > 0 ? produitsDevis : [];
});

// Caricamento supplementi da Supabase
onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('supplements')
      .select('*')
      .order('ordre');
    
    if (error) throw error;
    supplements.value = data || [];
  } catch (error) {
    console.error('Erreur lors du chargement des suppléments:', error);
    supplements.value = [];
  }
});

// Quando editingItem cambia, popoliamo il form
watch(
  () => editingItem,
  (item) => {
    if (!item || JSON.stringify(item) === JSON.stringify(localEditingItem.value)) return;
    localEditingItem.value = { ...item };
    const produit = produitsDisponibili.value.find(p => p.article === item.article);
    selectedProduitId.value = produit?.id || '';
    quantitePosee.value = item.quantitePosee || 0;
    selectedSupplements.value = item.supplements?.map((s: any) => s.supplement) || [];
    suppQuantities.value = {};
    item.supplements?.forEach((s: any) => {
      suppQuantities.value[s.supplement] = s.qte;
    });
  },
  { immediate: true }
);

// Reset supplementi quando cambia il prodotto
const onProductChange = () => {
  selectedSupplements.value = [];
  suppQuantities.value = {};
};

// Gestione cambio zona
const onZoneChange = () => {
  emit('zone-change', selectedZone.value);
};

// Aggiunge una nuova riga
const ajouterLigne = () => {
  const produit = produitsDisponibili.value.find(p => p.id === selectedProduitId.value);
  if (!produit) return;

  const supplementDetails = selectedSupplements.value.map(nom => {
    const supp = supplements.value.find(s => s.nom === nom);
    const qte = suppQuantities.value[nom] || 0;
    return {
      article: produit.article,
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

  const newItem = {
    zone: selectedZone.value,
    article: produit.article ?? produit.code ?? '',
    nom: produit.description,
    taille: produit.taille,
    unite: produit.unite,
    ml: produit.ml || 0, // Quantità prevista dal devis
    quantitePosee: quantitePosee.value, // Quantità posata dal capocantiere
    supplements: supplementDetails,
    totalSuppML,
    totalML: quantitePosee.value + totalSuppML
  };

  emit('update-item', null, newItem);
  resetForm();
};

// Modifica una riga esistente
const modifierLigne = () => {
  if (!localEditingItem.value) return;
  const index = localEditingItem.value.index;
  const produit = produitsDisponibili.value.find(p => p.id === selectedProduitId.value);
  if (!produit) return;

  const supplementDetails = selectedSupplements.value.map(nom => {
    const supp = supplements.value.find(s => s.nom === nom);
    const qte = suppQuantities.value[nom] || 0;
    return {
      article: produit.article,
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

  const updatedItem = {
    zone: selectedZone.value,
    article: produit.article,
    nom: produit.description,
    taille: produit.taille,
    unite: produit.unite,
    ml: produit.ml || 0,
    quantitePosee: quantitePosee.value,
    supplements: supplementDetails,
    totalSuppML,
    totalML: quantitePosee.value + totalSuppML
  };

  emit('update-item', index, updatedItem);
  resetForm();
};

// Ripristina il form allo stato iniziale
const resetForm = () => {
  selectedProduitId.value = '';
  quantitePosee.value = 0;
  selectedSupplements.value = [];
  suppQuantities.value = {};
  localEditingItem.value = null;
};
</script>
