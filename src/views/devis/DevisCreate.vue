<template>
  <div class="container py-4">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton :onClick="retourListe" />

    <h2 class="text-center mb-4">
      {{ editingId ? 'Modifier le Devis' : 'Nouveau Devis' }}
      <small v-if="isDuplicateMode" class="d-block text-success mt-2">
        🔄 Devis supplémentaire pour le même chantier
      </small>
    </h2>

    <!-- Informations du chantier -->
    <div class="card p-4 mb-4">
      <h5>Informations du chantier</h5>

      <div class="row mb-3">
        <div class="col">
          <input v-model="form.nom" class="form-control" placeholder="Nom du chantier" />
        </div>
        <div class="col">
          <input v-model="form.adresse" class="form-control" placeholder="Adresse du chantier" />
        </div>
      </div>

      <div class="row mb-3">
        <div class="col">
          <select v-model="form.client" class="form-select">
            <option disabled value="">Sélectionner un client</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.nom }}
            </option>
          </select>
        </div>
        <div class="col">
          <select v-model="form.technicien" class="form-select">
            <option disabled value="">Technicien du client</option>
            <option v-for="tech in filteredTechniciens" :key="tech.id" :value="tech.nom">
              {{ tech.nom }}
            </option>
          </select>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label>Type de pose</label>
          <select v-model="form.type_pose" class="form-select">
            <option value="">Sélectionner le type de pose</option>
            <option value="chemin_de_cable">Chemin de câble</option>
            <option value="rail_energie">Rail d'énergie</option>
            <option value="canaux_au_sol">Canaux au sol</option>
            <option value="divers">Divers</option>
          </select>
        </div>
      </div>

      <div>
        <label>Zones de chantier</label>
        <div class="input-group mb-2">
          <input
            v-model="newZone"
            @keyup.enter="addZone"
            class="form-control"
            placeholder="Ajouter une zone"
          />
          <button 
            class="btn btn-primary btn-lg" 
            type="button" 
            @click="addZone"
            :disabled="!newZone.trim()"
            style="min-width: 120px; font-size: 18px;"
          >
            ➕ Ajouter
          </button>
        </div>
        <div>
          <span v-for="(zone, index) in zones" :key="index" class="badge bg-primary me-2 d-inline-flex align-items-center">
            <template v-if="editingZoneIndex === index">
              <input
                v-model="editingZoneName"
                @keyup.enter="confirmEditZone(index)"
                @keyup.escape="cancelEditZone"
                @blur="confirmEditZone(index)"
                class="zone-edit-input"
              />
            </template>
            <template v-else>
              <span class="cursor-pointer" @dblclick="startEditZone(index)" title="Double-clic pour renommer">{{ zone }}</span>
              <span class="ms-1 cursor-pointer" @click="removeZone(index)">&times;</span>
            </template>
          </span>
        </div>
      </div>
    </div>

    <!-- Modalità Prezzi -->
    <div class="card p-4 mb-4">
      <h5>Type de Devis <small class="text-muted">(Actuel: {{ getTypeDevisLabel() }})</small></h5>
      <div class="form-check mb-3">
        <input 
          class="form-check-input" 
          type="radio" 
          name="modalitaPrezzi" 
          id="scontistica" 
          :checked="modalitaPrezzi === 'scontistica'"
          @change="modalitaPrezzi = 'scontistica'"
        >
        <label class="form-check-label" for="scontistica">
          <strong>Devis Détaillé - Remise Standard</strong><br>
          <small class="text-muted">Applique des remises famille/sous-famille sur produits</small>
        </label>
      </div>
      <div class="form-check mb-3">
        <input 
          class="form-check-input" 
          type="radio" 
          name="modalitaPrezzi" 
          id="prezziFissi" 
          :checked="modalitaPrezzi === 'prezziFissi'"
          @change="modalitaPrezzi = 'prezziFissi'"
        >
        <label class="form-check-label" for="prezziFissi">
          <strong>Devis Détaillé - Prix Fixes</strong><br>
          <small class="text-muted">Saisie manuelle des prix pour chaque produit</small>
        </label>
      </div>
      <div class="form-check mb-3">
        <input 
          class="form-check-input" 
          type="radio" 
          name="modalitaPrezzi" 
          id="aCorps" 
          :checked="modalitaPrezzi === 'aCorps'"
          @change="modalitaPrezzi = 'aCorps'"
        >
        <label class="form-check-label" for="aCorps">
          <strong>Devis à Corps</strong><br>
          <small class="text-muted">Montant forfaitaire avec description libre</small>
        </label>
      </div>
      <div class="form-check mb-3">
        <input 
          class="form-check-input" 
          type="radio" 
          name="modalitaPrezzi" 
          id="railEnergie" 
          :checked="modalitaPrezzi === 'railEnergie'"
          @change="modalitaPrezzi = 'railEnergie'"
        >
        <label class="form-check-label" for="railEnergie">
          <strong>Devis Rail d'Énergie et Canaux au Sol</strong><br>
          <small class="text-muted">Produits sans suppléments ni remises famille</small>
        </label>
      </div>
    </div>

    <!-- Devis à Corps -->
    <div class="card p-4 mb-4" v-if="modalitaPrezzi === 'aCorps'">
      <h5>Devis à Corps - Description et Montant</h5>
      <div class="mb-3">
        <label class="form-label"><strong>Description des travaux:</strong></label>
        <textarea 
          v-model="form.description_corps" 
          class="form-control" 
          rows="4" 
          placeholder="Ex: Travaux électriques selon plans fournis&#10;- Installation complète selon plan joint&#10;- Fourniture et pose matériel&#10;- Mise en service et tests"
        ></textarea>
      </div>
      <div class="row">
        <div class="col-md-6">
          <label class="form-label"><strong>Montant forfaitaire HT:</strong></label>
          <div class="input-group">
            <input 
              v-model.number="form.montant_corps" 
              type="number" 
              step="0.01" 
              class="form-control" 
              placeholder="5500.00"
            >
            <span class="input-group-text">CHF</span>
          </div>
        </div>

      </div>
    </div>

    <!-- Remise par famille / Type de pose -->
    <div class="card p-4 mb-4" v-if="modalitaPrezzi !== 'aCorps' && modalitaPrezzi !== 'railEnergie'">
      <h5 v-if="modalitaPrezzi === 'scontistica'">Remise par famille</h5>
      <h5 v-else>Type de pose <small class="text-muted">(informatif pour le PDF)</small></h5>
      <table class="table">
        <thead>
          <tr>
            <th>Famille</th>
            <th>Sous-famille</th>
            <th v-if="modalitaPrezzi === 'scontistica'">Remise (%)</th>
            <th v-else>Information</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fam in familles" :key="fam.id">
            <td>{{ fam.nom }}</td>
            <td>
              <select v-model="remiseSelection[fam.id]" class="form-select">
                <option disabled value="">Sélectionnez une sous-famille</option>
                <option
                  v-for="sous in getSousFamillesOrdered(fam.id)"
                  :key="sous.id"
                  :value="sous.id"
                >
                  {{ sous.nom }}
                </option>
              </select>
            </td>
            <td v-if="modalitaPrezzi === 'scontistica'">{{ getRemisePourcentage(fam.id) }} %</td>
            <td v-else>{{ getSousfamilleNom(fam.id) }}</td>
            <td class="text-center">
              <input type="checkbox" class="form-check-input" :checked="!!remiseSelection[fam.id]" disabled />
            </td>
          </tr>
        </tbody>
      </table>

      <div class="text-end" v-if="modalitaPrezzi === 'scontistica'">
        <strong>Remise totale: {{ remiseTotale }}%</strong>
      </div>
      <div class="text-end" v-else>
        <strong>Informations sélectionnées pour le PDF</strong>
      </div>
    </div>

    <!-- Informazione per prezzi fissi -->
    <div class="card p-4 mb-4" v-if="modalitaPrezzi === 'prezziFissi'">
      <div class="alert alert-info">
        <h6>💡 Information Prix Fixes</h6>
        <p class="mb-0">
          En mode <strong>Prix Fixes</strong>, vous pourrez saisir manuellement le prix de chaque produit 
          lors de l'ajout au devis. Aucune remise famille n'est appliquée automatiquement.
        </p>
      </div>
    </div>

    <!-- Informazione per devis à corps -->
    <div class="card p-4 mb-4" v-if="modalitaPrezzi === 'aCorps'">
      <div class="alert alert-success">
        <h6>📝 Information Devis à Corps</h6>
        <p class="mb-0">
          Le <strong>Devis à Corps</strong> génère un PDF simplifié avec description libre et montant forfaitaire. 
          Idéal pour les petits travaux avec plans détaillés.
        </p>
      </div>
    </div>

    <!-- Informazione per rail d'énergie -->
    <div class="card p-4 mb-4" v-if="modalitaPrezzi === 'railEnergie'">
      <div class="alert alert-primary">
        <h6>⚡ Information Rail d'Énergie et Canaux au Sol</h6>
        <p class="mb-0">
          Mode simplifié pour <strong>Rail d'Énergie et Canaux au Sol</strong>. 
          Aucun supplément ni remise famille appliqués. Seulement produits + quantités + prix.
        </p>
      </div>
    </div>

    <!-- Continuer -->
      <div class="text-end">
        <!-- Indicatore stato validazione -->
        <div class="mb-3 text-start">
          <small class="text-muted">
            ✅ Informazioni cantiere: {{ form.nom && form.adresse && form.client && form.technicien && zones.length > 0 ? 'Completate' : 'Incomplete' }}<br>
            <span v-if="modalitaPrezzi === 'scontistica'">
              ✅ Remise famiglie: {{ Object.keys(remiseSelection).length === familles.length ? 'Completate' : 'Incomplete' }} ({{ Object.keys(remiseSelection).length }}/{{ familles.length }})
            </span>
            <span v-else>
              ✅ Type de pose (PDF): {{ Object.keys(remiseSelection).length === familles.length ? 'Completate' : 'Incomplete' }} ({{ Object.keys(remiseSelection).length }}/{{ familles.length }})
            </span>
          </small>
        </div>
        
        <button
          v-if="!editingId || modalitaPrezzi !== 'aCorps'"
          class="btn btn-success"
          :disabled="!formReady"
          @click="continuerVersDevis"
        >
          Continuer vers le devis
        </button>
        
        <!-- Pulsanti specifici per modifica devis à corps -->
        <div v-if="editingId && modalitaPrezzi === 'aCorps'" class="d-flex gap-2">
          <button
            class="btn btn-outline-primary"
            :disabled="!formReady"
            @click="sauvegarderModifiche"
          >
            💾 Sauvegarder les modifications
          </button>
          <button
            class="btn btn-success"
            :disabled="!formReady"
            @click="continuerVersDevis"
          >
            Aller aux conditions/PDF
          </button>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '../../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

