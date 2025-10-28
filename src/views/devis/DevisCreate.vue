<template>
  <div class="container py-4">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton :onClick="retourListe" />

    <h2 class="text-center mb-4">
      {{ editingId ? 'Modifier le Devis' : 'Nouveau Devis' }}
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

      <div>
        <label>Zones de chantier</label>
        <input
          v-model="newZone"
          @keyup.enter="addZone"
          class="form-control mb-2"
          placeholder="Ajouter une zone et appuyez sur Entrée"
        />
        <div>
          <span v-for="(zone, index) in zones" :key="index" class="badge bg-primary me-2">
            {{ zone }} <span class="ms-1 cursor-pointer" @click="removeZone(index)">&times;</span>
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
import { ref, computed, onMounted, watch } from 'vue';
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

const addZone = () => {
  if (newZone.value.trim()) {
    zones.value.push(newZone.value.trim());
    newZone.value = '';
  }
};

const removeZone = (index) => {
  zones.value.splice(index, 1);
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

    const newDevis = {
      numero: numeroDevis,
      nom: form.value.nom,
      adresse: form.value.adresse,
      client_id: form.value.client,
      technicien: form.value.technicien,
      zones: zones.value,
      modalita_prezzi: modalitaPrezzi.value,
      remises: (modalitaPrezzi.value === 'aCorps' || modalitaPrezzi.value === 'railEnergie') ? {} : remiseSelection.value,
      description_corps: form.value.description_corps || null,
      montant_corps: form.value.montant_corps || null,
      created_at: new Date().toISOString(),
      produits: [],
      total: modalitaPrezzi.value === 'aCorps' ? form.value.montant_corps : 0,
      draft: modalitaPrezzi.value === 'aCorps' ? false : true,
      status: modalitaPrezzi.value === 'aCorps' ? 'Terminé' : 'En cours'
    };
    
    const { data: docRef, error } = await supabase
      .from('devis')
      .insert(newDevis)
      .select()
      .single();
    
    if (error) throw error;
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
</style>
