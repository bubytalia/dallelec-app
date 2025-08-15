<template>
  <div v-if="hasChanges" class="alert alert-warning">
    <h6>⚠️ Modifiche rilevate nell'anagrafica</h6>
    <p>I seguenti dati sono cambiati rispetto a quando il devis è stato creato:</p>
    <ul>
      <li v-for="change in changes" :key="change.field">
        <strong>{{ change.produit }}</strong>: {{ change.field }} 
        (era: {{ change.oldValue }}, ora: {{ change.newValue }})
      </li>
    </ul>
    <small>I prezzi nel devis rimangono quelli originali per mantenere l'integrità commerciale.</small>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

const props = defineProps({
  devisItems: {
    type: Array,
    required: true
  }
});

const produitsAttuali = ref([]);
const changes = ref([]);

const hasChanges = computed(() => changes.value.length > 0);

const checkIntegrity = async () => {
  if (!props.devisItems?.length) return;
  
  const snapshot = await getDocs(collection(db, 'produits'));
  produitsAttuali.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  changes.value = [];
  
  props.devisItems.forEach(item => {
    if (!item.prixOriginal) return;
    
    const prodottoAttuale = produitsAttuali.value.find(p => p.article === item.article);
    if (!prodottoAttuale) return;
    
    if (Math.abs(prodottoAttuale.prix - item.prixOriginal) > 0.01) {
      changes.value.push({
        produit: item.nom,
        field: 'Prezzo',
        oldValue: `${item.prixOriginal}€`,
        newValue: `${prodottoAttuale.prix}€`
      });
    }
    
    if (prodottoAttuale.description !== item.descriptionOriginal) {
      changes.value.push({
        produit: item.nom,
        field: 'Descrizione',
        oldValue: item.descriptionOriginal,
        newValue: prodottoAttuale.description
      });
    }
  });
};

onMounted(checkIntegrity);
</script>