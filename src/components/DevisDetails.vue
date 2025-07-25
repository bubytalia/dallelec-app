<template>
  <div class="container py-4">
    <h2 class="text-center mb-4">Ajout de Produits au Devis</h2>
    <ProduitForm v-model:devisItems="devisItems" :editingItem="editingItem" @update-item="updateItem" />
    <DevisDetails
      :devisParZone="devisParZone"
      :getSubtotal="getSubtotal"
      :devisTotal="devisTotal"
      @edit-item="startEditItem"
      @delete-item="deleteItem"
    />
    <SupplementDetails :supplementParZone="supplementParZone" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ProduitForm from '@/components/ProduitForm.vue';
import SupplementDetails from '@/components/SupplementDetails.vue';

const devisItems = ref([]);
const editingItem = ref(null);

const startEditItem = (index) => {
  editingItem.value = { ...devisItems.value[index], index };
};

const updateItem = (index, updatedItem) => {
  devisItems.value[index] = { ...updatedItem };
  editingItem.value = null;
};

const deleteItem = (index) => {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette ligne ?")) {
    devisItems.value.splice(index, 1);
  }
};

const devisParZone = computed(() => {
  const grouped = {};
  devisItems.value.forEach(item => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone].push(item);
  });
  return Object.keys(grouped).map(zone => ({ nom: zone, produits: grouped[zone] }));
});

const supplementParZone = computed(() => {
  const grouped = {};
  devisItems.value.forEach(item => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone].push(...item.supplements);
  });
  return Object.keys(grouped).map(zone => ({ nom: zone, supplements: grouped[zone] }));
});

const getSubtotal = (items) => items.reduce((sum, i) => sum + i.total, 0);
const devisTotal = computed(() => devisItems.value.reduce((sum, i) => sum + i.total, 0));
</script>

<style scoped>
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
</style>
