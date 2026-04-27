<template>
  <div class="container py-4">
    <RetourButton to="/admin" />

    <h2 class="text-center mb-4">Métrages du Chantier (Admin)</h2>

    <!-- Info cantiere e devis -->
    <div class="alert alert-info text-center mb-4" v-if="numeroDevis || nomClient || nomChantier">
      <div v-if="numeroDevis"><strong>Numéro Devis:</strong> {{ numeroDevis }}</div>
      <div v-if="nomClient"><strong>Client:</strong> {{ nomClient }}</div>
      <div v-if="nomChantier"><strong>Chantier:</strong> {{ nomChantier }}</div>
    </div>

    <!-- Selezione cantiere -->
    <div class="row mb-4">
      <div class="col-md-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Sélectionner un chantier</h5>
          </div>
          <div class="card-body">
            <select v-model="selectedChantierId" class="form-control" @change="loadChantierData">
              <option value="">Choisir un chantier</option>
              <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                {{ chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '' }}{{ chantier.nom }} - {{ chantier.adresse }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Période de référence -->
    <div class="row mb-4" v-if="selectedChantierId">
      <div class="col-md-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Période de référence</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <label class="form-label">Date début:</label>
                <input type="date" v-model="periodeDebut" class="form-control">
              </div>
              <div class="col-md-6">
                <label class="form-label">Date fin:</label>
                <input type="date" v-model="periodeFin" class="form-control">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sezione Regie -->
    <div v-if="selectedChantierId" class="card p-4 mb-4">
      <h5>Régies (Heures supplémentaires facturables)</h5>
      <div class="row mb-3">
        <div class="col-md-3">
          <label>Zone:</label>
          <select v-model="nouvelleRegie.zone" class="form-control">
            <option value="">Sélectionner zone</option>
            <option v-for="zona in zones" :key="zona" :value="zona">{{ zona }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label>Heures:</label>
          <input v-model.number="nouvelleRegie.heures" type="number" step="0.5" class="form-control" placeholder="2.0">
        </div>
        <div class="col-md-3">
          <label>Description travail:</label>
          <input v-model="nouvelleRegie.description" type="text" class="form-control" placeholder="Modification installation électrique...">
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <button @click="regieEnModification !== null ? sauvegarderModificationRegie() : ajouterRegie()" class="btn btn-warning w-100" :disabled="!regieValide">
            {{ regieEnModification !== null ? '✅ Modifier' : '➕ Ajouter' }}
          </button>
        </div>
      </div>
      
      <div v-if="regies.length > 0">
        <h6>Régies ce mois:</h6>
        <table class="table table-sm">
          <thead>
            <tr><th>Zone</th><th>Heures</th><th>Description</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="(regie, index) in regies" :key="index">
              <td>{{ regie.zone }}</td>
              <td>{{ regie.heures }}h</td>
              <td>{{ regie.description }}</td>
              <td>
                <button @click="modifierRegie(index)" class="btn btn-warning btn-sm me-1">✏️</button>
                <button @click="supprimerRegie(index)" class="btn btn-danger btn-sm">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="text-end">
          <strong>Total Heures Régies: {{ totalHeuresRegies }}h</strong>
        </div>
      </div>
    </div>

    <!-- Pulsanti -->
    <div class="mb-3 d-flex justify-content-center" v-if="selectedChantierId">
      <button class="btn btn-success me-2" @click="sauvegarderMetrages">📥 Sauvegarder les métrages</button>
      <button class="btn btn-warning" @click="nouveauMetrage" v-if="metrageItems.length > 0">🆕 Nouveau métrage</button>
    </div>
    
    <!-- Avviso modalità conversione -->
    <div v-if="isConversionMode" class="alert alert-success text-center mb-4">
      <strong>🔄 Conversione da resoconto percentuale:</strong> 
      Zona "{{ zoneInConversione }}" completata al 100%. 
      Inserire ora le quantità definitive per questa zona.
    </div>
    
    <!-- Info métrage en cours -->
    <div v-if="selectedChantierId && currentMetrageInfo && !isConversionMode" class="alert alert-warning text-center mb-4">
      <strong>Métrage en cours:</strong> {{ currentMetrageInfo }}
    </div>

    <!-- Form prodotti -->
    <MetrageForm
      v-if="selectedChantierId && devisData"
      :editingItem="editingItem"
      :chantierId="selectedChantierId"
      :zones="zones"
      :devisData="devisData"
      @update-item="handleUpdateItem"
    />

    <!-- Détails des Métrages -->
    <div class="card p-4 mb-4" v-if="selectedChantierId && metrageItems.length > 0">
      <h5>Détails des Métrages</h5>
      <div v-for="(zone, zoneIndex) in metragesParZone" :key="zone.nom">
        <h6 class="mt-3">Zone: {{ zone.nom }}</h6>
        <table class="table">
          <thead>
            <tr>
              <th>Code Article</th><th>Produit</th><th>Taille</th><th>Unité</th>
              <th>Quantité ML Prévue</th><th>Quantité ML Posée</th><th>Total Suppl. (ML)</th>
              <th>Total ML</th><th>Progression</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, itemIndex) in zone.produits" :key="itemIndex">
              <td>{{ item.article }}</td>
              <td>{{ item.nom }}</td>
              <td>{{ item.taille }}</td>
              <td>{{ item.unite }}</td>
              <td>{{ item.mlPrevue }}</td>
              <td>{{ item.mlPosee }}</td>
              <td>{{ item.totalSuppML?.toFixed(2) || '0.00' }}</td>
              <td><strong>{{ item.totalML?.toFixed(2) || '0.00' }}</strong></td>
              <td>
                <span class="badge" :class="getProgressClass(item)">
                  {{ getProgressPercentage(item) }}%
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-warning me-2" @click="modifierItem(zone.nom, itemIndex)">✎</button>
                <button class="btn btn-sm btn-danger" @click="supprimerItem(zone.nom, itemIndex)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="text-end fw-bold">
          Total ML zone: {{ getSubtotalTotalML(zone.produits).toFixed(2) }} ML
        </div>
      </div>
      <div class="text-end fs-5 fw-bold mt-3">
        Total Général ML: {{ totalMLGeneral.toFixed(2) }} ML
      </div>
    </div>

    <!-- Suppléments -->
    <MetrageSupplementDetails 
      v-if="selectedChantierId"
      :supplementParZone="supplementParZone" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase.js';
import RetourButton from '@/components/RetourButton.vue';
import MetrageForm from '@/components/MetrageForm.vue';
import MetrageSupplementDetails from '@/components/MetrageSupplementDetails.vue';

const router = useRouter();
const chantiers = ref([]);
const selectedChantierId = ref('');
const devisData = ref(null);
const zones = ref([]);
const metrageItems = ref([]);
const editingItem = ref(null);
const numeroDevis = ref('');
const nomClient = ref('');
const nomChantier = ref('');
const currentMetrageId = ref(null);
const currentMetrageInfo = ref('');
const periodeDebut = ref('');
const periodeFin = ref('');
const isConversionMode = ref(false);
const zoneInConversione = ref('');
const regies = ref([]);
const prixRegieChantier = ref(75);
const regieEnModification = ref(null);
const nouvelleRegie = ref({ zone: '', heures: 0, description: '' });

// Admin: carica TUTTI i cantieri
const fetchChantiers = async () => {
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .select('*')
      .order('nom');
    
    if (error) throw error;
    chantiers.value = data || [];
  } catch (error) {
    console.error('Erreur chargement chantiers:', error);
    chantiers.value = [];
  }
};

