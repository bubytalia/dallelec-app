<template>
  <div class="card p-4 mb-4">
    <h5>Produit</h5>
    <div class="row mb-3">
      <div class="col-md-3">
        <label>Produit</label>
        <div class="position-relative">
          <input 
            v-model="searchText" 
            @focus="showDropdown = true"
            @blur="hideDropdown"
            type="text" 
            class="form-control" 
            placeholder="Rechercher un produit..."
            autocomplete="off"
          >
          <div v-if="showDropdown && filteredProduits.length > 0" class="dropdown-menu show w-100" style="max-height: 300px; overflow-y: auto; z-index: 1050;">
            <div v-if="filteredProduits.length > 50" class="dropdown-header">
              {{ filteredProduits.length }} résultats trouvés - continuez à taper pour affiner
            </div>
            <button 
              v-for="p in filteredProduits" 
              :key="p.id" 
              @mousedown="selectProduit(p)"
              class="dropdown-item"
              :class="{ 'text-danger': !Number(p.prix) || Number(p.prix) <= 0 }"
              type="button"
            >
              <strong>{{ p.article }}</strong> - {{ p.description }} ({{ p.taille }})
              <span v-if="!Number(p.prix) || Number(p.prix) <= 0" class="badge bg-danger ms-2">SANS PRIX</span>
            </button>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <label>Quantité</label>
        <input v-model.number="quantiteML" type="number" class="form-control" />
      </div>
      <div class="col-md-2" v-if="modalitaPrezzi === 'prezziFissi'">
        <label>Prix Unitaire (CHF)</label>
        <input v-model.number="prezzoManuale" type="number" step="0.01" class="form-control" placeholder="0.00" />
      </div>
      <div class="col-md-4" v-if="modalitaPrezzi !== 'railEnergie'">
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
      <div class="col-md-1">
        <label>&nbsp;</label>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="soloInformativo" v-model="soloInformativo" />
          <label class="form-check-label" for="soloInformativo">
            <small>Solo informativo</small>
          </label>
        </div>
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
const soloInformativo = ref(false);
const searchText = ref('');
const showDropdown = ref(false);

