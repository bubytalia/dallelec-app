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

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const { zones, devisId, editingItem, discountFamille } = defineProps<{
  zones: string[];
  devisId: string;
  editingItem: any;
  /**
   * Percentuale di sconto derivante dalle famiglie/sottofamiglie selezionate nella prima pagina.
   * Questo valore verrà sottratto dal prezzo unitario del prodotto.
   */
  discountFamille: number;
}>();

const emit = defineEmits(['update-item']);

/**
 * Rappresenta un prodotto disponibile su Firestore.
 */
type Produit = {
  id: string;
  article: string;
  description: string;
  taille: string;
  unite: string;
  prix: number;
};

type Supplement = {
  nom: string;
  valeur: number;
};

const produits = ref<Produit[]>([]);
const supplements = ref<Supplement[]>([]);

const selectedProduitId = ref('');
const selectedZone = ref('');
const quantiteML = ref(0);
const selectedSupplements = ref<string[]>([]);
const suppQuantities = ref<Record<string, number>>({});
const localEditingItem = ref<any>(null);

const formValide = computed(() => {
  return selectedProduitId.value && selectedZone.value && quantiteML.value > 0;
});

// Caricamento prodotti e supplementi da Firestore con normalizzazione
onMounted(async () => {
  const produitsSnap = await getDocs(collection(db, 'produits'));
  produits.value = produitsSnap.docs.map(d => {
    const data = d.data() as any;
    return {
      id: d.id,
      ...data,
      article: data.article ?? data.code ?? '',
      description: data.description ?? data.nom ?? ''
    };
  });

  const supplementsSnap = await getDocs(collection(db, 'supplements'));
  supplements.value = supplementsSnap.docs.map(d => d.data() as Supplement);
});

// Quando editingItem cambia, popoliamo il form con i dati della riga da modificare
watch(
  () => editingItem,
  (item) => {
    if (!item || JSON.stringify(item) === JSON.stringify(localEditingItem.value)) return;
    localEditingItem.value = { ...item };
    const produit = produits.value.find(p => p.article === item.article);
    selectedProduitId.value = produit?.id || '';
    selectedZone.value = item.zone;
    quantiteML.value = item.ml;
    selectedSupplements.value = item.supplements?.map((s: any) => s.supplement) || [];
    suppQuantities.value = {};
    item.supplements?.forEach((s: any) => {
      suppQuantities.value[s.supplement] = s.qte;
    });
  },
  { immediate: true }
);

// Aggiunge una nuova riga al devis
const ajouterLigne = () => {
  const produit = produits.value.find(p => p.id === selectedProduitId.value);
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
  const totalML = quantiteML.value + totalSuppML;
  // Calcola il prezzo da utilizzare per questa riga. Quando si crea una nuova riga
  // utilizziamo il prezzo del prodotto con lo sconto famiglie; quando si modifica
  // una riga esistente manteniamo il prezzo salvato nel documento per evitare
  // che modifiche ai listini o agli sconti alterino i preventivi già creati.
  const remisePct = typeof discountFamille === 'number' ? discountFamille : 0;
  // Se stiamo modificando un elemento esistente (localEditingItem definito),
  // conserviamo il prezzo già presente nell'elemento, altrimenti lo calcoliamo.
  const prixFinal = localEditingItem.value ? localEditingItem.value.prix : produit.prix * (1 - (remisePct / 100));
  const total = totalML * prixFinal;

  const newItem = {
    zone: selectedZone.value,
    article: produit.article ?? produit.code ?? '',
    nom: produit.description,
    taille: produit.taille,
    unite: produit.unite,
    ml: quantiteML.value,
    supplements: supplementDetails,
    totalSuppML,
    totalML,
    // Memorizziamo il prezzo finale (già scontato) per coerenza con l'importo applicato.
    // Quando si modifica un elemento esistente il prezzo rimane quello salvato.
    prix: prixFinal,
    total
  };

  emit('update-item', null, newItem);
  resetForm();
};

// Modifica una riga esistente
const modifierLigne = () => {
  if (!localEditingItem.value) return;
  const index = localEditingItem.value.index;
  const produit = produits.value.find(p => p.id === selectedProduitId.value);
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
  const totalML = quantiteML.value + totalSuppML;
  const remisePct = typeof discountFamille === 'number' ? discountFamille : 0;
  // Se stiamo modificando una riga esistente, manteniamo il prezzo salvato
  // nell'item originale; altrimenti applichiamo lo sconto famiglie.
  const prixFinal = localEditingItem.value ? localEditingItem.value.prix : produit.prix * (1 - (remisePct / 100));
  const total = totalML * prixFinal;

  const updatedItem = {
    zone: selectedZone.value,
    article: produit.article,
    nom: produit.description,
    taille: produit.taille,
    unite: produit.unite,
    ml: quantiteML.value,
    supplements: supplementDetails,
    totalSuppML,
    totalML,
    // Manteniamo il prezzo applicato: se si modifica un item esistente resta lo stesso.
    prix: prixFinal,
    total
  };

  emit('update-item', index, updatedItem);
  resetForm();
};

// Ripristina il form allo stato iniziale
const resetForm = () => {
  selectedProduitId.value = '';
  selectedZone.value = '';
  quantiteML.value = 0;
  selectedSupplements.value = [];
  suppQuantities.value = {};
  localEditingItem.value = null;
};
</script>

