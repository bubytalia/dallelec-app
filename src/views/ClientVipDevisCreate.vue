<template>
  <div class="container py-4">
    <button class="btn btn-outline-secondary mb-3" @click="$router.push('/client')">← Retour</button>
    
    <h2 class="text-center mb-4">{{ editingId ? 'Modifier le Devis' : 'Nouveau Devis' }}</h2>

    <!-- Tutorial / Avertissement -->
    <div class="alert alert-warning mb-4">
      <h6>📋 Information importante</h6>
      <p class="mb-1">Cet accès est destiné à la rédaction de devis de <strong>petite et moyenne envergure</strong> dans des conditions de pose <strong>ordinaires</strong>.</p>
      <p class="mb-1">Les devis de grande envergure ou avec des conditions de pose particulières doivent être demandés directement à <strong>DALLELEC Sàrl</strong>.</p>
      <hr class="my-2">
      <small><strong>Comment créer un devis:</strong> 1) Remplissez les informations du chantier et ajoutez les zones → 2) Sélectionnez les produits, quantités et suppléments pour chaque zone → 3) Sauvegardez.</small>
    </div>

    <!-- Step 1: Info chantier + type pose -->
    <div v-if="step === 1" class="card p-4 mb-4">
      <h5>Informations du chantier</h5>
      <div class="row mb-3">
        <div class="col-md-6">
          <label class="form-label">Nom du chantier</label>
          <input v-model="form.nom" class="form-control" placeholder="Nom du chantier" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Adresse</label>
          <input v-model="form.adresse" class="form-control" placeholder="Adresse du chantier" />
        </div>
      </div>
      <div class="row mb-3">
        <div class="col-md-6">
          <label class="form-label">Type de pose</label>
          <select v-model="form.typePose" class="form-select">
            <option value="beton">Béton</option>
            <option value="din">DIN</option>
          </select>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Zones de chantier</label>
        <div class="input-group mb-2">
          <input v-model="newZone" @keyup.enter="addZone" class="form-control" placeholder="Ajouter une zone (ex: RDC, Étage 1, Parking...)" />
          <button class="btn btn-primary" @click="addZone" :disabled="!newZone.trim()">➕ Ajouter</button>
        </div>
        <div v-if="form.zones.length > 0">
          <span v-for="(zone, i) in form.zones" :key="i" class="badge bg-primary me-2 mb-1 d-inline-flex align-items-center">
            <template v-if="editingZoneIndex === i">
              <input v-model="editingZoneName" @keyup.enter="confirmEditZone(i)" @keyup.escape="cancelEditZone" @blur="confirmEditZone(i)" class="zone-edit-input" />
            </template>
            <template v-else>
              <span class="cursor-pointer" @dblclick="startEditZone(i)" title="Double-clic pour renommer">{{ zone }}</span>
              <span class="ms-1 cursor-pointer" @click="form.zones.splice(i, 1)">&times;</span>
            </template>
          </span>
        </div>
      </div>
      <button class="btn btn-success" :disabled="!step1Valid" @click="step = 2">Continuer vers les produits →</button>
    </div>

    <!-- Step 2: Produits -->
    <div v-if="step === 2">
      <div class="alert alert-info text-center mb-3">
        <strong>{{ form.nom }}</strong> — Pose: <strong>{{ form.typePose === 'din' ? 'DIN' : 'Béton' }}</strong>
      </div>

      <!-- Formulaire ajout/modification produit -->
      <div class="card p-3 mb-4">
        <h5>{{ editingItemIndex !== null ? '✏️ Modifier le produit' : 'Ajouter un produit' }}</h5>
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <label class="form-label">Produit</label>
            <div class="position-relative">
              <input v-model="searchText" @focus="showDropdown = true" @blur="hideDropdown" type="text" class="form-control" placeholder="Rechercher..." autocomplete="off" />
              <div v-if="showDropdown && filteredProduits.length > 0" class="dropdown-menu show w-100" style="max-height:250px;overflow-y:auto;position:absolute;z-index:1050">
                <button v-for="p in filteredProduits.slice(0, 50)" :key="p.article" @mousedown="selectProduit(p)" class="dropdown-item" type="button">
                  <strong>{{ p.article }}</strong> - {{ p.description }} ({{ p.taille }}) — {{ getPrix(p).toFixed(2) }} CHF
                </button>
              </div>
            </div>
          </div>
          <div class="col-md-2">
            <label class="form-label">Zone</label>
            <select v-model="newItem.zone" class="form-select">
              <option value="">Choisir...</option>
              <option v-for="z in form.zones" :key="z" :value="z">{{ z }}</option>
            </select>
          </div>
          <div class="col-md-1">
            <label class="form-label">Qté</label>
            <input v-model.number="newItem.ml" type="number" min="0" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Suppléments</label>
            <div v-for="sup in supplements" :key="sup.id" class="d-flex align-items-center mb-1">
              <input type="checkbox" :value="sup.nom" v-model="newItem.selectedSupplements" class="form-check-input me-1" />
              <span class="me-1" style="font-size:0.85em">{{ sup.nom }}</span>
              <input v-if="newItem.selectedSupplements.includes(sup.nom)" v-model.number="newItem.suppQty[sup.nom]" type="number" min="0" class="form-control form-control-sm" style="width:60px" placeholder="Qté" />
            </div>
          </div>
          <div class="col-md-2">
            <button v-if="editingItemIndex === null" class="btn btn-primary w-100" @click="addItem" :disabled="!newItem.article || !newItem.zone">Ajouter</button>
            <div v-else class="d-flex gap-1">
              <button class="btn btn-success flex-fill" @click="confirmEdit">✓</button>
              <button class="btn btn-secondary flex-fill" @click="cancelEdit">✗</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tableau produits par zone -->
      <div v-for="zone in devisParZone" :key="zone.nom" class="card mb-3">
        <div class="card-header bg-light">
          <h6 class="mb-0">Zone: {{ zone.nom }}</h6>
        </div>
        <div class="card-body table-responsive p-0">
          <table class="table table-sm mb-0">
            <thead>
              <tr>
                <th>Article</th>
                <th>Description</th>
                <th>Taille</th>
                <th class="text-end">Qté</th>
                <th class="text-end">Suppl.</th>
                <th class="text-end">Total ML</th>
                <th class="text-end">Prix Unit.</th>
                <th class="text-end">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in zone.items" :key="idx">
                <td>{{ item.article }}</td>
                <td>{{ item.nom }}</td>
                <td>{{ item.taille }}</td>
                <td class="text-end">{{ item.ml }}</td>
                <td class="text-end">{{ item.totalSuppML.toFixed(1) }}</td>
                <td class="text-end">{{ item.totalML.toFixed(1) }}</td>
                <td class="text-end">{{ item.prix.toFixed(2) }}</td>
                <td class="text-end fw-bold">{{ item.total.toFixed(2) }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-warning me-1" @click="startEditItem(item._globalIdx)">✎</button>
                  <button class="btn btn-sm btn-outline-danger" @click="devisItems.splice(item._globalIdx, 1)">🗑</button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="7" class="text-end fw-bold">Sous-total {{ zone.nom }}:</td>
                <td class="text-end fw-bold">{{ zone.subtotal.toFixed(2) }} CHF</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Détail suppléments par zone -->
      <div v-if="supplementParZone.length > 0" class="card mb-4">
        <div class="card-header"><h6 class="mb-0">Détail des Suppléments par Zone</h6></div>
        <div class="card-body">
          <div v-for="zone in supplementParZone" :key="zone.nom" class="mb-3">
            <strong>Zone: {{ zone.nom }}</strong>
            <table class="table table-sm mt-1">
              <thead>
                <tr><th>Article</th><th>Produit</th><th>Taille</th><th>Supplément</th><th class="text-end">Qté</th><th class="text-end">Valeur</th><th class="text-end">Total ML</th></tr>
              </thead>
              <tbody>
                <tr v-for="(s, i) in zone.details" :key="i">
                  <td>{{ s.article }}</td><td>{{ s.nom }}</td><td>{{ s.taille }}</td><td>{{ s.supplement }}</td>
                  <td class="text-end">{{ s.qte }}</td><td class="text-end">{{ s.valeur }}</td><td class="text-end">{{ s.qteTotale.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Total -->
      <div v-if="devisItems.length > 0" class="card mb-4">
        <div class="card-body text-end fs-5 fw-bold">
          Total Devis HT: {{ totalDevis.toFixed(2) }} CHF
        </div>
      </div>

      <div v-if="devisItems.length === 0" class="alert alert-secondary text-center mb-4">
        Aucun produit ajouté. Utilisez le formulaire ci-dessus pour ajouter des produits.
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-secondary" @click="step = 1">← Retour infos chantier</button>
        <button class="btn btn-success" @click="saveDevis" :disabled="devisItems.length === 0 || saving">
          {{ saving ? 'Sauvegarde...' : '💾 Sauvegarder le devis' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '@/supabase';

const router = useRouter();
const route = useRoute();
const editingId = ref(route.params.id || null);
const clientId = ref(localStorage.getItem('clientVipId') || '');
const clientName = ref(localStorage.getItem('userName') || '');

const step = ref(1);
const form = ref({ nom: '', adresse: '', typePose: 'beton', zones: [] });
const newZone = ref('');
const devisItems = ref([]);
const produits = ref([]);
const listinoVip = ref([]);
const supplements = ref([]);
const saving = ref(false);
const searchText = ref('');
const showDropdown = ref(false);
const newItem = ref({ article: '', zone: '', ml: 0, selectedSupplements: [], suppQty: {}, _produit: null });
const editingItemIndex = ref(null);

// Zone editing
const editingZoneIndex = ref(null);
const editingZoneName = ref('');

const startEditZone = (i) => { editingZoneIndex.value = i; editingZoneName.value = form.value.zones[i]; };
const confirmEditZone = (i) => { if (editingZoneName.value.trim()) form.value.zones[i] = editingZoneName.value.trim(); editingZoneIndex.value = null; };
const cancelEditZone = () => { editingZoneIndex.value = null; };

// Lettere permesse: A-L + Z
const allowedLetters = 'ABCDEFGHIJKLZ';

const step1Valid = computed(() => form.value.nom && form.value.adresse && form.value.zones.length > 0);
const totalDevis = computed(() => devisItems.value.reduce((sum, i) => sum + i.total, 0));

// Produits groupés par zone
const devisParZone = computed(() => {
  const grouped = {};
  devisItems.value.forEach((item, idx) => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone].push({ ...item, _globalIdx: idx });
  });
  return form.value.zones.filter(z => grouped[z]).map(nom => ({
    nom,
    items: grouped[nom],
    subtotal: grouped[nom].reduce((sum, i) => sum + i.total, 0)
  }));
});

// Détail suppléments par zone
const supplementParZone = computed(() => {
  const grouped = {};
  devisItems.value.forEach(item => {
    if (item.supplements && item.supplements.length > 0) {
      if (!grouped[item.zone]) grouped[item.zone] = [];
      item.supplements.filter(s => s.qte > 0).forEach(s => {
        grouped[item.zone].push({ article: item.article, nom: item.nom, taille: item.taille, ...s });
      });
    }
  });
  return Object.entries(grouped).map(([nom, details]) => ({ nom, details }));
});

const filteredProduits = computed(() => {
  const list = produits.value.filter(p => {
    const firstChar = (p.article || '').charAt(0).toUpperCase();
    return allowedLetters.includes(firstChar);
  }).filter(p => {
    const vip = listinoVip.value.find(v => v.article === p.article);
    if (!vip) return false;
    const prix = form.value.typePose === 'din' ? vip.prix_din : vip.prix_beton;
    return prix > 0;
  });
  if (!searchText.value) return list;
  const s = searchText.value.toLowerCase();
  return list.filter(p =>
    p.article.toLowerCase().includes(s) ||
    (p.description || '').toLowerCase().includes(s) ||
    (p.taille || '').toLowerCase().includes(s)
  );
});

const getPrix = (p) => {
  const vip = listinoVip.value.find(v => v.article === p.article);
  if (!vip) return 0;
  return form.value.typePose === 'din' ? vip.prix_din : vip.prix_beton;
};

const addZone = () => {
  if (newZone.value.trim()) {
    form.value.zones.push(newZone.value.trim());
    newZone.value = '';
  }
};

const selectProduit = (p) => {
  newItem.value.article = p.article;
  newItem.value._produit = p;
  searchText.value = `${p.article} - ${p.description} (${p.taille})`;
  showDropdown.value = false;
};

const hideDropdown = () => { setTimeout(() => { showDropdown.value = false; }, 200); };

const buildItemFromForm = () => {
  const p = newItem.value._produit;
  if (!p) return null;
  const prix = getPrix(p);
  const suppDetails = newItem.value.selectedSupplements.map(nom => {
    const sup = supplements.value.find(s => s.nom === nom);
    const qte = newItem.value.suppQty[nom] || 0;
    return { supplement: nom, valeur: sup?.valeur || 0, qte, qteTotale: qte * (sup?.valeur || 0) };
  });
  const totalSuppML = suppDetails.reduce((sum, s) => sum + s.qteTotale, 0);
  const totalML = newItem.value.ml + totalSuppML;
  return {
    zone: newItem.value.zone,
    article: p.article,
    nom: p.description || p.nom || '',
    taille: p.taille || '',
    unite: p.unite || 'm',
    ml: newItem.value.ml,
    supplements: suppDetails,
    totalSuppML,
    totalML,
    prix,
    total: totalML * prix
  };
};

const addItem = () => {
  const item = buildItemFromForm();
  if (!item) return;
  devisItems.value.push(item);
  resetForm();
};

const startEditItem = (globalIdx) => {
  const item = devisItems.value[globalIdx];
  editingItemIndex.value = globalIdx;
  const p = produits.value.find(pr => pr.article === item.article);
  newItem.value = {
    article: item.article,
    zone: item.zone,
    ml: item.ml,
    selectedSupplements: (item.supplements || []).map(s => s.supplement),
    suppQty: {},
    _produit: p || { article: item.article, description: item.nom, taille: item.taille, unite: item.unite }
  };
  (item.supplements || []).forEach(s => { newItem.value.suppQty[s.supplement] = s.qte; });
  searchText.value = `${item.article} - ${item.nom} (${item.taille})`;
};

const confirmEdit = () => {
  const item = buildItemFromForm();
  if (!item || editingItemIndex.value === null) return;
  devisItems.value[editingItemIndex.value] = item;
  resetForm();
};

const cancelEdit = () => { resetForm(); };

const resetForm = () => {
  const zone = newItem.value.zone;
  newItem.value = { article: '', zone, ml: 0, selectedSupplements: [], suppQty: {}, _produit: null };
  searchText.value = '';
  editingItemIndex.value = null;
};

const saveDevis = async () => {
  saving.value = true;
  try {
    const devisData = {
      nom: form.value.nom,
      adresse: form.value.adresse,
      client_id: clientId.value,
      technicien: clientName.value,
      zones: form.value.zones,
      modalita_prezzi: 'prezziFissi',
      use_listino_vip: true,
      vip_type_pose: form.value.typePose,
      produits: JSON.parse(JSON.stringify(devisItems.value)),
      total: totalDevis.value,
      status: 'En attente',
      draft: false,
      created_by: localStorage.getItem('userEmail') || '',
      updated_at: new Date().toISOString()
    };

    if (editingId.value) {
      const { error } = await supabase.from('devis').update(devisData).eq('id', editingId.value);
      if (error) throw error;
    } else {
      devisData.numero = `VIP-${Date.now().toString().slice(-6)}`;
      devisData.created_at = new Date().toISOString();
      const { error } = await supabase.from('devis').insert(devisData);
      if (error) throw error;
    }

    alert('Devis sauvegardé avec succès!');
    router.push('/client');
  } catch (error) {
    alert('Erreur: ' + error.message);
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  if (!clientId.value) { router.push('/login'); return; }

  const [produitsRes, listinoRes, suppRes] = await Promise.all([
    supabase.from('produits').select('*').order('article'),
    supabase.from('listino_vip').select('*').eq('client_id', Number(clientId.value)),
    supabase.from('supplements').select('*').order('ordre')
  ]);

  produits.value = (produitsRes.data || []).map(p => ({ ...p, description: p.description || p.nom || '' }));
  listinoVip.value = listinoRes.data || [];
  supplements.value = suppRes.data || [];

  if (editingId.value) {
    const { data } = await supabase.from('devis').select('*').eq('id', editingId.value).single();
    if (data) {
      form.value.nom = data.nom || '';
      form.value.adresse = data.adresse || '';
      form.value.typePose = data.vip_type_pose || 'beton';
      form.value.zones = data.zones || [];
      devisItems.value = data.produits || [];
      step.value = 2;
    }
  }
});
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.zone-edit-input {
  background: transparent; border: none; border-bottom: 1px solid white;
  color: white; outline: none; width: 120px; font-size: 0.85em;
}
</style>