const router = useRouter();
const route = useRoute();

// Se la rotta contiene un parametro id (edit), siamo in modalità modifica
const editingId = computed(() => {
  return route.params.id || null;
});

// Formulaire pour i dati del cantiere. Le informazioni vengono
// salvate anche in localStorage per preservare lo stato quando si
// ritorna dalla pagina dei prodotti o in caso di refresh del browser.
const form = ref({
  nom: '',
  adresse: '',
  client: '',
  technicien: '',
  type_pose: '',
  description_corps: '',
  montant_corps: 0
});

const newZone = ref('');
const zones = ref([]);
const clients = ref([]);
const techniciens = ref([]);
const familles = ref([]);
const sousfamilles = ref([]);
const remiseSelection = ref({});
const modalitaPrezzi = ref('scontistica'); // Ripristinato valore corretto
const isDuplicateMode = ref(false);

const editingZoneIndex = ref(null);
const editingZoneName = ref('');

const addZone = () => {
  if (newZone.value.trim()) {
    zones.value.push(newZone.value.trim());
    newZone.value = '';
  }
};

const removeZone = (index) => {
  zones.value.splice(index, 1);
};

const startEditZone = (index) => {
  editingZoneIndex.value = index;
  editingZoneName.value = zones.value[index];
  nextTick(() => {
    const input = document.querySelector('.zone-edit-input');
    if (input) input.focus();
  });
};

