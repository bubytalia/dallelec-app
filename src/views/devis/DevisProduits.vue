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
<div class="alert mb-4" :class="getModalityAlertClass()">
  <div class="text-center">
    <strong>Modalità:</strong> 
    <span v-if="modalitaPrezzi === 'prezziFissi'">
      💰 <strong>Prix Fixes</strong> - Saisie manuelle des prix
    </span>
    <span v-else-if="modalitaPrezzi === 'railEnergie'">
      ⚡ <strong>Rail d'Énergie</strong> - Produits sans suppléments ni remises
    </span>
    <span v-else>
      📊 <strong>Remise Standard</strong> - Remise familles: {{ remiseFamilles.toFixed(1) }}%
    </span>
  </div>
</div>

<!-- Résumé Chemin de Câble -->
<div class="d-flex justify-content-center gap-3 mb-3" v-if="totalCDCSans > 0 || totalCDCAvec > 0">
  <div class="badge bg-secondary fs-6 p-2">CDC sans suppl.: <strong>{{ totalCDCSans.toFixed(2) }} m</strong></div>
  <div class="badge bg-dark fs-6 p-2">CDC avec suppl.: <strong>{{ totalCDCAvec.toFixed(2) }} m</strong></div>
</div>

<!-- Pulsanti di navigazione e salvataggio -->
<div class="mb-3 d-flex justify-content-center">
  <!-- Salvataggio definitivo -->
  <button class="btn btn-success me-2" @click="sauvegarderDevis(false)">📥 Sauvegarder le devis</button>
  <!-- Salvataggio come bozza -->
  <button class="btn btn-outline-primary me-2" @click="sauvegarderDevis(true)">💾 Sauver comme brouillon</button>
  <!-- Annulla modifiche correnti -->
  <button class="btn btn-warning me-2" @click="annullerModifications">↶ Annuler modifications</button>
  <!-- Ricalcolo prezzi con scontistiche attuali -->
  <button 
    v-if="modalitaPrezzi === 'scontistica'" 
    class="btn btn-outline-danger me-2" 
    style="border-width: 2px; font-weight: bold;" 
    @click="recalculerPrix"
    :disabled="recalculating"
  >
    {{ recalculating ? '⏳ Recalcul...' : '⚠️ Recalculer prix et remises (données actuelles)' }}
  </button>
  <!-- Abbandono del preventivo (solo per bozze) -->
  <button class="btn btn-danger me-2" @click="abandonnerDevis" v-if="isDraft">❌ Supprimer brouillon</button>
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
      :listinoVip="listinoVip"
      :vipTypePose="vipTypePose"
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
              <th>Suppléments</th>
              <th>Total</th>
              <th>Prix Unit.</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, itemIndex) in zone.produits" :key="itemIndex" :class="{ 'table-secondary': item.informativo }">
              <td>{{ item.article }} <span v-if="item.informativo" class="badge bg-info">Info</span></td>
              <td>{{ item.nom }}</td>
              <td>{{ item.taille }}</td>
              <td>{{ item.unite }}</td>
              <td>{{ item.ml }}</td>
              <td>{{ (item.totalML - item.ml).toFixed(2) }}</td>
              <td>{{ item.totalML.toFixed(2) }}</td>
              <td>{{ item.prix.toFixed(2) }} CHF</td>
              <td>{{ item.informativo ? 'Info' : item.total.toFixed(2) + ' CHF' }}</td>
              <td>
                <button class="btn btn-sm btn-warning me-2" @click="modifierItem(zone.nom, itemIndex)">✎</button>
                <button class="btn btn-sm btn-danger" @click="supprimerItem(zone.nom, itemIndex)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="text-end fw-bold">
          Sous-total: {{ getSubtotal(zone.produits).toFixed(2) }} CHF
        </div>
      </div>
      <div class="text-end fs-5 fw-bold mt-3">
        <!-- Campo per la remise supplementaire -->
        <div class="mb-2 d-flex justify-content-end align-items-center">
          <label class="me-2 mb-0">Remise supplémentaire (%)</label>
          <input type="number" class="form-control w-auto" v-model.number="remiseSupplementaire" min="0" max="100" style="width: 100px;" />
        </div>
        Total Devis: {{ devisTotal.toFixed(2) }} CHF
      </div>
    </div>

    <SupplementDetails v-if="modalitaPrezzi !== 'railEnergie'" :supplementParZone="supplementParZone" />
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
const isDraft = ref(true);
const originalDevisItems = ref([]);
const recalculating = ref(false);
const useListinoVip = ref(false);
const vipTypePose = ref('beton');
const listinoVip = ref([]);

