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

    <!-- Conditions générales -->
    <div class="card p-3 mb-4">
      <h5>Conditions générales</h5>
      <div v-if="conditionsGenerales.length === 0" class="fst-italic text-muted">Aucune condition générale</div>
      <div v-for="cond in conditionsGenerales" :key="cond.id" class="form-check">
        <input class="form-check-input" type="checkbox" :id="'generales-' + cond.id" v-model="selectedGeneralesIds" :value="cond.id" />
        <label class="form-check-label" :for="'generales-' + cond.id">{{ cond.nom || cond.description }}</label>
      </div>
    </div>

    <!-- Conditions comprises -->
    <div class="card p-3 mb-4">
      <h5>Le devis comprend</h5>
      <div v-if="conditionsComprend.length === 0" class="fst-italic text-muted">Aucune condition</div>
      <div v-for="cond in conditionsComprend" :key="cond.id" class="form-check">
        <input class="form-check-input" type="checkbox" :id="'comprend-' + cond.id" v-model="selectedComprendIds" :value="cond.id" />
        <label class="form-check-label" :for="'comprend-' + cond.id">{{ cond.nom || cond.description }}</label>
      </div>
    </div>

    <!-- Conditions exclues -->
    <div class="card p-3 mb-4">
      <h5>Le devis ne comprend pas</h5>
      <div v-if="conditionsExclues.length === 0" class="fst-italic text-muted">Aucune condition</div>
      <div v-for="cond in conditionsExclues" :key="cond.id" class="form-check">
        <input class="form-check-input" type="checkbox" :id="'exclu-' + cond.id" v-model="selectedExcluIds" :value="cond.id" />
        <label class="form-check-label" :for="'exclu-' + cond.id">{{ cond.nom || cond.description }}</label>
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
      :conditionsGenerales="selectedGeneralesDetails"
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
import { supabase } from '../../supabase.js';

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
const conditionsGenerales = ref([]);
const conditionsComprend = ref([]);
const conditionsExclues = ref([]);
const selectedGeneralesIds = ref([]);
const selectedComprendIds = ref([]);
const selectedExcluIds = ref([]);

// Famiglie e sottofamiglie per il PDF
const familles = ref([]);
const sousfamilles = ref([]);

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
  console.log('🔍 Debug devisParZone:');
  console.log('devisData.value:', devisData.value);
  console.log('devisData.value.produits:', devisData.value?.produits);
  
  if (!devisData.value || !Array.isArray(devisData.value.produits)) {
    console.log('Nessun prodotto trovato o non è array');
    return [];
  }
  
  const grouped = {};
  devisData.value.produits.forEach((item) => {
    const zone = item.zone || 'Zone inconnue';
    if (!grouped[zone]) grouped[zone] = [];
    grouped[zone].push(item);
  });
  
  const result = Object.entries(grouped).map(([nom, produits]) => ({ nom, produits }));
  console.log('devisParZone result:', result);
  return result;
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

const selectedGeneralesDetails = computed(() => {
  return conditionsGenerales.value.filter(c => selectedGeneralesIds.value.includes(c.id));
});

const selectedComprendDetails = computed(() => {
  return conditionsComprend.value.filter(c => selectedComprendIds.value.includes(c.id));
});

const selectedExcluDetails = computed(() => {
  return conditionsExclues.value.filter(c => selectedExcluIds.value.includes(c.id));
});