const confirmEditZone = (index) => {
  if (editingZoneName.value.trim()) {
    zones.value[index] = editingZoneName.value.trim();
  }
  editingZoneIndex.value = null;
  editingZoneName.value = '';
};

const cancelEditZone = () => {
  editingZoneIndex.value = null;
  editingZoneName.value = '';
};

const filteredTechniciens = computed(() => {
  if (!form.value.client) return [];
  
  return techniciens.value.filter(t => {
    return t.client_id == form.value.client;
  });
});

const getRemisePourcentage = (familleId) => {
  const id = remiseSelection.value[familleId];
  const sous = sousfamilles.value.find(s => s.id === id);
  return sous ? Number(sous.pourcentage) || 0 : 0;
};

const getSousfamilleNom = (familleId) => {
  const id = remiseSelection.value[familleId];
  const sous = sousfamilles.value.find(s => s.id === id);
  return sous ? sous.nom : '-';
};

const getSousFamillesOrdered = (familleId) => {
  return sousfamilles.value
    .filter(s => s.famille_id == familleId)
    .sort((a, b) => {
      // Ordina per campo ordre delle sottofamiglie
      const ordreA = Number(a.ordre) || 0;
      const ordreB = Number(b.ordre) || 0;
      if (ordreA !== ordreB) return ordreA - ordreB;
      
      // Se stesso ordre, ordina alfabeticamente
      return (a.nom || '').localeCompare(b.nom || '');
    });
};