const loadChantierData = async () => {
  if (!selectedChantierId.value) return;
  
  try {
    const chantier = chantiers.value.find(c => String(c.id) === String(selectedChantierId.value));
    if (!chantier) { alert('Cantiere non trovato'); return; }
    
    let allDevisStessoCantiere = [];
    
    if (chantier.devis_id) {
      const { data, error } = await supabase.from('devis').select('*').eq('id', parseInt(chantier.devis_id));
      if (error || !data?.length) { alert('Devis associé non trouvé'); return; }
      allDevisStessoCantiere = data;
    } else {
      const { data, error } = await supabase.from('devis').select('*')
        .or(`nom.eq."${chantier.nom}",adresse.eq."${chantier.adresse}"`);
      if (error || !data?.length) { alert('Chantier ou devis non trouvé.'); return; }
      allDevisStessoCantiere = data;
    }
    
    if (chantier.type_metrage === 'percentuel') {
      router.push(`/admin/resoconto-percentuale?chantier=${selectedChantierId.value}`);
      return;
    }
    
    metrageItems.value = [];
    regies.value = [];
    currentMetrageId.value = null;
    currentMetrageInfo.value = '';
    periodeDebut.value = '';
    periodeFin.value = '';
    editingItem.value = null;
    
    const numeroDisplay = chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '';
    nomChantier.value = `${numeroDisplay}${chantier.nom} - ${chantier.adresse}`;
    prixRegieChantier.value = chantier.prix_regie || 75;
    
    const devisCombinato = {
      numero: allDevisStessoCantiere.map(d => d.numero).join(', '),
      nom: allDevisStessoCantiere[0].nom,
      produits: []
    };
    
    const prodottiMap = new Map();
    allDevisStessoCantiere.forEach(devis => {
      if (devis.produits && Array.isArray(devis.produits)) {
        devis.produits.forEach(prodotto => {
          const key = `${prodotto.zone}-${prodotto.article}-${prodotto.nom}-${prodotto.taille}`;
          if (prodottiMap.has(key)) {
            const existing = prodottiMap.get(key);
            existing.ml = (existing.ml || 0) + (prodotto.ml || 0);
            existing.mlPrevue = existing.ml;
          } else {
            prodottiMap.set(key, { ...prodotto, mlPrevue: prodotto.ml, mlPosee: 0 });
          }
        });
      }
    });
    
    devisCombinato.produits = Array.from(prodottiMap.values());
    devisData.value = devisCombinato;
    numeroDevis.value = devisCombinato.numero;
    nomClient.value = devisCombinato.nom || '';
    
    if (devisCombinato.produits?.length > 0) {
      const zoneSet = new Set();
      devisCombinato.produits.forEach(p => { if (p.zone) zoneSet.add(p.zone); });
      zones.value = Array.from(zoneSet).sort();
    } else {
      zones.value = [];
    }
  } catch (error) {
    alert('Erreur lors du chargement: ' + error.message);
  }
};

