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
            <option v-for="client in clients" :key="client.id" :value="client.firebase_id || client.id">
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
      <h5>Modalità Prezzi <small class="text-muted">(Attuale: {{ modalitaPrezzi }})</small></h5>
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
          <strong>Remise Standard</strong> - Applique des remises famille/sous-famille
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
          <strong>Prix Fixes</strong> - Saisie manuelle des prix pour chaque produit
        </label>
      </div>
    </div>

    <!-- Remise par famille (solo se modalità scontistica) -->
    <div class="card p-4 mb-4" v-if="modalitaPrezzi === 'scontistica'">
      <h5>Remise par famille</h5>
      <table class="table">
        <thead>
          <tr>
            <th>Famille</th>
            <th>Sous-famille</th>
            <th>Remise (%)</th>
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
                  v-for="sous in sousfamilles.filter(s => s.famille_id === fam.firebase_id)"
                  :key="sous.id"
                  :value="sous.id"
                >
                  {{ sous.nom }}
                </option>
              </select>
            </td>
            <td>{{ getRemisePourcentage(fam.id) }} %</td>
            <td class="text-center">
              <input type="checkbox" class="form-check-input" :checked="!!remiseSelection[fam.id]" disabled />
            </td>
          </tr>
        </tbody>
      </table>

      <div class="text-end">
        <strong>Remise totale: {{ remiseTotale }}%</strong>
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

    <!-- Continuer -->
      <div class="text-end">
        <!-- Indicatore stato validazione -->
        <div class="mb-3 text-start">
          <small class="text-muted">
            <span v-if="modalitaPrezzi === 'scontistica'">
              ✅ Informazioni cantiere: {{ form.nom && form.adresse && form.client && form.technicien && zones.length > 0 ? 'Completate' : 'Incomplete' }}<br>
              ✅ Remise famiglie: {{ Object.keys(remiseSelection).length === familles.length ? 'Completate' : 'Incomplete' }} ({{ Object.keys(remiseSelection).length }}/{{ familles.length }})
            </span>
            <span v-else>
              ✅ Informazioni cantiere: {{ form.nom && form.adresse && form.client && form.technicien && zones.length > 0 ? 'Completate' : 'Incomplete' }}<br>
              ℹ️ Modalità prezzi fissi: Nessuna remise richiesta
            </span>
          </small>
        </div>
        
        <button
          class="btn btn-success"
          :disabled="!formReady"
          @click="continuerVersDevis"
        >
          Continuer vers le devis
        </button>
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
  technicien: ''
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

const filteredTechniciens = computed(() =>
  techniciens.value.filter(t => t.client_id === form.value.client)
);

const getRemisePourcentage = (familleId) => {
  const id = remiseSelection.value[familleId];
  const sous = sousfamilles.value.find(s => s.id === id);
  return sous ? Number(sous.pourcentage) || 0 : 0;
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
  
  if (modalitaPrezzi.value === 'scontistica') {
    const remiseReady = Object.keys(remiseSelection.value).length === familles.value.length;
    return baseReady && remiseReady;
  } else {
    return baseReady; // Per prezzi fissi non serve la scontistica
  }
});

const continuerVersDevis = async () => {
  try {
    // Se stiamo modificando un devis esistente, aggiorniamolo e navighiamo alla pagina prodotti
    if (editingId.value) {
      const id = editingId.value;
      const { error } = await supabase
        .from('devis')
        .update({
          nom: form.value.nom,
          adresse: form.value.adresse,
          client_id: form.value.client,
          technicien: form.value.technicien,
          zones: zones.value,
          modalita_prezzi: modalitaPrezzi.value,
          remises: modalitaPrezzi.value === 'scontistica' ? remiseSelection.value : {},
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      // Pulizia localStorage (solo i dati del form)
      try {
        localStorage.removeItem('devisForm');
        localStorage.removeItem('devisRemises');
        localStorage.removeItem('zonesCantiere');
        localStorage.removeItem('devisItems'); // ✅ AGGIUNTO: pulizia dei prodotti
        localStorage.removeItem('devisDiscount'); // ✅ AGGIUNTO: pulizia della remise supplémentaire
      } catch (e) {
        console.warn('Erreur lors du nettoyage du localStorage après la modification du devis', e);
      }
      router.push(`/devis/produits/${id}`);
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
      remises: modalitaPrezzi.value === 'scontistica' ? remiseSelection.value : {},
      created_at: new Date().toISOString(),
      produits: [],
      total: 0,
      draft: true,
      status: 'En cours'
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
      localStorage.removeItem('devisItems'); // ✅ AGGIUNTO: pulizia dei prodotti
      localStorage.removeItem('devisDiscount'); // ✅ AGGIUNTO: pulizia della remise supplémentaire
    } catch (e) {
      console.warn('Erreur lors du nettoyage du localStorage après la création du devis', e);
    }
    router.push(`/devis/produits/${docRef.id}`);
  } catch (error) {
    console.error("Errore durante la creazione del devis:", error);
    alert("C'è stato un errore durante il salvataggio.");
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
