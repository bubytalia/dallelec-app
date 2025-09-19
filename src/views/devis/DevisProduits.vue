<template>
  <div class="container py-4">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton :onClick="retourPage" />

    <h2 class="text-center mb-4">Produits du Devis</h2>

<!-- ✅ Numéro Devis visibile -->
<div class="alert alert-info text-center mb-4" v-if="numeroDevis || nomClient || nomChantier">
  <div v-if="numeroDevis"><strong>Numéro Devis:</strong> {{ numeroDevis }}</div>
  <div v-if="nomClient"><strong>Client:</strong> {{ nomClient }}</div>
  <div v-if="nomChantier"><strong>Chantier:</strong> {{ nomChantier }}</div>
</div>

<!-- Indicazione modalità prezzi -->
<div class="alert mb-4" :class="modalitaPrezzi === 'prezziFissi' ? 'alert-warning' : 'alert-success'">
  <div class="text-center">
    <strong>Modalità:</strong> 
    <span v-if="modalitaPrezzi === 'prezziFissi'">
      💰 <strong>Prix Fixes</strong> - Saisie manuelle des prix
    </span>
    <span v-else>
      📊 <strong>Remise Standard</strong> - Remise familles: {{ remiseFamilles.toFixed(1) }}%
    </span>
  </div>
</div>

<!-- Pulsanti di navigazione e salvataggio -->
<div class="mb-3 d-flex justify-content-center">
  <!-- Salvataggio definitivo -->
  <button class="btn btn-success me-2" @click="sauvegarderDevis(false)">📥 Sauvegarder le devis</button>
  <!-- Salvataggio come bozza -->
  <button class="btn btn-outline-primary me-2" @click="sauvegarderDevis(true)">💾 Sauver comme brouillon</button>
  <!-- Abbandono del preventivo -->
  <button class="btn btn-danger me-2" @click="abandonnerDevis">❌ Abandonner</button>
  <!-- Passa alla pagina delle condizioni (terza pagina) -->
  <button class="btn btn-info" @click="gotoConditions">→ Conditions</button>
</div>


   
    <!-- Controllo integrità dati -->
    <DataIntegrityCheck :devisItems="devisItems" />
    

    <ProduitForm
      :editingItem="editingItem"
      :devisId="devisId"
      :zones="zones"
      :discountFamille="remiseFamilles"
      :modalitaPrezzi="modalitaPrezzi"
      :produits="produits"
      :supplements="supplements"
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
              <th>Quantité</th>
              <th>Total Suppl.</th>
              <th>Total</th>
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
        <!-- Campo per la remise supplementaire -->
        <div class="mb-2 d-flex justify-content-end align-items-center">
          <label class="me-2 mb-0">Remise supplémentaire (%)</label>
          <input type="number" class="form-control w-auto" v-model.number="remiseSupplementaire" min="0" max="100" style="width: 100px;" />
        </div>
        Total Devis: {{ devisTotal.toFixed(2) }}€
      </div>
    </div>

    <SupplementDetails :supplementParZone="supplementParZone" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { supabase } from '../../supabase.js';
import ProduitForm from '@/components/ProduitForm.vue';
import SupplementDetails from '@/components/SupplementDetails.vue';
import DataIntegrityCheck from '@/components/DataIntegrityCheck.vue';
import { useRoute } from 'vue-router';
import RetourButton from '@/components/RetourButton.vue';

const route = useRoute();
const devisId = route.params.id;
const router = useRouter();
// Verifica se stiamo modificando un devis esistente (presenza di un id)
const isEditingExisting = computed(() => !!devisId);
const produits = ref([]);
const supplements = ref([]);
const devisItems = ref([]);
const editingItem = ref(null);
const numeroDevis = ref('');
const nomClient = ref('');
const nomChantier = ref('');

// Remise supplémentaire (%), da applicare sull'importo totale del devis.
const remiseSupplementaire = ref(0);

// Somma degli sconti derivanti da famiglie/sottofamiglie selezionate nella pagina 1
// Somma degli sconti derivanti dalle famiglie/sottofamiglie selezionate nella pagina 1.
// Questa percentuale verrà applicata a ciascun prodotto inserito nel devis.
const remiseFamilles = ref(0);

// Modalità prezzi del devis
const modalitaPrezzi = ref('scontistica');

/**
 * Salva il devis su Supabase.
 * Se asDraft è true, imposta draft: true (bozza); altrimenti draft: false.
 * Aggiorna anche updatedAt e total.
 */
