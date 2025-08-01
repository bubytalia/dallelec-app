<template>
  <div class="container py-4">
    <h2 class="text-center mb-4">Conditions du Devis</h2>

    <!-- Modalités de paiement -->
    <div class="card p-3 mb-4">
      <h5>Modalité de paiement</h5>
      <select v-model="selectedPaiement" class="form-select w-auto">
        <option v-for="p in paiements" :key="p.id" :value="p.id">{{ p.nom }}</option>
      </select>
    </div>

    <!-- Conditions comprises -->
    <div class="card p-3 mb-4">
      <h5>Le devis comprend</h5>
      <div v-if="conditionsComprend.length === 0" class="fst-italic text-muted">Aucune condition</div>
      <div v-for="cond in conditionsComprend" :key="cond.id" class="form-check">
        <input class="form-check-input" type="checkbox" :id="'comprend-' + cond.id" v-model="selectedComprendIds" :value="cond.id" />
        <label class="form-check-label" :for="'comprend-' + cond.id">{{ cond.texte }}</label>
      </div>
    </div>

    <!-- Conditions exclues -->
    <div class="card p-3 mb-4">
      <h5>Le devis ne comprend pas</h5>
      <div v-if="conditionsExclues.length === 0" class="fst-italic text-muted">Aucune condition</div>
      <div v-for="cond in conditionsExclues" :key="cond.id" class="form-check">
        <input class="form-check-input" type="checkbox" :id="'exclu-' + cond.id" v-model="selectedExcluIds" :value="cond.id" />
        <label class="form-check-label" :for="'exclu-' + cond.id">{{ cond.texte }}</label>
      </div>
    </div>

    <!-- Notes / Annotazioni -->
    <div class="card p-3 mb-4">
      <h5>Annotazioni / Remarques</h5>
      <textarea class="form-control" v-model="notes" rows="4" placeholder="Ajouter des remarques spécifiques au devis"></textarea>
    </div>

    <!-- Boutons de navigation -->
    <div class="mb-3 d-flex justify-content-between">
      <button class="btn btn-secondary" @click="retourProduits">← Retour</button>
      <div>
        <button class="btn btn-outline-primary me-2" @click="sauvegarder(true)">💾 Sauver comme brouillon</button>
        <button class="btn btn-success" @click="sauvegarder(false)">📥 Sauvegarder le devis</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

// Route and router
const route = useRoute();
const router = useRouter();
const devisId = route.params.id as string;

// Liste des modalités de paiement
interface Paiement {
  id: string;
  label: string;
}
const paiements = ref<Paiement[]>([]);
const selectedPaiement = ref<string>('');

// Conditions disponibles
interface Condition {
  id: string;
  texte: string;
}
const conditionsComprend = ref<Condition[]>([]);
const conditionsExclues = ref<Condition[]>([]);
const selectedComprendIds = ref<string[]>([]);
const selectedExcluIds = ref<string[]>([]);

// Notes liberi
const notes = ref<string>('');

// Charge les modalités et conditions à l'ouverture
onMounted(async () => {
  // Chargement devis existant
  const devisRef = doc(db, 'devis', devisId);
  const devisSnap = await getDoc(devisRef);
  if (devisSnap.exists()) {
    const data = devisSnap.data() as any;
    // Conditions sélectionnées préexistantes (identifiants)
    if (Array.isArray(data.conditionsComprend)) {
      selectedComprendIds.value = [...data.conditionsComprend];
    }
    if (Array.isArray(data.conditionsNeComprendPas)) {
      selectedExcluIds.value = [...data.conditionsNeComprendPas];
    }
    if (data.notes) notes.value = data.notes;
    if (data.paiement) selectedPaiement.value = data.paiement;
  }

  // Charge la liste des paiements (dal répertoire 'paiements' ou 'modalites')
  try {
    const paySnap = await getDocs(collection(db, 'paiements'));
    paiements.value = paySnap.docs.map(docu => ({ id: docu.id, ...(docu.data() as any) })) as Paiement[];
    // Si aucun paiement sélectionné, prendi il primo come default
    if (!selectedPaiement.value && paiements.value.length > 0) {
      selectedPaiement.value = paiements.value[0].id;
    }
  } catch (e) {
    console.warn('Impossible de charger les modalités de paiement', e);
  }

  // Charge la liste des conditions (dal répertoire 'conditions')
  try {
    const condSnap = await getDocs(collection(db, 'conditions'));
    const allConds = condSnap.docs.map(docu => ({ id: docu.id, ...(docu.data() as any) }));
    conditionsComprend.value = allConds.filter(c => c.type === 'comprend');
    conditionsExclues.value = allConds.filter(c => c.type === 'ne_comprend_pas');
    // Preselect default conditions (campo defaultBoolean) si aucune sélection
    if (selectedComprendIds.value.length === 0) {
      selectedComprendIds.value = conditionsComprend.value.filter(c => c.default === true).map(c => c.id);
    }
    if (selectedExcluIds.value.length === 0) {
      selectedExcluIds.value = conditionsExclues.value.filter(c => c.default === true).map(c => c.id);
    }
  } catch (e) {
    console.warn('Impossible de charger les conditions', e);
  }
});

/**
 * Sauvegarde les conditions et notes dans le devis.
 * Si asDraft est true, marque le devis comme brouillon; sinon, resta dans son état actuel.
 */
const sauvegarder = async (asDraft: boolean) => {
  try {
    await updateDoc(doc(db, 'devis', devisId), {
      paiement: selectedPaiement.value,
      conditionsComprend: [...selectedComprendIds.value],
      conditionsNeComprendPas: [...selectedExcluIds.value],
      notes: notes.value,
      draft: asDraft,
      updatedAt: new Date(),
    });
    alert(asDraft ? 'Brouillon sauvegardé.' : 'Devis sauvegardé avec succès.');
    if (!asDraft) {
      router.push('/admin/devis');
    }
  } catch (error: any) {
    console.error('Erreur Firestore:', error);
    alert('Erreur Firestore: ' + error.message);
  }
};

// Retour à la page des produits sans sauvegarder l'état en brouillon si on modifie un devis existant
const retourProduits = () => {
  router.push(`/devis/produits/${devisId}`);
};
</script>