const formValide = computed(() => {
  // Verifica se il prodotto selezionato ha un prezzo valido
  const produit = produits.value.find(p => p.id === selectedProduitId.value);
  if (produit) {
    const prix = Number(produit.prix);
    if (!prix || prix <= 0) {
      return false; // Form non valido se prezzo mancante
    }
  }
  
  // Trova il prodotto selezionato per verificare se è un prodotto "ore"
  const isHourProduct = produit && (
    produit.description?.toLowerCase().includes('heure') ||
    produit.description?.toLowerCase().includes('ora') ||
    produit.nom?.toLowerCase().includes('heure') ||
    produit.nom?.toLowerCase().includes('ora')
  );
  
  // Verifica se ci sono supplementi selezionati con quantità > 0
  const hasSupplements = selectedSupplements.value.some(suppName => {
    const qty = suppQuantities.value[suppName] || 0;
    return qty > 0;
  });
  
  // Per prodotti "ore", "solo informativi", o quando ci sono supplementi, permetti quantità 0
  const quantityValid = (isHourProduct || soloInformativo.value || hasSupplements) ? 
    quantiteML.value >= 0 : quantiteML.value > 0;
  
  const baseValid = selectedProduitId.value && selectedZone.value && quantityValid;
  
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

const filteredProduits = computed(() => {
  if (!searchText.value) return produits.value;
  
  const search = searchText.value.toLowerCase();
  return produits.value.filter(p => 
    (p.article || '').toLowerCase().includes(search) ||
    (p.description || '').toLowerCase().includes(search) ||
    (p.taille || '').toLowerCase().includes(search)
  );
});

const selectProduit = (produit) => {
  // Verifica se il prodotto ha un prezzo valido
  const prix = Number(produit.prix);
  if (!prix || prix <= 0) {
    alert(`⚠️ ATTENTION: L'article ${produit.article} n'a pas de prix défini.\nVeuillez contacter l'administrateur pour corriger le prix de cet article.`);
    return;
  }
  
  selectedProduitId.value = produit.id;
  searchText.value = `${produit.article} - ${produit.description} (${produit.taille})`;
  showDropdown.value = false;
};

const hideDropdown = () => {
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

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
    searchText.value = produit ? `${produit.article} - ${produit.description} (${produit.taille})` : '';
    selectedZone.value = item.zone;
    quantiteML.value = item.ml;
    selectedSupplements.value = item.supplements?.map((s) => s.supplement) || [];
    suppQuantities.value = {};
    item.supplements?.forEach((s) => {
      suppQuantities.value[s.supplement] = s.qte;
    });
    prezzoManuale.value = item.prix || 0;
    soloInformativo.value = item.informativo || false;
  },
  { immediate: true }
);

// Aggiunge una nuova riga al devis
const ajouterLigne = () => {
  const produit = produits.value.find(p => p.id === selectedProduitId.value);
  if (!produit) return;

  // Per modalità railEnergie, non usare supplementi
  const supplementDetails = props.modalitaPrezzi === 'railEnergie' ? [] : selectedSupplements.value.map(nom => {
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
  
  // Verifica se è un prodotto "ore"
  const isHourProduct = produit.description?.toLowerCase().includes('heure') ||
                      produit.description?.toLowerCase().includes('ora') ||
                      produit.nom?.toLowerCase().includes('heure') ||
                      produit.nom?.toLowerCase().includes('ora');
  
  // Calcola il prezzo da utilizzare per questa riga
  let prixFinal;
  if (props.modalitaPrezzi === 'prezziFissi') {
    // Modalità prix fixes: usa il prezzo inserito manualmente
    prixFinal = prezzoManuale.value;
  } else if (props.modalitaPrezzi === 'railEnergie') {
    // Modalità rail d'énergie: usa prezzo base senza sconti
    prixFinal = Number(produit.prix) || 0;
  } else {
    // Modalità remise: controlla se è prezzo netto
    if (produit.prezzo_netto) {
      // Prezzo netto: non applicare sconti
      prixFinal = Number(produit.prix) || 0;
    } else {
      // Applica sconto famiglie
      const remisePct = typeof props.discountFamille === 'number' ? props.discountFamille : 0;
      const basePrix = Number(produit.prix) || 0;
      prixFinal = localEditingItem.value ? localEditingItem.value.prix : basePrix * (1 - (remisePct / 100));
    }
  }
  
  // Calcolo del totale:
  // - Se "solo informativo": totale = 0
  // - Se prodotto "ore" con quantità 0 e nessun supplemento: totale = 0
  // - Altrimenti: totalML * prixFinal (include supplementi anche se quantità prodotto = 0)
  const total = soloInformativo.value ? 0 : 
    (isHourProduct && quantiteML.value === 0 && totalSuppML === 0) ? 0 : 
    totalML * prixFinal;

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
    informativo: soloInformativo.value,
    // Dati congelati dal momento della creazione
    prixOriginal: Number(produit.prix) || 0,
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

  // Per modalità railEnergie, non usare supplementi
  const supplementDetails = props.modalitaPrezzi === 'railEnergie' ? [] : selectedSupplements.value.map(nom => {
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
  
  // Verifica se è un prodotto "ore"
  const isHourProduct = produit.description?.toLowerCase().includes('heure') ||
                      produit.description?.toLowerCase().includes('ora') ||
                      produit.nom?.toLowerCase().includes('heure') ||
                      produit.nom?.toLowerCase().includes('ora');
  
  // Calcola il prezzo per la modifica
  let prixFinal;
  if (props.modalitaPrezzi === 'prezziFissi') {
    // Modalità prix fixes: usa il prezzo inserito manualmente
    prixFinal = prezzoManuale.value;
  } else if (props.modalitaPrezzi === 'railEnergie') {
    // Modalità rail d'énergie: usa prezzo base senza sconti
    prixFinal = Number(produit.prix) || 0;
  } else {
    // Modalità remise: controlla se è prezzo netto
    if (produit.prezzo_netto) {
      // Prezzo netto: non applicare sconti
      prixFinal = Number(produit.prix) || 0;
    } else {
      // Mantieni il prezzo esistente o applica sconto
      const remisePct = typeof props.discountFamille === 'number' ? props.discountFamille : 0;
      const basePrix = Number(produit.prix) || 0;
      prixFinal = localEditingItem.value ? localEditingItem.value.prix : basePrix * (1 - (remisePct / 100));
    }
  }
  
  // Calcolo del totale:
  // - Se "solo informativo": totale = 0
  // - Se prodotto "ore" con quantità 0 e nessun supplemento: totale = 0
  // - Altrimenti: totalML * prixFinal (include supplementi anche se quantità prodotto = 0)
  const total = soloInformativo.value ? 0 : 
    (isHourProduct && quantiteML.value === 0 && totalSuppML === 0) ? 0 : 
    totalML * prixFinal;

  const updatedItem = {
    zone: selectedZone.value,
    article: produit.article,
    nom: localEditingItem.value.nom || produit.description,
    taille: localEditingItem.value.taille || produit.taglia,
    unite: localEditingItem.value.unite || produit.unite,
    ml: quantiteML.value,
    supplements: supplementDetails,
    totalSuppML,
    totalML,
    prix: prixFinal,
    total,
    informativo: soloInformativo.value,
    // Mantieni i dati originali congelati
    prixOriginal: localEditingItem.value.prixOriginal || Number(produit.prix) || 0,
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
  soloInformativo.value = false;
  searchText.value = '';
  showDropdown.value = false;
};
</script>