const sauvegarderDevis = async (asDraft = false) => {
  try {
    const updateData = {
      produits: devisItems.value,
      total: devisTotal.value,
      discount: Number(remiseSupplementaire.value) || 0,
      draft: asDraft,
      updated_at: new Date().toISOString()
    };
    
    // Se non è una bozza, congela i dati per l'integrità storica
    if (!asDraft) {
      updateData.data_congelati = {
        produits: devisItems.value.map(item => ({
          ...item,
          congelatoIl: new Date().toISOString()
        })),
        remiseFamilles: remiseFamilles.value,
        modalitaPrezzi: modalitaPrezzi.value,
        congelatoIl: new Date().toISOString()
      };
    }
    
    const { error } = await supabase
      .from('devis')
      .update(updateData)
      .eq('id', devisId);
    
    if (error) throw error;
    
    localStorage.removeItem('devisItems');
    // quando viene salvato definitivamente eliminiamo anche i dati del form e delle remises
    if (!asDraft) {
      try {
        localStorage.removeItem('devisForm');
        localStorage.removeItem('devisRemises');
        localStorage.removeItem('zonesCantiere');
        localStorage.removeItem('devisDiscount');
      } catch (e) {
        console.warn('Errore nella pulizia del localStorage dopo il salvataggio', e);
      }
    }
    alert(asDraft ? 'Brouillon sauvegardé.' : 'Devis sauvegardé avec succès.');
    // Se non è più una bozza, torniamo alla pagina principale dei devis
    // che include il pulsante "Nouveau Devis".  Usiamo /admin/devis invece
    // di /admin/devis/list per evitare di trovarci in una pagina senza il pulsante.
    if (!asDraft) {
      router.push('/admin/devis');
    }
  } catch (error) {
    console.error('❌ ERRORE SALVATAGGIO:', error);
    alert('Erreur Supabase: ' + error.message);
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
    const { error } = await supabase
      .from('devis')
      .delete()
      .eq('id', devisId);
    
    if (error) throw error;
    
    localStorage.removeItem('devisItems');
    alert('Bozza eliminata.');
    router.push('/admin/devis/list');
  } catch (error) {
    console.error('Erreur Supabase:', error);
    alert('Erreur Supabase: ' + error.message);
  }
};

// Naviga alla terza pagina per impostare le condizioni del devis
const gotoConditions = async () => {
  // Salva i prodotti prima di navigare
  try {
    await sauvegarderDevis(true); // Salva come bozza
    router.push(`/admin/devis/conditions/${devisId}`);
  } catch (error) {
    console.error('Errore nel salvataggio prima di andare alle condizioni:', error);
    // Naviga comunque, ma avvisa l'utente
    if (confirm('Errore nel salvataggio. Continuare comunque?')) {
      router.push(`/admin/devis/conditions/${devisId}`);
    }
  }
};

// Naviga esplicitamente alla pagina di modifica del devis per tornare alla prima pagina.
const retourPage = async () => {
  // Se stiamo modificando un devis esistente, torniamo alla prima pagina senza salvare come bozza
  if (isEditingExisting.value) {
    router.push(`/admin/devis/edit/${devisId}`);
    return;
  }
  // Se siamo in fase di creazione (nessun id), salviamo come bozza per non perdere dati
  try {
    await sauvegarderDevis(true);
  } catch (e) {
    console.warn('Erreur lors du sauvegarde en brouillon avant de retourner', e);
  }
  // Per i nuovi devis torniamo alla pagina principale
  router.push('/admin/devis');
};

// ✅ AGGIUNTA QUI
const zones = ref([]);

// Salvataggio automatico come bozza quando si lascia la pagina (navigazione interna).
onBeforeRouteLeave(async (to, from, next) => {
  // Se stiamo creando un nuovo devis (nessun id), effettuiamo il salvataggio come bozza.
  // Se stiamo modificando un devis esistente, non cambiamo il suo stato di bozza.
  if (!isEditingExisting.value) {
    try {
      await sauvegarderDevis(true);
    } catch (e) {
      console.warn('Errore nel salvataggio automatico della bozza', e);
    }
  }
  next();
});

