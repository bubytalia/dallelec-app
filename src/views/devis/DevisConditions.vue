<template>
  <div class="container py-4">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton :onClick="retourProduits" />

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
    <div class="mb-3 d-flex justify-content-center">
      <button class="btn btn-outline-primary me-2" @click="sauvegarder(true)">💾 Sauver comme brouillon</button>
      <button class="btn btn-success" @click="sauvegarder(false)">📥 Sauvegarder le devis</button>
    </div>

    <!-- Composant PDF et bouton de génération -->
    <DevisPdf
      ref="pdfRef"
      :devisParZone="devisParZone"
      :supplementParZone="supplementParZone"
      :nomClient="nomClient"
      :nomChantier="nomChantier"
      :numeroDevis="numeroDevis"
      :dateDevis="dateDevis"
      :selectedPaiement="selectedPaiementObj"
      :conditionsComprend="selectedComprendDetails"
      :conditionsNeComprendPas="selectedExcluDetails"
      :notes="notes"
      :famillesVisibles="famillesVisibles"
      style="display: none;"
    />
    <div class="text-end mt-3">
      <button class="btn btn-primary" @click="generatePdf">Télécharger le PDF</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

// Composant PDF
import DevisPdf from '@/components/DevisPdf.vue';
import RetourButton from '@/components/RetourButton.vue';

// Route and router
const route = useRoute();
const router = useRouter();
const devisId = route.params.id;

// Liste des modalités de paiement
const paiements = ref([]);
const selectedPaiement = ref('');

// Conditions disponibles
const conditionsComprend = ref([]);
const conditionsExclues = ref([]);
const selectedComprendIds = ref([]);
const selectedExcluIds = ref([]);

// Famiglie per il PDF
const familles = ref([]);

// Notes liberi
const notes = ref('');

// Référence au composant DevisPdf
const pdfRef = ref(null);

// Données du devis pour le PDF
const devisData = ref(null);
const nomClient = ref('');
const nomChantier = ref('');
const numeroDevis = ref('');
const dateDevis = ref('');

// Computed properties pour le PDF
const devisParZone = computed(() => {
  if (!devisData.value || !Array.isArray(devisData.value.produits)) return [];
  const grouped = {};
  devisData.value.produits.forEach((item) => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone].push(item);
  });
  return Object.entries(grouped).map(([nom, produits]) => ({ nom, produits }));
});

const supplementParZone = computed(() => {
  if (!devisData.value || !Array.isArray(devisData.value.produits)) return [];
  const grouped = {};
  devisData.value.produits.forEach((item) => {
    if (Array.isArray(item.supplements) && item.supplements.length) {
      if (!grouped[item.zone]) grouped[item.zone] = [];
      grouped[item.zone].push(...item.supplements.map((s) => ({
        ...s,
        article: item.article,
        nom: item.nom,
        taille: item.taille
      })));
    }
  });
  return Object.entries(grouped).map(([nom, supplements]) => ({ nom, supplements }));
});

const selectedPaiementObj = computed(() => {
  return paiements.value.find((p) => p.id === selectedPaiement.value) || null;
});

const selectedComprendDetails = computed(() => {
  return conditionsComprend.value.filter(c => selectedComprendIds.value.includes(c.id));
});

const selectedExcluDetails = computed(() => {
  return conditionsExclues.value.filter(c => selectedExcluIds.value.includes(c.id));
});

// Computed per le famiglie visibili nel PDF
const famillesVisibles = computed(() => {
  return familles.value
    .filter(f => f.visiblePDF !== false) // Mostra solo quelle con visiblePDF !== false
    .sort((a, b) => (a.ordrePDF || 0) - (b.ordrePDF || 0)) // Ordina per ordrePDF
    .map(f => f.nom); // Restituisce solo i nomi
});

// Fonction pour générer le PDF
const generatePdf = () => {
  if (pdfRef.value && typeof pdfRef.value.generatePdf === 'function') {
    try {
      pdfRef.value.generatePdf();
    } catch (error) {
      console.error('Errore in generatePdf():', error);
      alert('Errore nella generazione PDF: ' + error.message);
    }
  } else {
    alert('PDF non prêt : les données sont encore en cours de chargement.');
  }
};

// Charge les modalités et conditions à l'ouverture
onMounted(async () => {
  // Chargement devis existant
  const devisRef = doc(db, 'devis', devisId);
  const devisSnap = await getDoc(devisRef);
  if (devisSnap.exists()) {
    const data = devisSnap.data();

    // Sauvegarde des données complètes du devis pour la génération du PDF
    devisData.value = data;
    // Dati del devis per il PDF - CORREZIONE MAPPATURA
    nomChantier.value = data.nom || ''; // data.nom è il nome del cantiere
    const adresseChantier = data.adresse || ''; // data.adresse è l'indirizzo del cantiere
    
    // Recupera il nome del cliente dall'ID
    if (data.clientId) {
      try {
        const clientRef = doc(db, 'clients', data.clientId);
        const clientSnap = await getDoc(clientRef);
        if (clientSnap.exists()) {
          const clientData = clientSnap.data();
          nomClient.value = clientData.nom || '';
        }
      } catch (e) {
        console.warn('Errore nel caricamento del cliente:', e);
        nomClient.value = 'Client inconnu';
      }
    }
    
    // Combina nome cantiere e indirizzo per il PDF
    if (adresseChantier) {
      nomChantier.value = nomChantier.value + ' - ' + adresseChantier;
    }
    numeroDevis.value = data.numero || '';
    dateDevis.value = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('fr-CH') : new Date().toLocaleDateString('fr-CH');
    
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
    paiements.value = paySnap.docs.map(docu => ({ id: docu.id, ...docu.data() }));
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
    const allConds = condSnap.docs.map(docu => ({ id: docu.id, ...docu.data() }));
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

  // Charge la liste des familles (dal répertoire 'familles')
  try {
    const famSnap = await getDocs(collection(db, 'familles'));
    familles.value = famSnap.docs.map(docu => ({ id: docu.id, ...docu.data() }));
  } catch (e) {
    console.warn('Impossible de charger les familles', e);
  }
});

/**
 * Sauvegarde les conditions et notes dans le devis.
 * Si asDraft est true, marque le devis comme brouillon; sinon, resta dans son état actuel.
 */
const sauvegarder = async (asDraft) => {
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
  } catch (error) {
    console.error('Erreur Firestore:', error);
    alert('Erreur Firestore: ' + error.message);
  }
};

// Retour à la page des produits sans sauvegarder l'état en brouillon si on modifie un devis existant
const retourProduits = () => {
  router.push(`/devis/produits/${devisId}`);
};
</script>