// Computed per le famiglie visibili nel PDF
const famillesVisibles = computed(() => {
  console.log('🔍 Debug famillesVisibles:');
  console.log('devisData.value?.remises:', devisData.value?.remises);
  console.log('familles.value:', familles.value.length);
  console.log('sousfamilles.value:', sousfamilles.value.length);
  
  const remises = devisData.value?.remises || {};
  if (Object.keys(remises).length === 0) {
    console.log('Nessuna remise trovata');
    return [];
  }
  
  // Ottieni le famiglie selezionate dal devis
  const selectedFamilies = Object.keys(devisData.value.remises || {});
  console.log('Famiglie selezionate:', selectedFamilies);
  
  const result = selectedFamilies.map(familleId => {
    const famille = familles.value.find(f => f.id == familleId);
    const sousId = devisData.value.remises[familleId];
    const sous = sousfamilles.value.find(s => s.id === sousId);
    
    console.log(`Famiglia ${familleId}:`, famille?.nom, 'visible_pdf:', famille?.visible_pdf, 'Sottofamiglia:', sous?.nom);
    
    // Filtra solo le famiglie con visible_pdf = true
    if (famille && famille.visible_pdf !== true) {
      console.log(`Famiglia ${famille.nom} esclusa dal PDF (visible_pdf = ${famille.visible_pdf})`);
      return null;
    }
    
    if (famille && sous) {
      const famDesc = famille.description || famille.nom;
      const sousDesc = sous.description || sous.nom;
      return `${famDesc}: ${sousDesc}`;
    }
    return famille?.description || famille?.nom || 'Famille inconnue';
  }).filter(Boolean);
  
  console.log('Risultato famillesVisibles:', result);
  return result;
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
  // PRIMA: Carica famiglie e sottofamiglie
  try {
    const [famillesRes, sousfamillesRes] = await Promise.all([
      supabase.from('familles').select('*'),
      supabase.from('sousfamilles').select('*')
    ]);
    
    if (famillesRes.error) throw famillesRes.error;
    if (sousfamillesRes.error) throw sousfamillesRes.error;
    
    familles.value = famillesRes.data || [];
    sousfamilles.value = sousfamillesRes.data || [];
  } catch (e) {
    console.warn('Impossible de charger les familles/sousfamilles', e);
  }

  // POI: Chargement devis esistente
  const { data: devisDataFromDB, error: devisError } = await supabase
    .from('devis')
    .select('*')
    .eq('id', devisId)
    .single();
  
  if (devisError) {
    console.error('Errore caricamento devis:', devisError);
  }
  
  if (devisDataFromDB) {
    const data = devisDataFromDB;

    // Sauvegarde des données complètes du devis pour la génération du PDF
    devisData.value = data;
    console.log('🔍 Dati devis caricati:', data);
    console.log('Prodotti nel devis:', data.produits?.length || 0);
    console.log('Remises nel devis:', data.remises);
    // Dati del devis per il PDF - CORREZIONE MAPPATURA
    nomChantier.value = data.nom || ''; // data.nom è il nome del cantiere
    const adresseChantier = data.adresse || ''; // data.adresse è l'indirizzo del cantiere
    
    // Recupera il nome del cliente dall'ID
    if (data.client_id) {
      try {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('nom')
          .eq('id', data.client_id)
          .single();
        
        if (clientError) throw clientError;
        nomClient.value = clientData?.nom || 'Client inconnu';
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
    if (Array.isArray(data.conditions_generales)) {
      selectedGeneralesIds.value = [...data.conditions_generales];
    }
    if (Array.isArray(data.conditions_comprend)) {
      selectedComprendIds.value = [...data.conditions_comprend];
    }
    if (Array.isArray(data.conditions_ne_comprend_pas)) {
      selectedExcluIds.value = [...data.conditions_ne_comprend_pas];
    }
    if (data.notes) notes.value = data.notes;
    if (data.paiement) selectedPaiement.value = data.paiement;
  }

  // Charge la liste des paiements
  try {
    const { data: paiementsData, error: paiementsError } = await supabase
      .from('paiements')
      .select('*');
    
    if (paiementsError) throw paiementsError;
    
    paiements.value = paiementsData || [];
    // Si aucun paiement sélectionné, prendi il primo come default
    if (!selectedPaiement.value && paiements.value.length > 0) {
      selectedPaiement.value = paiements.value[0].id;
    }
  } catch (e) {
    console.warn('Impossible de charger les modalités de paiement', e);
  }

  // Charge la liste des conditions
  try {
    const { data: conditionsData, error: conditionsError } = await supabase
      .from('conditions')
      .select('*');
    
    if (conditionsError) throw conditionsError;
    
    const allConds = conditionsData || [];
    conditionsGenerales.value = allConds.filter(c => c.type === 'generales');
    conditionsComprend.value = allConds.filter(c => c.type === 'comprend');
    conditionsExclues.value = allConds.filter(c => c.type === 'ne_comprend_pas');
    
    // Preselect default conditions (campo active) si aucune sélection
    if (selectedGeneralesIds.value.length === 0) {
      selectedGeneralesIds.value = conditionsGenerales.value.filter(c => c.active === true).map(c => c.id);
    }
    if (selectedComprendIds.value.length === 0) {
      selectedComprendIds.value = conditionsComprend.value.filter(c => c.active === true).map(c => c.id);
    }
    if (selectedExcluIds.value.length === 0) {
      selectedExcluIds.value = conditionsExclues.value.filter(c => c.active === true).map(c => c.id);
    }
  } catch (e) {
    console.warn('Impossible de charger les conditions', e);
  }

  // Familles e sottofamiglie già caricate sopra
});

/**
 * Sauvegarde les conditions et notes dans le devis.
 * Si asDraft est true, marque le devis comme brouillon; sinon, resta dans son état actuel.
 */
const sauvegarder = async (asDraft) => {
  console.log('Salvando devis con draft:', asDraft);
  try {
    const { error } = await supabase
      .from('devis')
      .update({
        draft: asDraft,
        updated_at: new Date().toISOString(),
      })
      .eq('id', devisId);
    
    if (error) throw error;
    
    alert(asDraft ? 'Brouillon sauvegardé.' : 'Devis sauvegardé avec succès.');
    if (!asDraft) {
      router.push('/admin/devis');
    }
  } catch (error) {
    console.error('Erreur Supabase:', error);
    alert('Erreur Supabase: ' + error.message);
  }
};

// Retour à la page des produits sans sauvegarder l'état en brouillon si on modifie un devis existant
const retourProduits = () => {
  router.push(`/devis/produits/${devisId}`);
};
</script>