const remiseTotale = computed(() => {
  return Object.values(remiseSelection.value)
    .map(id => {
      const sous = sousfamilles.value.find(s => s.id === id);
      return sous ? Number(sous.pourcentage) || 0 : 0;
    })
    .reduce((acc, val) => acc + val, 0);
});

const formReady = computed(() => {
  const baseReady = (
    form.value.nom &&
    form.value.adresse &&
    form.value.client &&
    form.value.technicien &&
    zones.value.length > 0
  );
  
  // Per devis à corps, controlla descrizione e montant
  if (modalitaPrezzi.value === 'aCorps') {
    return baseReady && form.value.description_corps.trim() && form.value.montant_corps > 0;
  }
  
  // Per rail d'énergie, non serve selezione famiglie
  if (modalitaPrezzi.value === 'railEnergie') {
    return baseReady;
  }
  
  // Per altri tipi, richiesta la selezione famiglie
  const remiseReady = Object.keys(remiseSelection.value).length === familles.value.length;
  return baseReady && remiseReady;
});

const getTypeDevisLabel = () => {
  switch(modalitaPrezzi.value) {
    case 'scontistica': return 'Détaillé - Remise';
    case 'prezziFissi': return 'Détaillé - Prix Fixes';
    case 'aCorps': return 'À Corps';
    case 'railEnergie': return 'Rail d\'Énergie';
    default: return modalitaPrezzi.value;
  }
};