// Carica numero devis
onMounted(async () => {
  try {
    const { data: devisData, error } = await supabase
      .from('devis')
      .select('*')
      .eq('id', devisId)
      .single();
    
    if (error) throw error;

    if (devisData) {
      numeroDevis.value = devisData.numero || '';
      nomClient.value = devisData.nom || '';
      nomChantier.value = devisData.adresse || '';
      zones.value = devisData.zones || [];
      modalitaPrezzi.value = devisData.modalita_prezzi || 'scontistica';
    

    

      // Carica gli items del devis (prodotti) dal documento se esistenti
      if (Array.isArray(devisData.produits) && devisData.produits.length > 0) {
        devisItems.value = devisData.produits.map(item => ({ ...item }));
      }
      // Se esiste uno sconto salvato nel documento, caricalo come valore di default
      if (devisData.discount !== undefined) {
        remiseSupplementaire.value = Number(devisData.discount) || 0;
      }

      // Calcola la remise totale derivante dalle famiglie/sottofamiglie selezionate
      try {
        const remisesObj = devisData.remises || {};
        // Otteniamo tutti i documenti delle sousfamilles per poter leggerne il pourcentage
        const { data: allSous, error: sousError } = await supabase
          .from('sousfamilles')
          .select('*');
        
        if (sousError) throw sousError;
        
        let totalPct = 0;
        Object.values(remisesObj).forEach((sousId) => {
          const sous = allSous.find(s => s.id === sousId);
          if (sous && typeof sous.pourcentage !== 'undefined') {
            totalPct += Number(sous.pourcentage) || 0;
          }
        });
        remiseFamilles.value = totalPct;
      } catch (e) {
        console.warn('Errore nel calcolo della remise familière', e);
      }
    }
  } catch (error) {
    console.error('Errore caricamento devis:', error);
  }

  // Dopo aver caricato eventuali dati dal documento, cerchiamo un backup locale degli items.
  // CORREZIONE: Priorità ai dati del database, localStorage solo se non ci sono prodotti salvati
  if (devisItems.value.length === 0) {
    try {
      const savedItems = localStorage.getItem('devisItems');
      if (savedItems) {
        const parsed = JSON.parse(savedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          devisItems.value = parsed;
        }
      }
    } catch (e) {
      console.warn('Impossible caricare devisItems da localStorage', e);
    }
  }

  // Carica prodotti da Supabase
  console.log('🔍 Debug caricamento prodotti...');
  try {
    const { data: produitsData, error: produitsError } = await supabase
      .from('produits')
      .select('*');
    
    console.log('Prodotti dal DB:', produitsData?.length || 0);
    console.log('Errore prodotti:', produitsError);
    
    if (produitsError) throw produitsError;
    
    produits.value = (produitsData || []).map(p => ({
      ...p,
      article: p.article || '',
      description: p.description || p.nom || ''
    }));
    
    console.log('Prodotti caricati:', produits.value.length);
    console.log('Primi 3 prodotti:', produits.value.slice(0, 3));
  } catch (error) {
    console.error('Errore caricamento prodotti:', error);
  }

  // Carica supplementi da Supabase
  try {
    const { data: supplementsData, error: supplementsError } = await supabase
      .from('supplements')
      .select('*')
      .order('ordre');
    
    if (supplementsError) throw supplementsError;
    
    supplements.value = supplementsData || [];
    console.log('Supplementi caricati:', supplements.value.length);
  } catch (error) {
    console.error('Errore caricamento supplementi:', error);
  }

  // Carica eventuale remiseSupplementaire dal localStorage
  try {
    const savedDiscount = localStorage.getItem('devisDiscount');
    if (savedDiscount) {
      remiseSupplementaire.value = Number(JSON.parse(savedDiscount)) || 0;
    }
  } catch (e) {
    console.warn('Impossible caricare devisDiscount da localStorage', e);
  }

});

// Backup automatico locale
watch(devisItems, (newVal) => {
  localStorage.setItem('devisItems', JSON.stringify(newVal));
}, { deep: true });

// Salvataggio della remiseSupplementaire nel localStorage per mantenere lo stato tra refresh/navigazioni
watch(remiseSupplementaire, (val) => {
  try {
    localStorage.setItem('devisDiscount', JSON.stringify(val));
  } catch (e) {
    console.warn('Impossible salvare devisDiscount su localStorage', e);
  }
});

// Aggiunta/modifica riga
const handleUpdateItem = (index, item) => {
  // Se l'articolo non è già presente (nuovo item), proviamo a recuperarlo dalla lista prodotti
if (!item.article) {
  const refProd = produits.value.find(
    p => p.description === item.nom && p.taille === item.taille
  );
  item.article = refProd?.article || item.article;
}

// Verifica che l'articolo sia unico nella zona (controllo aggiuntivo)
if (item.article) {
  const duplicateCheck = devisItems.value.find(i =>
    i.zone === item.zone && i.article === item.article && i !== devisItems.value[index]
  );
  if (duplicateCheck) {
    alert("Ce produit (code: " + item.article + ") existe déjà dans cette zone.");
    return;
  }
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
  return Object.entries(grouped).map(([nom, produits]) => ({ 
    nom, 
    produits: produits.sort((a, b) => a.article.localeCompare(b.article)) 
  }));
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
// Calcola il totale del devis applicando eventuale remise supplementaire.
const devisTotal = computed(() => {
  const subtotal = devisItems.value.reduce((sum, i) => sum + i.total, 0);
  const discount = Number(remiseSupplementaire.value) || 0;
  // Assicuriamoci che lo sconto sia compreso tra 0 e 100
  const pct = Math.min(Math.max(discount, 0), 100);
  const totaleScontato = subtotal * (1 - pct / 100);
  return totaleScontato;
});

</script>