/**
 * Salva il devis su Supabase.
 * Se asDraft è true, imposta draft: true (bozza); altrimenti draft: false.
 * Aggiorna anche updatedAt e total.
 */
const sauvegarderDevis = async (asDraft = false) => {
  try {
    console.log('🔍 DEBUG SALVATAGGIO:');
    console.log('  - Numero prodotti da salvare:', devisItems.value.length);
    console.log('  - Primi 3 prodotti:', devisItems.value.slice(0, 3).map(p => p.article));
    console.log('  - Total devis:', devisTotal.value);
    
    // ✅ Converti Proxy in oggetti normali per Supabase
    const produitsNormali = JSON.parse(JSON.stringify(devisItems.value));
    console.log('📦 Prodotti normalizzati:', produitsNormali.length);
    
    const updateData = {
      produits: produitsNormali,
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
    
    console.log('📤 Invio update a Supabase...');
    const { data: resultData, error } = await supabase
      .from('devis')
      .update(updateData)
      .eq('id', devisId)
      .select();
    
    console.log('✅ Risposta Supabase:', resultData);
    console.log('📦 Prodotti nella risposta:', resultData?.[0]?.produits?.length);
    console.log('❌ Errore Supabase:', error);
    
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
    // ✅ RIMOSSO REDIRECT: Resta nella pagina per continuare il lavoro
    // if (!asDraft) {
    //   router.push('/admin/devis');
    // }
  } catch (error) {
    console.error('❌ ERRORE SALVATAGGIO:', error);
    alert('Erreur Supabase: ' + error.message);
  }
};

/**
 * Ricalcola tutti i prezzi del devis usando le scontistiche attuali delle sous-familles.
 */
const recalculerPrix = async () => {
  const msg = '⚠️ ATTENTION: Cette opération va recalculer TOUS les prix du devis '
    + 'en utilisant:\n'
    + '- Les PRIX DE BASE actuels du catalogue produits\n'
    + '- Les REMISES actuelles des sous-familles\n\n'
    + 'Les prix existants seront écrasés.\n\n'
    + 'Voulez-vous continuer?';
  if (!confirm(msg)) return;

  recalculating.value = true;
  try {
    // 1. Rileggi le remises salvate nel devis
    const { data: devisData, error: dErr } = await supabase
      .from('devis')
      .select('remises')
      .eq('id', devisId)
      .single();
    if (dErr) throw dErr;
    const remisesObj = devisData?.remises || {};

    // 2. Rileggi le sous-familles attuali
    const { data: allSous, error: sErr } = await supabase
      .from('sousfamilles')
      .select('*');
    if (sErr) throw sErr;

    // 3. Calcola la nuova remise totale
    let newTotalPct = 0;
    Object.values(remisesObj).forEach(sousId => {
      const sous = allSous.find(s => s.id === sousId);
      if (sous) newTotalPct += Number(sous.pourcentage) || 0;
    });

    // 4. Rileggi il catalogo prodotti per avere i prezzi base aggiornati
    const { data: catalogueProduits, error: pErr } = await supabase
      .from('produits')
      .select('*');
    if (pErr) throw pErr;
    console.log('📦 Catalogo prodotti caricati:', catalogueProduits.length);

    // 5. Ricalcola ogni riga
    let updated = 0;
    let notFound = [];
    let prixChanges = [];
    devisItems.value = devisItems.value.map(item => {
      // Match robusto: trim + case insensitive
      const itemArt = (item.article || '').trim().toLowerCase();
      const catalogProd = catalogueProduits.find(p => 
        (p.article || '').trim().toLowerCase() === itemArt
      );
      if (!catalogProd) {
        console.warn('❌ Articolo non trovato nel catalogo:', item.article);
        notFound.push(item.article);
        return item;
      }
      console.log(`✅ Match: ${item.article} → prix catalogue: ${catalogProd.prix}, prix devis: ${item.prix}`);

      const oldPrix = item.prix;
      const basePrix = Number(catalogProd.prix) || 0;
      let newPrix;
      if (catalogProd.prezzo_netto) {
        newPrix = basePrix;
      } else {
        newPrix = basePrix * (1 - newTotalPct / 100);
      }

      // Per gli informativi: aggiorna il prix unitario ma il totale resta 0
      const newTotal = item.informativo ? 0 : item.totalML * newPrix;
      if (Math.abs(oldPrix - newPrix) > 0.001) {
        prixChanges.push(`${item.article}: ${oldPrix.toFixed(2)} → ${newPrix.toFixed(2)}`);
      }
      updated++;
      return { ...item, prix: newPrix, total: newTotal, prixOriginal: basePrix };
    });

    remiseFamilles.value = newTotalPct;

    let msg2 = `✅ Recalcul terminé!\n\n`
      + `Remise totale: ${newTotalPct.toFixed(1)}%\n`
      + `Produits mis à jour: ${updated}/${devisItems.value.length}\n`;
    if (prixChanges.length > 0) {
      msg2 += `\n📊 Prix modifiés (${prixChanges.length}):\n`
        + prixChanges.slice(0, 10).join('\n');
      if (prixChanges.length > 10) msg2 += `\n... et ${prixChanges.length - 10} autres`;
    } else {
      msg2 += `\nAucun changement de prix détecté.`;
    }
    if (notFound.length > 0) {
      msg2 += `\n\n⚠️ Articles non trouvés dans le catalogue: ${notFound.join(', ')}`;
    }
    msg2 += `\n\n⚠️ N'oubliez pas de SAUVEGARDER le devis.`;
    alert(msg2);
  } catch (error) {
    console.error('Erreur recalcul prix:', error);
    alert('Erreur: ' + error.message);
  } finally {
    recalculating.value = false;
  }
};

/**
 * Annulla le modifiche correnti e ricarica i dati originali dal database
 */
const annullerModifications = async () => {
  if (!confirm('Annuler toutes les modifications non sauvegardées?')) {
    return;
  }
  
  try {
    // Ricarica i dati originali dal database
    const { data: devisData, error } = await supabase
      .from('devis')
      .select('*')
      .eq('id', devisId)
      .single();
    
    if (error) throw error;
    
    if (devisData) {
      // Ripristina i prodotti originali
      if (Array.isArray(devisData.produits)) {
        devisItems.value = devisData.produits.map(item => ({ ...item }));
      } else {
        devisItems.value = [];
      }
      
      // Ripristina lo sconto originale
      remiseSupplementaire.value = Number(devisData.discount) || 0;
      
      // Pulisci il form di editing
      editingItem.value = null;
      
      alert('Modifications annulées. Données restaurées.');
    }
  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error);
    alert('Erreur: ' + error.message);
  }
};