const continuerVersDevis = async () => {
  try {
    // Se stiamo modificando un devis esistente, aggiorniamolo
    if (editingId.value) {
      const id = editingId.value;
      const updateData = {
        nom: form.value.nom,
        adresse: form.value.adresse,
        client_id: form.value.client,
        technicien: form.value.technicien,
        type_pose: form.value.type_pose || null,
        zones: zones.value,
        modalita_prezzi: modalitaPrezzi.value,
        remises: (modalitaPrezzi.value === 'aCorps' || modalitaPrezzi.value === 'railEnergie') ? {} : remiseSelection.value,
        description_corps: form.value.description_corps || null,
        montant_corps: form.value.montant_corps || null,
        updated_at: new Date().toISOString()
      };
      
      // Per devis à corps, imposta anche il totale e finalizza
      if (modalitaPrezzi.value === 'aCorps') {
        updateData.total = form.value.montant_corps; // HT
        updateData.draft = false;
        updateData.status = 'Terminé';
      } else {
        // Per altri tipi, assicura che non sia brouillon
        updateData.draft = false;
        updateData.status = 'En cours';
      }
      
      const { error } = await supabase
        .from('devis')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Pulizia localStorage
      try {
        localStorage.removeItem('devisForm');
        localStorage.removeItem('devisRemises');
        localStorage.removeItem('zonesCantiere');
        localStorage.removeItem('devisItems');
        localStorage.removeItem('devisDiscount');
      } catch (e) {
        console.warn('Erreur lors du nettoyage du localStorage après la modification du devis', e);
      }
      
      // Per devis à corps, vai alle condizioni. Per altri, vai ai prodotti
      if (modalitaPrezzi.value === 'aCorps') {
        router.push(`/admin/devis/conditions/${id}`);
      } else {
        router.push(`/devis/produits/${id}`);
      }
      return;
    }

    // Altrimenti si tratta di un nuovo devis: generiamo numero progressivo
    // Per ora usiamo un numero semplice basato sul timestamp
    const numeroDevis = `DEV-${Date.now().toString().slice(-6)}`;

    // Carica dati extra se è una duplicazione
    let extraData = {};
    try {
      const duplicateExtra = localStorage.getItem('duplicateDevisExtra');
      if (duplicateExtra) {
        extraData = JSON.parse(duplicateExtra);
        // Pulisci localStorage dopo l'uso
        localStorage.removeItem('duplicateDevisData');
        localStorage.removeItem('duplicateDevisExtra');
      }
    } catch (e) {
      console.warn('Errore caricamento dati extra:', e);
    }
    
    const newDevis = {
      numero: numeroDevis,
      nom: form.value.nom,
      adresse: form.value.adresse,
      client_id: form.value.client,
      technicien: form.value.technicien,
      type_pose: form.value.type_pose || null,
      zones: zones.value,
      modalita_prezzi: modalitaPrezzi.value,
      remises: (modalitaPrezzi.value === 'aCorps' || modalitaPrezzi.value === 'railEnergie') ? {} : remiseSelection.value,
      description_corps: form.value.description_corps || null,
      montant_corps: form.value.montant_corps || null,
      created_at: new Date().toISOString(),
      // Dati dalla duplicazione o default
      produits: extraData.produits || [],
      total: extraData.produits ? extraData.produits.reduce((sum, p) => sum + (p.total || 0), 0) : (modalitaPrezzi.value === 'aCorps' ? form.value.montant_corps : 0),
      discount: extraData.discount || 0,
      conditions_generales: extraData.conditions_generales || [],
      conditions_comprend: extraData.conditions_comprend || [],
      conditions_ne_comprend_pas: extraData.conditions_ne_comprend_pas || [],
      notes: extraData.notes || '',
      hide_supplements_list: extraData.hide_supplements_list || false,
      hide_prices: extraData.hide_prices || false,
      paiement: extraData.paiement || null,
      draft: false,
      status: modalitaPrezzi.value === 'aCorps' ? 'Terminé' : 'En cours'
    };
    
    const { data: docRef, error } = await supabase
      .from('devis')
      .insert(newDevis)
      .select()
      .single();
    
    if (error) throw error;
    
    // Se è un devis supplementare, gestisci il raggruppamento
    const urlParams = new URLSearchParams(window.location.search);
    const isDuplicate = urlParams.get('duplicate') === 'true';
    const baseDevisId = urlParams.get('baseDevisId');
    
    if (isDuplicate && docRef && baseDevisId) {
      // Trova il devis base per ottenere il gruppo
      const { data: baseDevis } = await supabase
        .from('devis')
        .select('gruppo_devis_id')
        .eq('id', baseDevisId)
        .single();
      
      let gruppoId = baseDevis?.gruppo_devis_id;
      
      // Se il devis base non ha gruppo, crealo
      if (!gruppoId) {
        gruppoId = `GRUPPO_${Date.now()}`;
        
        // Assegna gruppo al devis base
        await supabase
          .from('devis')
          .update({ gruppo_devis_id: gruppoId })
          .eq('id', baseDevisId);
        
        console.log(`📝 Creato gruppo ${gruppoId} per devis base ${baseDevisId}`);
      }
      
      // Assegna stesso gruppo al nuovo devis
      await supabase
        .from('devis')
        .update({ gruppo_devis_id: gruppoId })
        .eq('id', docRef.id);
      
      // Trova il cantiere che ha il devis base
      let cantiere = null;
      
      // Prima prova: cerca cantiere che ha il devis base nel gruppo
      const { data: cantiereConGruppo } = await supabase
        .from('chantieri')
        .select('*')
        .eq('gruppo_devis_id', gruppoId)
        .single();
      
      if (cantiereConGruppo) {
        cantiere = cantiereConGruppo;
        console.log(`🏗️ Trovato cantiere tramite gruppo: ${cantiere.nom}`);
      } else {
        // Seconda prova: cerca cantiere che ha il devis base come devis_id
        const { data: cantiereConDevis } = await supabase
          .from('chantieri')
          .select('*')
          .eq('devis_id', baseDevisId)
          .single();
        
        if (cantiereConDevis) {
          cantiere = cantiereConDevis;
          console.log(`🏗️ Trovato cantiere tramite devis_id: ${cantiere.nom}`);
        } else {
          // Terza prova: cerca per nome/indirizzo
          const { data: cantiereConNome } = await supabase
            .from('chantieri')
            .select('*')
            .eq('nom', newDevis.nom)
            .eq('adresse', newDevis.adresse)
            .single();
          
          cantiere = cantiereConNome;
          if (cantiere) {
            console.log(`🏗️ Trovato cantiere tramite nome/indirizzo: ${cantiere.nom}`);
          }
        }
      }
      
      if (cantiere) {
        await supabase
          .from('chantieri')
          .update({ gruppo_devis_id: gruppoId })
          .eq('id', cantiere.id);
        
        console.log(`✅ Cantiere ${cantiere.id} aggiornato con gruppo ${gruppoId}`);
      }
    }
    // Pulizia localStorage
    try {
      localStorage.removeItem('devisForm');
      localStorage.removeItem('devisRemises');
      localStorage.removeItem('zonesCantiere');
      localStorage.removeItem('devisItems');
      localStorage.removeItem('devisDiscount');
    } catch (e) {
      console.warn('Erreur lors du nettoyage du localStorage après la création du devis', e);
    }
    
    // Per devis à corps, vai alle condizioni. Per altri, vai ai prodotti
    if (modalitaPrezzi.value === 'aCorps') {
      router.push(`/admin/devis/conditions/${docRef.id}`);
    } else {
      router.push(`/devis/produits/${docRef.id}`);
    }
  } catch (error) {
    console.error("Errore durante la creazione del devis:", error);
    alert("C'è stato un errore durante il salvataggio.");
  }
};

