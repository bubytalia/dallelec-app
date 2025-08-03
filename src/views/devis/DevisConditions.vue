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

    <!-- Composant PDF et bouton de génération -->
    <!--
      Le composant DevisPdf est inclus ici (potentiellement caché) afin de
      permettre la génération du PDF à la demande. Toutes les données du devis
      et des conditions sont passées en propriétés. Lorsque l'utilisateur
      clique sur "Télécharger le PDF", la méthode generatePdf() exposée
      par DevisPdf sera invoquée via la référence pdfRef.
    -->
    <!--
      On ne peut pas utiliser `display: none` ici car html2canvas
      et jsPDF ignorent complètement les éléments qui ne sont pas
      rendus dans le DOM. Pour permettre au composant PDF d'être
      capturé tout en restant invisible pour l'utilisateur, on le
      déplace en dehors de la zone visible. La position absolue et
      une valeur `left` très négative garantissent qu'il reste
      renderisé mais hors écran.  N'ajoutez pas opacity 0, car
      certains navigateurs et html2canvas ne capturent pas les
      éléments complètement transparents.
    -->
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

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

// Composant PDF et image des suppléments
import DevisPdf from '@/components/DevisPdf.vue';
import supplementsImage from '@/assets/supplements_page1.png';

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

/*
 * Variables et propriétés pour la génération du PDF du devis.
 *
 * Le devis est regroupé par zone et ses suppléments sont également regroupés
 * pour fournir au composant DevisPdf toutes les informations nécessaires.
 */
// Référence au composant DevisPdf pour pouvoir appeler generatePdf()
const pdfRef = ref<any>(null);
// Données complètes du devis (tel qu'enregistrées dans Firestore)
const devisData = ref<any>(null);
// Remise supplémentaire (%) appliquée au devis
const remiseSupplementaire = ref<number>(0);

// Regroupe les produits par zone pour l'impression PDF
// Si le devis chargé depuis Firestore ne contient pas encore de produits
// (par exemple si l'utilisateur n'a pas encore sauvegardé la deuxième page),
// on tente de récupérer les produits depuis le localStorage.  Cela permet
// d'imprimer un devis en cours de création sans obliger l'utilisateur à
// sauvegarder au préalable.
const devisParZone = computed(() => {
  let produitsArray: any[] = [];
  if (devisData.value && Array.isArray(devisData.value.produits) && devisData.value.produits.length > 0) {
    produitsArray = devisData.value.produits;
  } else {
    try {
      const saved = localStorage.getItem('devisItems');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) produitsArray = parsed;
      }
    } catch (e) {
      console.warn('Impossible de lire devisItems depuis localStorage pour le PDF', e);
    }
  }
  if (!Array.isArray(produitsArray) || produitsArray.length === 0) return [];
  const grouped: Record<string, any[]> = {};
  produitsArray.forEach((item: any) => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone].push(item);
  });
  return Object.entries(grouped).map(([nom, produits]) => {
    // Ordiniamo i prodotti all'interno di ogni zona per codice articolo
    const sortedProduits = Array.isArray(produits)
      ? produits.slice().sort((a, b) => {
          const aCode = (a.article || '').toString().toUpperCase();
          const bCode = (b.article || '').toString().toUpperCase();
          return aCode.localeCompare(bCode);
        })
      : produits;
    return { nom, produits: sortedProduits };
  });
});

// Regroupe les suppléments par zone pour l'impression PDF.
// Comme pour les produits, si les données du devis ne sont pas chargées,
// on tente de récupérer les éléments depuis le localStorage.
const supplementParZone = computed(() => {
  let produitsArray: any[] = [];
  if (devisData.value && Array.isArray(devisData.value.produits) && devisData.value.produits.length > 0) {
    produitsArray = devisData.value.produits;
  } else {
    try {
      const saved = localStorage.getItem('devisItems');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) produitsArray = parsed;
      }
    } catch (e) {
      console.warn('Impossible de lire devisItems depuis localStorage pour les suppléments PDF', e);
    }
  }
  if (!Array.isArray(produitsArray) || produitsArray.length === 0) return [];
  const grouped: Record<string, any[]> = {};
  produitsArray.forEach((item: any) => {
    if (Array.isArray(item.supplements) && item.supplements.length) {
      if (!grouped[item.zone]) grouped[item.zone] = [];
      // Pour chaque supplément, nous copions les propriétés nécessaires et
      // conservons également article/nom/taille du produit parent pour
      // faciliter l'affichage dans le PDF.
      grouped[item.zone].push(
        ...item.supplements.map((s: any) => {
          // Calcoliamo il totale ML per il supplemento se non presente: qte * valeur
          const totalML = typeof s.totalML === 'number' ? s.totalML : (s.qte || 0) * (s.valeur || 0)
          return {
            ...s,
            totalML,
            article: item.article,
            nom: item.nom,
            taille: item.taille
          }
        })
      );
    }
  });
  return Object.entries(grouped).map(([nom, supplements]) => ({ nom, supplements }));
});