/**
 * Elimina il devis solo se è una bozza
 */
const abandonnerDevis = async () => {
  if (!isDraft.value) {
    alert('Impossible de supprimer un devis sauvegardé définitivement.');
    return;
  }
  
  if (!confirm('Supprimer définitivement ce brouillon de devis?')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('devis')
      .delete()
      .eq('id', devisId);
    
    if (error) throw error;
    
    localStorage.removeItem('devisItems');
    alert('Brouillon supprimé.');
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
      isDraft.value = devisData.draft !== false;
      useListinoVip.value = devisData.use_listino_vip || false;
      vipTypePose.value = devisData.vip_type_pose || 'beton';

      // Charger listino VIP si nécessaire
      if (useListinoVip.value && devisData.client_id) {
        const { data: vipData } = await supabase.from('listino_vip').select('*').eq('client_id', devisData.client_id);
        listinoVip.value = vipData || [];
      }
    
      // ✅ CARICA SEMPRE DAL DATABASE (priorità assoluta)
      if (Array.isArray(devisData.produits) && devisData.produits.length > 0) {
        devisItems.value = devisData.produits.map(item => ({ ...item }));
        originalDevisItems.value = JSON.parse(JSON.stringify(devisItems.value));
        console.log('✅ Prodotti caricati dal DB:', devisItems.value.length);
      } else {
        devisItems.value = [];
        console.log('⚠️ Nessun prodotto nel DB');
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

  // 🚨 RIMOSSO: Non caricare mai dal localStorage per evitare mix di dati
  // I dati vengono caricati SOLO dal database per garantire integrità
  console.log('📊 Prodotti caricati dal DB:', devisItems.value.length);

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

  // 🚨 RIMOSSO: Non caricare discount dal localStorage
  // Il discount viene caricato SOLO dal database
  console.log('💰 Discount caricato dal DB:', remiseSupplementaire.value);

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
  console.log('🔧 Modifica item:', { zoneNom, itemIndex });
  
  const zoneItems = devisParZone.value.find(z => z.nom === zoneNom)?.produits || [];
  console.log('📋 Items nella zona:', zoneItems.length);
  
  const targetItem = zoneItems[itemIndex];
  console.log('🎯 Target item:', targetItem);
  
  if (!targetItem) {
    console.error('❌ Item non trovato nella zona');
    return;
  }
  
  const globalIndex = devisItems.value.findIndex(i => 
    i.zone === targetItem.zone && 
    i.article === targetItem.article && 
    i.nom === targetItem.nom
  );
  
  console.log('🔍 Global index trovato:', globalIndex);
  
  if (globalIndex !== -1) {
    const item = devisItems.value[globalIndex];
    editingItem.value = {
      index: globalIndex,
      zone: item.zone,
      article: item.article,
      code: item.article,
      nom: item.nom,
      taille: item.taille,
      unite: item.unite,
      ml: item.ml,
      prix: item.prix,
      informativo: item.informativo || false,
      supplements: JSON.parse(JSON.stringify(item.supplements || []))
    };
    console.log('✅ EditingItem impostato:', editingItem.value);
  } else {
    console.error('❌ Item non trovato in devisItems');
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
  
  // Ordina le zone secondo l'ordine originale definito nel devis
  const orderedZones = zones.value.filter(zoneName => grouped[zoneName]);
  
  // Aggiungi eventuali zone non presenti nell'array originale (per sicurezza)
  const extraZones = Object.keys(grouped).filter(zoneName => !zones.value.includes(zoneName));
  
  return [...orderedZones, ...extraZones].map(nom => ({
    nom,
    produits: grouped[nom].sort((a, b) => a.article.localeCompare(b.article))
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
  return Object.entries(grouped).map(([nom, details]) => ({ 
    nom, 
    details: details.sort((a, b) => a.code.localeCompare(b.code))
  }));
});

const getSubtotal = (items) => items.reduce((sum, i) => sum + (i.informativo ? 0 : i.total), 0);

// Calcola i metri lineari dei supplementi per un singolo prodotto
const getSupplementsML = (item) => {
  if (item.informativo || !item.supplements || !Array.isArray(item.supplements)) return 0;
  
  return item.supplements.reduce((sum, supplement) => {
    return sum + (supplement.totalML || supplement.total || 0);
  }, 0);
};
// Calcola il totale del devis applicando eventuale remise supplementaire.
const getModalityAlertClass = () => {
  switch(modalitaPrezzi.value) {
    case 'prezziFissi': return 'alert-warning';
    case 'railEnergie': return 'alert-primary';
    default: return 'alert-success';
  }
};

const devisTotal = computed(() => {
  const subtotal = devisItems.value.reduce((sum, i) => sum + (i.informativo ? 0 : i.total), 0);
  const discount = Number(remiseSupplementaire.value) || 0;
  const pct = Math.min(Math.max(discount, 0), 100);
  const totaleScontato = subtotal * (1 - pct / 100);
  return totaleScontato;
});

// Totali Chemin de Câble
const cdcItems = computed(() => devisItems.value.filter(i => (i.nom || '').toLowerCase().includes('chemin de c')));
const totalCDCSans = computed(() => cdcItems.value.reduce((sum, i) => sum + (Number(i.ml) || 0), 0));
const totalCDCAvec = computed(() => cdcItems.value.reduce((sum, i) => sum + (Number(i.totalML) || 0), 0));

</script>