const handleUpdateItem = (index, item) => {
  const duplicate = metrageItems.value.find(i =>
    i.zone === item.zone && i.article === item.article && i !== metrageItems.value[index]
  );
  if (duplicate) { alert("Ce produit existe déjà dans cette zone."); return; }
  if (index !== null && index !== undefined) {
    metrageItems.value[index] = item;
  } else {
    metrageItems.value.push(item);
  }
  editingItem.value = null;
};

const modifierItem = (zoneNom, itemIndex) => {
  const zoneItems = metragesParZone.value.find(z => z.nom === zoneNom)?.produits || [];
  const targetItem = zoneItems[itemIndex];
  const globalIndex = metrageItems.value.findIndex(i => i === targetItem);
  if (globalIndex !== -1) {
    const item = metrageItems.value[globalIndex];
    editingItem.value = {
      index: globalIndex, zone: item.zone, article: item.article, nom: item.nom,
      taille: item.taille, unite: item.unite, mlPrevue: item.mlPrevue, mlPosee: item.mlPosee,
      supplements: JSON.parse(JSON.stringify(item.supplements || []))
    };
  }
};

const supprimerItem = (zoneNom, itemIndex) => {
  if (confirm('Supprimer cette ligne?')) {
    const zoneItems = metragesParZone.value.find(z => z.nom === zoneNom)?.produits || [];
    const targetItem = zoneItems[itemIndex];
    const idx = metrageItems.value.findIndex(i => i === targetItem);
    if (idx !== -1) metrageItems.value.splice(idx, 1);
  }
};

const metragesParZone = computed(() => {
  const grouped = {};
  metrageItems.value.forEach(item => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone].push(item);
  });
  return Object.entries(grouped).map(([nom, produits]) => ({ nom, produits }));
});

const supplementParZone = computed(() => {
  const grouped = {};
  metrageItems.value.forEach(item => {
    if (Array.isArray(item.supplements)) {
      if (!grouped[item.zone]) grouped[item.zone] = [];
      grouped[item.zone].push(...item.supplements.map(s => ({ ...s, code: item.article, nom: item.nom, taille: item.taille })));
    }
  });
  return Object.entries(grouped).map(([nom, details]) => ({ nom, details }));
});

const getSubtotalTotalML = (items) => items.reduce((sum, i) => sum + (i.totalML || 0), 0);

const totalMLPose = computed(() => metrageItems.value.reduce((sum, i) => sum + (i.mlPosee || 0), 0));
const totalMLGeneral = computed(() => metrageItems.value.reduce((sum, i) => sum + (i.totalML || 0), 0));

