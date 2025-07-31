<template>
  <div class="container py-4">
   <h2 class="text-center mb-4">Ajout de Produits au Devis</h2>

<!-- ✅ Numéro Devis visibile -->
<div class="alert alert-info text-center mb-4" v-if="numeroDevis || nomClient || nomChantier">
  <div v-if="numeroDevis"><strong>Numéro Devis:</strong> {{ numeroDevis }}</div>
  <div v-if="nomClient"><strong>Client:</strong> {{ nomClient }}</div>
  <div v-if="nomChantier"><strong>Chantier:</strong> {{ nomChantier }}</div>
</div>

<!-- Pulsanti di navigazione e salvataggio -->
<div class="mb-3 d-flex justify-content-between">
  <button class="btn btn-secondary" @click="$router.back()">← Retour</button>
  <!-- Salvataggio definitivo -->
  <button class="btn btn-success" @click="sauvegarderDevis(false)">📥 Sauvegarder le devis</button>
  <!-- Salvataggio come bozza -->
  <button class="btn btn-outline-primary" @click="sauvegarderDevis(true)">💾 Sauver comme brouillon</button>
  <!-- Abbandono del preventivo -->
  <button class="btn btn-danger" @click="abandonnerDevis">❌ Abandonner</button>
</div>


   
    <ProduitForm
  :editingItem="editingItem"
  :devisId="devisId"
  :zones="zones"
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

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '@/firebase';
// Importiamo solo le funzioni necessarie per questo componente
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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

/**
 * Salva il devis su Firestore.
 * Se asDraft è true, imposta draft: true (bozza); altrimenti draft: false.
 * Aggiorna anche updatedAt e total.
 */
const sauvegarderDevis = async (asDraft = false) => {
  try {
    await updateDoc(doc(db, 'devis', devisId), {
      produits: devisItems.value,
      total: devisTotal.value,
      draft: asDraft,
      updatedAt: new Date()
    });
    localStorage.removeItem('devisItems');
    alert(asDraft ? 'Brouillon sauvegardé.' : 'Devis sauvegardé avec succès.');
    // Se non è più una bozza, torniamo alla lista dei devis
    if (!asDraft) {
      router.push('/admin/devis/list');
    }
  } catch (error) {
    console.error('Erreur Firestore:', error);
    alert('Erreur Firestore: ' + error.message);
  }
};

/**
 * Abbandona il devis: conferma, elimina il documento e il backup locale.
 */
const abandonnerDevis = async () => {
  if (!confirm('Sei sicuro di voler abbandonare il devis? Tutte le modifiche non salvate verranno perse.')) {
    return;
  }
  try {
    await deleteDoc(doc(db, 'devis', devisId));
    localStorage.removeItem('devisItems');
    alert('Bozza eliminata.');
    router.push('/admin/devis/list');
  } catch (error) {
    console.error('Erreur Firestore:', error);
    alert('Erreur Firestore: ' + error.message);
  }
};

// ✅ AGGIUNTA QUI
const zones = ref<string[]>([]);

// Carica numero devis
onMounted(async () => {
  const devisRef = doc(db, 'devis', devisId);
  const devisSnap = await getDoc(devisRef);

  if (devisSnap.exists()) {
    const data = devisSnap.data();
    numeroDevis.value = data.numero || '';
    nomClient.value = data.nom || '';
    nomChantier.value = data.adresse || '';
    zones.value = data.zones || [];
  }

  const produitsSnap = await getDoc(doc(db, 'produits', 'liste'));
if (produitsSnap.exists()) {
  // Normalizziamo i prodotti in modo da avere sempre `article` e `description`
  const items = produitsSnap.data().items || [];
  produits.value = items.map(p => ({
    ...p,
    article: p.article ?? p.code ?? '',
    description: p.description ?? p.nom ?? ''
  }));
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

 // Se l'articolo non è già presente (nuovo item), proviamo a recuperarlo dalla lista prodotti
if (!item.article) {
  const refProd = produits.value.find(
    p => p.description === item.nom && p.taille === item.taille
  );
  item.article = refProd?.article || item.article;
}


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
  // includiamo sia article che code per il form
  article: item.article,
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

</script>
