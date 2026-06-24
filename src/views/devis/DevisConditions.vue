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

    <!-- Opzioni PDF -->
    <div class="card p-3 mb-4" v-if="devisData?.modalita_prezzi !== 'railEnergie'">
      <h5>Options PDF</h5>
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="hideSupplementsList" v-model="hideSupplementsList" />
        <label class="form-check-label" for="hideSupplementsList">
          Masquer la liste des suppléments dans le PDF
        </label>
        <div class="form-text">Cochez cette case si vous ne voulez pas afficher la page avec la liste des suppléments dans le PDF de ce devis.</div>
      </div>
      <div class="form-check mt-3">
        <input class="form-check-input" type="checkbox" id="hidePrices" v-model="hidePrices" />
        <label class="form-check-label" for="hidePrices">
          Masquer les prix dans le PDF
        </label>
        <div class="form-text">Cochez cette case pour générer un devis sans prix (utile pour les devis informatifs).</div>
      </div>
      <div class="form-check mt-3">
        <input class="form-check-input" type="checkbox" id="hideZones" v-model="hideZones" />
        <label class="form-check-label" for="hideZones">
          Regrouper tous les produits (sans séparation par zones)
        </label>
        <div class="form-text">Cochez cette case pour afficher tous les produits dans une seule liste, sans les titres de zone.</div>
      </div>
    </div>

    <!-- Boutons de navigation -->
    <div class="mb-3 d-flex justify-content-center">
      <button class="btn btn-outline-primary me-2" @click="sauvegarder(true)">💾 Sauver comme brouillon</button>
      <button class="btn btn-success me-2" @click="sauvegarder(false)">📥 Sauvegarder le devis</button>
      <button class="btn btn-outline-secondary" @click="router.push('/admin/devis')">← Retour liste</button>
    </div>

    <!-- Composant PDF pour devis détaillé -->
    <DevisPdf
      v-if="devisData?.modalita_prezzi !== 'aCorps'"
      ref="pdfRef"
      :devisParZone="devisParZonePdf"
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
      :hideSupplementsList="hideSupplementsList"
      :hidePrices="hidePrices"
      :remiseSupplementaire="devisData?.discount || 0"
      :modalitaPrezzi="devisData?.modalita_prezzi || 'scontistica'"
      style="display: none;"
    />
    
    <!-- Composant PDF pour devis à corps -->
    <DevisCorpsPdf
      v-if="devisData?.modalita_prezzi === 'aCorps'"
      ref="pdfCorpsRef"
      :nomClient="nomClient"
      :nomChantier="nomChantier"
      :numeroDevis="numeroDevis"
      :dateDevis="dateDevis"
      :descriptionCorps="devisData?.description_corps || ''"
      :montantCorps="devisData?.montant_corps || 0"
      :selectedPaiement="selectedPaiementObj"
      :conditionsGenerales="selectedGeneralesDetails"
      :conditionsComprend="selectedComprendDetails"
      :conditionsNeComprendPas="selectedExcluDetails"
      :notes="notes"
      style="display: none;"
    />
    <div class="text-end mt-3">
      <button class="btn btn-primary me-2" @click="generatePdf">Télécharger le PDF</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../../supabase.js';

// Composants PDF
import DevisPdf from '@/components/DevisPdf.vue';
import DevisCorpsPdf from '@/components/DevisCorpsPdf.vue';
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

// Opzione per nascondere lista supplementi nel PDF
const hideSupplementsList = ref(false);

// Opzione per nascondere i prezzi nel PDF
const hidePrices = ref(false);

// Opzione per raggruppare tutti i prodotti senza zone
const hideZones = ref(false);

// Références aux composants PDF
const pdfRef = ref(null);
const pdfCorpsRef = ref(null);

// Données du devis pour le PDF
const devisData = ref(null);
const nomClient = ref('');
const nomChantier = ref('');
const numeroDevis = ref('');
const dateDevis = ref('');
const nomPaiement = ref('Paiement selon modalité convenue');