// Salva solo le modifiche per devis à corps senza navigare
const sauvegarderModifiche = async () => {
  if (!editingId.value || modalitaPrezzi.value !== 'aCorps') return;
  
  try {
    const updateData = {
      nom: form.value.nom,
      adresse: form.value.adresse,
      client_id: form.value.client,
      technicien: form.value.technicien,
      zones: zones.value,
      description_corps: form.value.description_corps || null,
      montant_corps: form.value.montant_corps || null,
      total: form.value.montant_corps || 0,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('devis')
      .update(updateData)
      .eq('id', editingId.value);
    
    if (error) throw error;
    
    alert('Modifications sauvegardées avec succès!');
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    alert('Erreur lors de la sauvegarde: ' + error.message);
  }
};

// Torna alla lista dei devis senza creare o modificare il documento.
const retourListe = () => {
  // Semplicemente reindirizza alla pagina dei devis
  router.push('/admin/devis');
};


onMounted(async () => {
  try {
    const [clientsRes, techRes, famRes, sousRes] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('techniciens').select('*'),
      supabase.from('familles').select('*'),
      supabase.from('sousfamilles').select('*')
    ]);

    clients.value = clientsRes.data || [];
    techniciens.value = techRes.data || [];
    familles.value = famRes.data || [];
    sousfamilles.value = sousRes.data || [];
    
    // ✅ NUOVO: Gestione duplicazione devis
    const urlParams = new URLSearchParams(window.location.search);
    const isDuplicate = urlParams.get('duplicate') === 'true';
    const baseDevisId = urlParams.get('baseDevisId');
    const isDuplicateDevis = urlParams.get('duplicate_devis') === 'true';
    const sourceDevisId = urlParams.get('source_devis_id');
    
    if (isDuplicate && baseDevisId) {
      console.log('🔄 Modalità duplicazione devis da:', baseDevisId);
      isDuplicateMode.value = true;
      await loadBaseDevisData(baseDevisId);
      return; // Esce qui per evitare caricamento localStorage
    }
    
    // ✅ NUOVO: Gestione duplicazione devis completa
    if (isDuplicateDevis && sourceDevisId) {
      console.log('📋 Modalità duplicazione devis completa da:', sourceDevisId);
      await loadDuplicateDevisData(urlParams);
      return; // Esce qui per evitare caricamento localStorage
    }

  // Carica dati dal localStorage solo se NON siamo in modalità modifica
  if (!editingId.value) {
    try {
      const savedForm = localStorage.getItem('devisForm');
      if (savedForm) {
        const parsed = JSON.parse(savedForm);
        form.value = { ...form.value, ...parsed };
      }
    } catch (e) {
      console.warn('Impossible caricare devisForm da localStorage', e);
    }
    try {
      const savedZones = localStorage.getItem('zonesCantiere');
      if (savedZones) {
        zones.value = JSON.parse(savedZones);
      }
    } catch (e) {
      console.warn('Impossible caricare zonesCantiere da localStorage', e);
    }
    try {
      const savedRemises = localStorage.getItem('devisRemises');
      if (savedRemises) {
        remiseSelection.value = JSON.parse(savedRemises);
      }
    } catch (e) {
      console.warn('Impossible caricare devisRemises da localStorage', e);
    }
  }

    // Se siamo in modalità modifica, carichiamo il devis esistente e popoliamo i campi
    if (editingId.value) {
      try {
        const { data: devisData, error } = await supabase
          .from('devis')
          .select('*')
          .eq('id', editingId.value)
          .single();
        
        if (error) throw error;
        
        if (devisData) {
          // Popola i campi del form
          form.value.nom = devisData.nom || '';
          form.value.adresse = devisData.adresse || '';
          form.value.client = devisData.client_id || '';
          form.value.technicien = devisData.technicien || '';
          form.value.type_pose = devisData.type_pose || '';
          form.value.description_corps = devisData.description_corps || '';
          form.value.montant_corps = devisData.montant_corps || 0;
          zones.value = Array.isArray(devisData.zones) ? [...devisData.zones] : [];
          modalitaPrezzi.value = devisData.modalita_prezzi || 'scontistica';
          remiseSelection.value = devisData.remises || {};
          // Salva anche nei localStorage per mantenere i dati se l'utente naviga via router (retour)
          try {
            localStorage.setItem('devisForm', JSON.stringify({
              nom: form.value.nom,
              adresse: form.value.adresse,
              client: form.value.client,
              technicien: form.value.technicien
            }));
            localStorage.setItem('zonesCantiere', JSON.stringify(zones.value));
            localStorage.setItem('devisRemises', JSON.stringify(remiseSelection.value));
          } catch (err) {
            console.warn("Erreur lors de l'enregistrement des données du devis en édition dans le localStorage", err);
          }
        }
      } catch (err) {
        console.warn('Erreur lors du chargement du devis en édition:', err);
      }
    }
  } catch (error) {
    console.error('Errore caricamento dati:', error);
  }
});

