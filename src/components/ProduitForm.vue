<template>
  <div class="card p-4 mb-4">
    <h5>Produit</h5>
    <div class="row mb-3">
      <div class="col-md-3">
        <label>Produit</label>
        <select v-model="selectedProduitId" class="form-select">
          <option disabled value="">Code - Description (Taille)</option>
          <option v-for="p in produits" :key="p.id" :value="p.id">
            {{ p.article }} - {{ p.description }} ({{ p.taille }})
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <label>Quantité</label>
        <input v-model.number="quantiteML" type="number" class="form-control" />
      </div>
      <div class="col-md-2" v-if="modalitaPrezzi === 'prezziFissi'">
        <label>Prix Unitaire (€)</label>
        <input v-model.number="prezzoManuale" type="number" step="0.01" class="form-control" placeholder="0.00" />
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
          <option v-for="(zone, i) in props.zones" :key="i" :value="zone">{{ zone }}</option>
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
import { ref, watch, onMounted, computed } from 'vue';


const props = defineProps({
  zones: { type: Array, default: () => [] },
  devisId: { type: String, default: '' },
  editingItem: { type: Object, default: null },
  discountFamille: { type: Number, default: 0 },
  modalitaPrezzi: { type: String, default: 'scontistica' },
  produits: { type: Array, default: () => [] },
  supplements: { type: Array, default: () => [] }
});

// Uso direttamente props.zones per mantenere la reattività

const emit = defineEmits(['update-item']);

// Usa i supplementi passati come prop
const supplements = computed(() => {
  return (props.supplements || []).sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
});

const selectedProduitId = ref('');
const selectedZone = ref('');
const quantiteML = ref(0);
const selectedSupplements = ref([]);
const suppQuantities = ref({});
const localEditingItem = ref(null);
const prezzoManuale = ref(0);

const formValide = computed(() => {
  const baseValid = selectedProduitId.value && selectedZone.value && quantiteML.value > 0;
  if (props.modalitaPrezzi === 'prezziFissi') {
    return baseValid && prezzoManuale.value > 0;
  }
  return baseValid;
});




const produits = computed(() => {
  return (props.produits || []).sort((a, b) => {
    const codeA = (a.article || '').toLowerCase();
    const codeB = (b.article || '').toLowerCase();
    
    if (codeA !== codeB) {
      return codeA.localeCompare(codeB);
    }
    
    return (a.description || '').toLowerCase().localeCompare((b.description || '').toLowerCase());
  });
});

// Non serve più caricare nulla, tutto arriva come props
// onMounted(() => {
//   // Tutto caricato tramite props
// });

// Quando editingItem cambia, popoliamo il form con i dati della riga da modificare
watch(
  () => props.editingItem,
  (item) => {
    if (!item || JSON.stringify(item) === JSON.stringify(localEditingItem.value)) return;
    localEditingItem.value = { ...item };
    const produit = produits.value.find(p => p.article === item.article);
    selectedProduitId.value = produit?.id || '';
    selectedZone.value = item.zone;
    quantiteML.value = item.ml;
    selectedSupplements.value = item.supplements?.map((s) => s.supplement) || [];
    suppQuantities.value = {};
    item.supplements?.forEach((s) => {
      suppQuantities.value[s.supplement] = s.qte;
    });
    prezzoManuale.value = item.prix || 0;
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
  // Calcola il prezzo da utilizzare per questa riga
  let prixFinal;
  if (props.modalitaPrezzi === 'prezziFissi') {
    // Modalità prix fixes: usa il prezzo inserito manualmente
    prixFinal = prezzoManuale.value;
  } else {
    // Modalità remise: controlla se è prezzo netto
    if (produit.prezzoNetto) {
      // Prezzo netto: non applicare sconti
      prixFinal = produit.prix;
    } else {
      // Applica sconto famiglie
      const remisePct = typeof props.discountFamille === 'number' ? props.discountFamille : 0;
      prixFinal = localEditingItem.value ? localEditingItem.value.prix : produit.prix * (1 - (remisePct / 100));
    }
  }
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
    prix: prixFinal,
    total,
    // Dati congelati dal momento della creazione
    prixOriginal: produit.prix,
    descriptionOriginal: produit.description,
    tailleOriginal: produit.taille,
    uniteOriginal: produit.unite,
    createdAt: new Date().toISOString()
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
  
  // Calcola il prezzo per la modifica
  let prixFinal;
  if (props.modalitaPrezzi === 'prezziFissi') {
    // Modalità prix fixes: usa il prezzo inserito manualmente
    prixFinal = prezzoManuale.value;
  } else {
    // Modalità remise: controlla se è prezzo netto
    if (produit.prezzoNetto) {
      // Prezzo netto: non applicare sconti
      prixFinal = produit.prix;
    } else {
      // Mantieni il prezzo esistente o applica sconto
      const remisePct = typeof props.discountFamille === 'number' ? props.discountFamille : 0;
      prixFinal = localEditingItem.value ? localEditingItem.value.prix : produit.prix * (1 - (remisePct / 100));
    }
  }
  const total = totalML * prixFinal;

  const updatedItem = {
    zone: selectedZone.value,
    article: produit.article,
    nom: localEditingItem.value.nom || produit.description,
    taille: localEditingItem.value.taille || produit.taille,
    unite: localEditingItem.value.unite || produit.unite,
    ml: quantiteML.value,
    supplements: supplementDetails,
    totalSuppML,
    totalML,
    prix: prixFinal,
    total,
    // Mantieni i dati originali congelati
    prixOriginal: localEditingItem.value.prixOriginal || produit.prix,
    descriptionOriginal: localEditingItem.value.descriptionOriginal || produit.description,
    tailleOriginal: localEditingItem.value.tailleOriginal || produit.taille,
    uniteOriginal: localEditingItem.value.uniteOriginal || produit.unite,
    createdAt: localEditingItem.value.createdAt || new Date().toISOString()
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
  prezzoManuale.value = 0;
};
</script>