const regieValide = computed(() => nouvelleRegie.value.zone && nouvelleRegie.value.heures > 0 && nouvelleRegie.value.description.trim());
const totalHeuresRegies = computed(() => regies.value.reduce((sum, r) => sum + r.heures, 0));

const getProgressPercentage = (item) => {
  const prevue = item.mlPrevue || 0;
  const posee = item.mlPosee || 0;
  return prevue > 0 ? Math.round((posee / prevue) * 100) : 0;
};

const getProgressClass = (item) => {
  const p = getProgressPercentage(item);
  if (p === 0) return 'bg-secondary';
  if (p < 50) return 'bg-danger';
  if (p < 100) return 'bg-warning';
  return 'bg-success';
};

// Admin: salva direttamente come approved
const sauvegarderMetrages = async () => {
  try {
    if (currentMetrageId.value) {
      const { error } = await supabase.from('metrages').update({
        items: metrageItems.value, regies: [...regies.value], total_ml: totalMLPose.value,
        zones: zones.value, total_produits: metrageItems.value.length,
        periode_debut: periodeDebut.value, periode_fin: periodeFin.value,
        status: 'approved', updated_at: new Date().toISOString()
      }).eq('id', currentMetrageId.value);
      if (error) throw error;
      alert('Métrage mis à jour avec succès!');
    } else {
      const { error } = await supabase.from('metrages').insert([{
        chantier_id: selectedChantierId.value, items: metrageItems.value, regies: [...regies.value],
        total_ml: totalMLPose.value, zones: zones.value, total_produits: metrageItems.value.length,
        periode_debut: periodeDebut.value, periode_fin: periodeFin.value,
        draft: false, status: 'approved', created_at: new Date().toISOString(),
        conversione_completata: isConversionMode.value,
        zona_convertita: isConversionMode.value ? zoneInConversione.value : null
      }]);
      if (error) throw error;
      
      if (isConversionMode.value) {
        alert(`Conversione completata! La zona "${zoneInConversione.value}" è ora definitiva.`);
        router.push(`/admin/resoconto-percentuale?chantier=${selectedChantierId.value}`);
      } else {
        alert('Métrages sauvegardés avec succès.');
      }
    }
    
    currentMetrageId.value = null;
    currentMetrageInfo.value = '';
    metrageItems.value = [];
    regies.value = [];
  } catch (error) {
    alert('Erreur lors de la sauvegarde: ' + error.message);
  }
};

const nouveauMetrage = () => {
  if (confirm('Créer un nouveau métrage? Les données actuelles seront perdues.')) {
    metrageItems.value = [];
    currentMetrageId.value = null;
    currentMetrageInfo.value = '';
    periodeDebut.value = '';
    periodeFin.value = '';
    editingItem.value = null;
  }
};

const ajouterRegie = () => {
  if (!regieValide.value) return;
  regies.value.push({ zone: nouvelleRegie.value.zone, heures: nouvelleRegie.value.heures, prixHeure: prixRegieChantier.value, description: nouvelleRegie.value.description });
  nouvelleRegie.value = { zone: '', heures: 0, description: '' };
};

const modifierRegie = (index) => {
  const r = regies.value[index];
  nouvelleRegie.value = { zone: r.zone, heures: r.heures, description: r.description };
  regieEnModification.value = index;
};

const sauvegarderModificationRegie = () => {
  if (!regieValide.value || regieEnModification.value === null) return;
  regies.value[regieEnModification.value] = { zone: nouvelleRegie.value.zone, heures: nouvelleRegie.value.heures, prixHeure: prixRegieChantier.value, description: nouvelleRegie.value.description };
  nouvelleRegie.value = { zone: '', heures: 0, description: '' };
  regieEnModification.value = null;
};

const supprimerRegie = (index) => {
  regies.value.splice(index, 1);
  if (regieEnModification.value === index) {
    regieEnModification.value = null;
    nouvelleRegie.value = { zone: '', heures: 0, description: '' };
  }
};

onMounted(async () => {
  await fetchChantiers();
  
  const urlParams = new URLSearchParams(window.location.search);
  const chantierId = urlParams.get('chantier');
  
  if (urlParams.get('conversion') === 'true') {
    isConversionMode.value = true;
    zoneInConversione.value = urlParams.get('zona') || '';
  }
  
  if (chantierId) {
    selectedChantierId.value = chantierId;
    await loadChantierData();
  }
});
</script>

<style scoped>
.badge { font-size: 0.8em; padding: 0.4em 0.6em; }
</style>