// Date du devis (formatée) : si le champ createdAt existe, on l'utilise, sinon date actuelle
const dateDevis = computed(() => {
  if (devisData.value && devisData.value.createdAt) {
    const ts: any = devisData.value.createdAt;
    if (ts && typeof ts.seconds === 'number') {
      return new Date(ts.seconds * 1000).toLocaleDateString('fr-CH');
    }
  }
  return new Date().toLocaleDateString('fr-CH');
});

// Numéro du devis
const numeroDevis = computed(() => devisData.value?.numero || '');

// Nom du client et nom du chantier (adresse)
const nomClient = computed(() => {
  return devisData.value?.clientNom || devisData.value?.nom || '';
});
const nomChantier = computed(() => {
  return devisData.value?.adresse || '';
});

// Objet complet de la modalité de paiement sélectionnée
const selectedPaiementObj = computed(() => {
  return paiements.value.find((p: any) => p.id === selectedPaiement.value) || null;
});

// Détails complets des conditions sélectionnées
const selectedComprendDetails = computed(() => {
  return conditionsComprend.value.filter(c => selectedComprendIds.value.includes(c.id));
});
const selectedExcluDetails = computed(() => {
  return conditionsExclues.value.filter(c => selectedExcluIds.value.includes(c.id));
});

// Elenco delle famiglie e sottofamiglie da visualizzare nella sezione "Type de pose".
// È determinato dalla mappa `remises` salvata nel documento del devis: per ogni
// famiglia (chiave) troviamo la sous‑famille selezionata (valore) e ne
// recuperiamo i nomi dalle raccolte Firestore 'familles' e 'sousfamilles'.
// Se nessuna remise è presente, restituiamo un array vuoto.
const famillesList = ref<any[]>([]);
const sousfamillesList = ref<any[]>([]);
const famillesVisibles = computed(() => {
  const res: string[] = [];
  const remises = devisData.value?.remises || {};
  for (const familleId in remises) {
    const sousId = remises[familleId];
    const fam = famillesList.value.find(f => f.id === familleId && (f.visibleInPdf === true || f.visibleInPdf === 1));
    const sous = sousfamillesList.value.find(s => s.id === sousId);
    if (fam && sous) {
      const famName = fam.nom || fam.name || fam.famille || '';
      const sousName = sous.nom || sous.name || sous.sousFamille || '';
      res.push(`${famName}: ${sousName}`);
    }
  }
  // Ordina l'elenco alfabeticamente per rendere la stampa più logica
  return res.sort((a, b) => (a || '').localeCompare(b || ''));
});

// Fonction pour déclencher la génération du PDF
const generatePdf = () => {
  /*
    Lancement de la génération du PDF. Auparavant, on affichait un message
    d’erreur si `devisParZone` était vide pour éviter de produire un PDF
    sans contenu. Cependant, cela empêchait la génération dans les cas où
    les données tardaient à charger ou lorsqu’on souhaitait simplement
    tester le layout avec des tableaux vides. On délègue donc toute la
    logique à `DevisPdf.generatePdf()` : si aucune zone n’est présente,
    la page de détail sera simplement omise.
  */
  if (pdfRef.value && typeof pdfRef.value.generatePdf === 'function') {
    pdfRef.value.generatePdf();
  } else {
    alert('PDF non prêt : les données sont encore en cours de chargement.');
  }
};

// Charge les modalités et conditions à l'ouverture
onMounted(async () => {
  // Chargement devis existant
  const devisRef = doc(db, 'devis', devisId);
  const devisSnap = await getDoc(devisRef);
  if (devisSnap.exists()) {
    const data = devisSnap.data() as any;
    // Sauvegarde des données complètes du devis pour la génération du PDF
    devisData.value = data;
    // Remise supplémentaire enregistrée dans le devis (champ discount)
    if (data.discount !== undefined) {
      remiseSupplementaire.value = Number(data.discount) || 0;
    }
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

  // Charge l'ensemble des familles et sous‑familles afin de pouvoir afficher
  // les informations "Type de pose" dans le PDF. Ces collections ne sont
  // nécessaires que pour la génération PDF, pas pour l'édition du devis.
  try {
    const famSnap = await getDocs(collection(db, 'familles'));
    famillesList.value = famSnap.docs.map(docu => ({ id: docu.id, ...(docu.data() as any) }));
  } catch (e) {
    console.warn('Impossible de charger les familles', e);
  }
  try {
    const sousSnap = await getDocs(collection(db, 'sousfamilles'));
    sousfamillesList.value = sousSnap.docs.map(docu => ({ id: docu.id, ...(docu.data() as any) }));
  } catch (e) {
    console.warn('Impossible de charger les sous‑familles', e);
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