<template>
  <div class="container py-4">
   <h2 class="text-center mb-4">Ajout de Produits au Devis</h2>

<!-- ✅ Numéro Devis visibile -->
<div class="alert alert-info text-center mb-4" v-if="numeroDevis || nomClient || nomChantier">
  <div v-if="numeroDevis"><strong>Numéro Devis:</strong> {{ numeroDevis }}</div>
  <div v-if="nomClient"><strong>Client:</strong> {{ nomClient }}</div>
  <div v-if="nomChantier"><strong>Chantier:</strong> {{ nomChantier }}</div>
</div>

<!-- Boutons -->
<div class="mb-3 d-flex justify-content-between">
      <button class="btn btn-secondary" @click="$router.back()">← Retour</button>
      <button class="btn btn-success" @click="sauvegarderDevis">📥 Sauvegarder le devis</button>
    </div>

   
    <ProduitForm
      :editingItem="editingItem"
      :produits="produits"
      @update-item="handleUpdateItem"
    />

    <div class="card p-4 mb-4">
      <h5>Détails du Devis</h5>
      <div v-for="(zone, zoneIndex) in devisParZone" :key="zone.nom">
        <h6 class="mt-3">Zone: {{ zone.nom }}</h6>
        <table class="table">
          <thead>
            <tr>
              <th>Code Article</th>
              <th>Produit</th>
              <th>Taille</th>
              <th>Unité</th>
              <th>Quantité ML</th>
              <th>Total Suppl. (ML)</th>
              <th>Total ML</th>
              <th>Prix Unit.</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, itemIndex) in zone.produits" :key="itemIndex">
              <td>{{ item.article }}</td>
              <td>{{ item.nom }}</td>
              <td>{{ item.taille }}</td>
              <td>{{ item.unite }}</td>
              <td>{{ item.ml }}</td>
              <td>{{ item.totalSuppML.toFixed(2) }}</td>
              <td>{{ item.totalML.toFixed(2) }}</td>
              <td>{{ item.prix.toFixed(2) }}€</td>
              <td>{{ item.total.toFixed(2) }}€</td>
              <td>
                <button class="btn btn-sm btn-warning me-2" @click="modifierItem(zone.nom, itemIndex)">✎</button>
                <button class="btn btn-sm btn-danger" @click="supprimerItem(zone.nom, itemIndex)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="text-end fw-bold">
          Sous-total: {{ getSubtotal(zone.produits).toFixed(2) }}€
        </div>
      </div>
      <div class="text-end fs-5 fw-bold mt-3">
        Total Devis: {{ devisTotal.toFixed(2) }}€
      </div>
    </div>

    <SupplementDetails :supplementParZone="supplementParZone" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';

import ProduitForm from '@/components/ProduitForm.vue';
import SupplementDetails from '@/components/SupplementDetails.vue';

import { useRoute } from 'vue-router';

const route = useRoute();
const devisId = route.params.id;
const router = useRouter();
const produits = ref([]);
const devisItems = ref([]);
const editingItem = ref(null);
const numeroDevis = ref('');
const nomClient = ref('');
const nomChantier = ref('');

// Carica numero devis
onMounted(async () => {
  const devisRef = doc(db, 'devis', devisId);
  const devisSnap = await getDoc(devisRef);

  if (devisSnap.exists()) {
    const data = devisSnap.data();
    numeroDevis.value = data.numero || '';
    nomClient.value = data.nom || '';
    nomChantier.value = data.adresse || '';
  }

  const produitsSnap = await getDoc(doc(db, 'produits', 'liste'));
  if (produitsSnap.exists()) {
    produits.value = produitsSnap.data().items || [];
  }
});

// Backup automatico locale
watch(devisItems, (newVal) => {
  localStorage.setItem('devisItems', JSON.stringify(newVal));
}, { deep: true });

// Aggiunta/modifica riga
const handleUpdateItem = (index, item) => {
  const duplicate = devisItems.value.find(i =>
    i.zone === item.zone && i.nom === item.nom && i.taille === item.taille && i !== devisItems.value[index]
  );
  if (duplicate) {
    alert("Ce produit existe déjà dans cette zone.");
    return;
  }

  const refProd = produits.value.find(p => p.nom === item.nom && p.taille === item.taille);
  item.article = refProd?.code || '';

  if (index !== null && index !== undefined) {
    devisItems.value[index] = item;
  } else {
    devisItems.value.push(item);
  }
  editingItem.value = null;
};

// Modifica esistente
const modifierItem = (zoneNom, itemIndex) => {
  const zoneItems = devisParZone.value.find(z => z.nom === zoneNom)?.produits || [];
  const targetItem = zoneItems[itemIndex];
  const globalIndex = devisItems.value.findIndex(i => i === targetItem);
  if (globalIndex !== -1) {
    const item = devisItems.value[globalIndex];
    editingItem.value = {
      index: globalIndex,
      zone: item.zone,
      code: item.article,
      nom: item.nom,
      taille: item.taille,
      unite: item.unite,
      ml: item.ml,
      prix: item.prix,
      supplements: JSON.parse(JSON.stringify(item.supplements || []))
    };
  }
};

// Elimina riga
const supprimerItem = (zoneNom, itemIndex) => {
  if (confirm('Sicuro di voler eliminare la riga?')) {
    const zoneItems = devisParZone.value.find(z => z.nom === zoneNom)?.produits || [];
    const targetItem = zoneItems[itemIndex];
    const indexToRemove = devisItems.value.findIndex(i => i === targetItem);
    if (indexToRemove !== -1) devisItems.value.splice(indexToRemove, 1);
  }
};

const devisParZone = computed(() => {
  const grouped = {};
  devisItems.value.forEach(item => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone].push(item);
  });
  return Object.entries(grouped).map(([nom, produits]) => ({ nom, produits }));
});

const supplementParZone = computed(() => {
  const grouped = {};
  devisItems.value.forEach(item => {
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

const getSubtotal = (items) => items.reduce((sum, i) => sum + i.total, 0);
const devisTotal = computed(() => devisItems.value.reduce((sum, i) => sum + i.total, 0));

const sauvegarderDevis = async () => {
  try {
    if (!props.clientId || !props.chantierId) {
      alert("Client ou chantier manquant.");
      return;
    }

    await updateDoc(doc(db, 'devis', props.devisId), {
  produits: devisItems.value,
  total: devisTotal.value,
  updatedAt: new Date().toISOString()
});

    localStorage.removeItem('devisItems');
    alert('Devis sauvegardé avec succès.');
    router.back();
  } catch (error) {
    console.error('Erreur Firestore:', error);
    alert('Erreur Firestore: ' + error.message);
  }
};
</script>