// ✅ NUOVO: Funzione per caricare dati dalla duplicazione devis
const loadDuplicateDevisData = async (urlParams) => {
  try {
    // Carica dati base dai parametri URL
    form.value.nom = urlParams.get('nom') || '';
    form.value.adresse = urlParams.get('adresse') || '';
    form.value.technicien = urlParams.get('technicien') || '';
    modalitaPrezzi.value = urlParams.get('modalita_prezzi') || 'scontistica';
    
    // Carica dati completi dal localStorage
    try {
      const duplicateData = localStorage.getItem('duplicateDevisData');
      if (duplicateData) {
        const data = JSON.parse(duplicateData);
        
        zones.value = data.zones || [];
        remiseSelection.value = data.remises || {};
        form.value.description_corps = data.description_corps || '';
        form.value.montant_corps = data.montant_corps || 0;
        
        // Salva anche gli altri dati per il salvataggio successivo
        localStorage.setItem('duplicateDevisExtra', JSON.stringify({
          produits: data.produits || [],
          discount: data.discount || 0,
          conditions_generales: data.conditions_generales || [],
          conditions_comprend: data.conditions_comprend || [],
          conditions_ne_comprend_pas: data.conditions_ne_comprend_pas || [],
          notes: data.notes || '',
          hide_supplements_list: data.hide_supplements_list || false,
          hide_prices: data.hide_prices || false,
          paiement: data.paiement || null
        }));
        
        console.log('✅ Dati duplicazione caricati:', {
          zones: zones.value.length,
          remises: Object.keys(remiseSelection.value).length,
          modalita: modalitaPrezzi.value
        });
      }
    } catch (e) {
      console.warn('Errore caricamento dati duplicazione:', e);
    }
    
  } catch (error) {
    console.error('Errore loadDuplicateDevisData:', error);
  }
};