// Computed properties pour le PDF
const devisParZone = computed(() => {
  if (!devisData.value || !Array.isArray(devisData.value.produits)) {
    return [];
  }
  
  const grouped = {};
  devisData.value.produits.forEach((item) => {
    const zone = item.zone || 'Zone inconnue';
    if (!grouped[zone]) grouped[zone] = [];
    grouped[zone].push(item);
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

// Computed pour le PDF: si hideZones, regroupe et somme les produits identiques
const devisParZonePdf = computed(() => {
  if (!hideZones.value) return devisParZone.value;
  
  // Raggruppamento per article + taille
  const merged = {};
  devisParZone.value.forEach(zone => {
    (zone.produits || []).forEach(p => {
      const key = `${p.article}||${p.taille}`;
      if (!merged[key]) {
        merged[key] = { ...p, ml: Number(p.ml) || 0, totalML: Number(p.totalML) || 0, total: p.informativo ? 0 : (Number(p.total) || 0) };
      } else {
        merged[key].ml += Number(p.ml) || 0;
        merged[key].totalML += Number(p.totalML) || 0;
        if (!p.informativo) merged[key].total += Number(p.total) || 0;
      }
    });
  });
  
  const produits = Object.values(merged).sort((a, b) => (a.article || '').localeCompare(b.article || ''));
  return [{ nom: 'Tous les produits', produits }];
});

// Computed property che trova il paiement corretto
const selectedPaiementObj = computed(() => {
  if (!selectedPaiement.value || paiements.value.length === 0) {
    return { nom: 'Paiement selon modalité convenue' };
  }
  
  // Confronto universale che funziona con stringhe e numeri
  const found = paiements.value.find(p => String(p.id) === String(selectedPaiement.value));
  
  return found || { nom: 'Paiement selon modalité convenue' };
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
  const remises = devisData.value?.remises || {};
  if (Object.keys(remises).length === 0) {
    return [];
  }
  
  // Ottieni le famiglie selezionate dal devis
  const selectedFamilies = Object.keys(devisData.value.remises || {});
  
  const result = selectedFamilies.map(familleId => {
    const famille = familles.value.find(f => f.id == familleId);
    const sousId = devisData.value.remises[familleId];
    const sous = sousfamilles.value.find(s => s.id === sousId);
    
    // Filtra solo le famiglie con visible_pdf = true
    if (famille && famille.visible_pdf !== true) {
      return null;
    }
    
    if (famille && sous) {
      const famDesc = famille.description || famille.nom;
      const sousDesc = sous.description || sous.nom;
      return `${famDesc}: ${sousDesc}`;
    }
    return famille?.description || famille?.nom || 'Famille inconnue';
  }).filter(Boolean);
  
  return result;
});

// Fonction pour générer le PDF
const generatePdf = () => {
  try {
    // Per devis à corps usa il componente specifico
    if (devisData.value?.modalita_prezzi === 'aCorps') {
      if (pdfCorpsRef.value && typeof pdfCorpsRef.value.generatePdf === 'function') {
        pdfCorpsRef.value.generatePdf();
      } else {
        alert('PDF devis à corps non prêt.');
      }
    } else {
      // Per devis dettagliati usa il componente normale
      if (pdfRef.value && typeof pdfRef.value.generatePdf === 'function') {
        pdfRef.value.generatePdf();
      } else {
        alert('PDF devis détaillé non prêt.');
      }
    }
  } catch (error) {
    console.error('Errore in generatePdf():', error);
    alert('Errore nella generazione PDF: ' + error.message);
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

  // PRIMA: Carica paiements, conditions e devis in parallelo
  try {
    const [devisRes, paiementsRes, conditionsRes] = await Promise.all([
      supabase.from('devis').select('*').eq('id', devisId).single(),
      supabase.from('paiements').select('*'),
      supabase.from('conditions').select('*')
    ]);
    
    // Carica paiements PRIMA di impostare selectedPaiement
    if (paiementsRes.error) throw paiementsRes.error;
    paiements.value = paiementsRes.data || [];
    
    // Carica conditions
    if (conditionsRes.error) throw conditionsRes.error;
    const allConds = conditionsRes.data || [];
    conditionsGenerales.value = allConds.filter(c => c.type === 'generales');
    conditionsComprend.value = allConds.filter(c => c.type === 'comprend');
    conditionsExclues.value = allConds.filter(c => c.type === 'ne_comprend_pas');
    
    // POI: Processa devis data
    if (devisRes.error) {
      console.error('Errore caricamento devis:', devisRes.error);
    }
    
    if (devisRes.data) {
      const data = devisRes.data;
      devisData.value = data;
      
      // Dati del devis per il PDF
      nomChantier.value = data.nom || '';
      const adresseChantier = data.adresse || '';
      
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
      
      // Recupera il nome del paiement dall'ID (stesso pattern del cliente)
      if (data.paiement) {
        try {
          const { data: paiementData, error: paiementError } = await supabase
            .from('paiements')
            .select('nom')
            .eq('id', data.paiement)
            .single();
          
          if (paiementError) throw paiementError;
          nomPaiement.value = paiementData?.nom || 'Paiement selon modalité convenue';
        } catch (e) {
          console.warn('Errore nel caricamento del paiement:', e);
          nomPaiement.value = 'Paiement selon modalité convenue';
        }
      }
      
      // Combina nome cantiere e indirizzo per il PDF
      if (adresseChantier) {
        nomChantier.value = nomChantier.value + ' - ' + adresseChantier;
      }
      numeroDevis.value = data.numero || '';
      dateDevis.value = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('fr-CH') : new Date().toLocaleDateString('fr-CH');
      
      // Conditions sélectionnées préexistantes
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
      
      // Carica opzione nascondere supplementi
      if (data.hide_supplements_list !== undefined) {
        hideSupplementsList.value = data.hide_supplements_list;
      }
      
      // Carica opzione nascondere prezzi
      if (data.hide_prices !== undefined) {
        hidePrices.value = data.hide_prices;
      }
      
      // Carica opzione raggruppare zone
      if (data.hide_zones !== undefined) {
        hideZones.value = data.hide_zones;
      }
      
      // Imposta selectedPaiement DOPO aver caricato paiements
      if (data.paiement) {
        selectedPaiement.value = data.paiement;
      } else if (paiements.value.length > 0) {
        selectedPaiement.value = paiements.value[0].id;
      }
    }
    
    // Preselect default conditions se nessuna selezione
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
    console.error('Errore caricamento dati:', e);
  }

  // Conditions già caricate sopra in parallelo

  // Familles e sottofamiglie già caricate sopra
});

/**
 * Sauvegarde les conditions et notes dans le devis.
 * Si asDraft est true, marque le devis comme brouillon; sinon, resta dans son état actuel.
 */
const sauvegarder = async (asDraft) => {
  try {
    const { error } = await supabase
      .from('devis')
      .update({
        draft: asDraft,
        status: asDraft ? 'En cours' : 'Accepté',
        paiement: selectedPaiement.value,
        conditions_generales: selectedGeneralesIds.value,
        conditions_comprend: selectedComprendIds.value,
        conditions_ne_comprend_pas: selectedExcluIds.value,
        notes: notes.value,
        hide_supplements_list: hideSupplementsList.value,
        hide_prices: hidePrices.value,
        hide_zones: hideZones.value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', devisId);
    
    if (error) {
      console.error('Errore salvataggio:', error);
      throw error;
    }
    

    
    // 🔄 RICARICA DATI dopo salvataggio per aggiornare selectedPaiementObj
    await ricaricaDatiDevis();
    
    alert(asDraft ? 'Brouillon sauvegardé.' : 'Devis sauvegardé avec succès.');
    // ✅ RIMOSSO REDIRECT: Resta nella pagina per generare PDF
  } catch (error) {
    console.error('Erreur Supabase:', error);
    alert('Erreur Supabase: ' + error.message);
  }
};

// Funzione per ricaricare i dati del devis dopo il salvataggio
const ricaricaDatiDevis = async () => {
  try {
    const { data: devisDataFromDB, error } = await supabase
      .from('devis')
      .select('*')
      .eq('id', devisId)
      .single();
    
    if (error) throw error;
    
    if (devisDataFromDB) {
      // Aggiorna solo i dati necessari per il PDF
      devisData.value = devisDataFromDB;
      if (devisDataFromDB.paiement) {
        selectedPaiement.value = devisDataFromDB.paiement;
      }
    }
  } catch (error) {
    console.error('Errore ricaricamento dati:', error);
  }
};





// Retour à la page des produits sans sauvegarder l'état en brouillon si on modifie un devis existant
const retourProduits = () => {
  // Per devis à corps, torna alla lista. Per altri, vai ai prodotti
  if (devisData.value?.modalita_prezzi === 'aCorps') {
    router.push('/admin/devis');
  } else {
    router.push(`/devis/produits/${devisId}`);
  }
};
</script>