// ✅ NUOVO: Funzione per caricare dati dal devis base
const loadBaseDevisData = async (baseDevisId) => {
  try {
    const { data: baseDevis, error } = await supabase
      .from('devis')
      .select('*')
      .eq('id', baseDevisId)
      .single();
    
    if (error || !baseDevis) {
      console.error('Errore caricamento devis base:', error);
      alert('Erreur lors du chargement du devis de base');
      return;
    }
    
    console.log('✅ Devis base caricato:', baseDevis);
    
    // Carica tutte le zone esistenti dal gruppo devis
    let zoneEsistenti = new Set();
    
    if (baseDevis.gruppo_devis_id) {
      // Nuova logica: carica zone da tutto il gruppo
      const { data: allDevisGruppo } = await supabase
        .from('devis')
        .select('zones, produits')
        .eq('gruppo_devis_id', baseDevis.gruppo_devis_id);
      
      // Combina zone da tutti i devis del gruppo
      allDevisGruppo?.forEach(d => {
        // Zone dal campo zones
        if (d.zones && Array.isArray(d.zones)) {
          d.zones.forEach(z => zoneEsistenti.add(z));
        }
        // Zone dai prodotti
        if (d.produits && Array.isArray(d.produits)) {
          d.produits.forEach(p => {
            if (p.zone) zoneEsistenti.add(p.zone);
          });
        }
      });
    } else {
      // Fallback: usa solo le zone del devis base
      if (baseDevis.zones && Array.isArray(baseDevis.zones)) {
        baseDevis.zones.forEach(z => zoneEsistenti.add(z));
      }
      if (baseDevis.produits && Array.isArray(baseDevis.produits)) {
        baseDevis.produits.forEach(p => {
          if (p.zone) zoneEsistenti.add(p.zone);
        });
      }
    }
    
    // Popola il form con i dati del devis base
    form.value.nom = baseDevis.nom || '';
    form.value.adresse = baseDevis.adresse || '';
    form.value.client = baseDevis.client_id || '';
    form.value.technicien = baseDevis.technicien || '';
    
    // Carica le zone esistenti
    zones.value = Array.from(zoneEsistenti).sort();
    
    // Mantieni la stessa modalità prezzi
    modalitaPrezzi.value = baseDevis.modalita_prezzi || 'scontistica';
    
    // Carica le remise se esistenti
    if (baseDevis.remises) {
      remiseSelection.value = { ...baseDevis.remises };
    }
    
    // ✅ FIX: Salva prodotti e dati extra per il nuovo devis
    try {
      localStorage.setItem('duplicateDevisExtra', JSON.stringify({
        produits: baseDevis.produits || [],
        discount: baseDevis.discount || 0,
        conditions_generales: baseDevis.conditions_generales || [],
        conditions_comprend: baseDevis.conditions_comprend || [],
        conditions_ne_comprend_pas: baseDevis.conditions_ne_comprend_pas || [],
        notes: baseDevis.notes || '',
        hide_supplements_list: baseDevis.hide_supplements_list || false,
        hide_prices: baseDevis.hide_prices || false,
        paiement: baseDevis.paiement || null
      }));
    } catch (e) {
      console.warn('Errore salvataggio dati extra duplicazione:', e);
    }
    
    console.log('✅ Form precompilato con:', {
      cantiere: form.value.nom,
      client: form.value.client,
      zoneEsistenti: zones.value.length,
      modalita: modalitaPrezzi.value,
      gruppoDevis: baseDevis.gruppo_devis_id || 'nessuno'
    });
    
  } catch (error) {
    console.error('Errore loadBaseDevisData:', error);
    alert('Erreur lors du chargement des données de base');
  }
};


// Salva automaticamente le zone cantiere ogni volta che cambiano
watch(zones, (newZones) => {
  const validZones = (newZones ?? []).filter(z => z && z.trim && z.trim() !== '');
  try {
    localStorage.setItem('zonesCantiere', JSON.stringify(validZones));
  } catch (e) {
    console.warn('Impossible salvare zonesCantiere su localStorage', e);
  }
}, { deep: true });

// Watcher per salvare automaticamente l'intero form nel localStorage.
watch(form, (newForm) => {
  // Evita di serializzare funzioni o riferimenti reattivi
  localStorage.setItem('devisForm', JSON.stringify({
    nom: newForm.nom,
    adresse: newForm.adresse,
    client: newForm.client,
    technicien: newForm.technicien
  }));
}, { deep: true });

// Watcher per salvare automaticamente la selezione delle remise nel localStorage
watch(remiseSelection, (newRemises) => {
  try {
    localStorage.setItem('devisRemises', JSON.stringify(newRemises));
  } catch (e) {
    console.warn('Impossible salvare devisRemises su localStorage', e);
  }
}, { deep: true });
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.zone-edit-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid white;
  color: white;
  outline: none;
  width: 120px;
  font-size: 0.85em;
}
</style>
