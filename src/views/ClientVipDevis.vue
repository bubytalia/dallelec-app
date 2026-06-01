<template>
  <div class="container py-4">
    <button class="btn btn-outline-secondary mb-3" @click="$router.push('/client')">← Retour</button>

    <h2 class="text-center mb-4">{{ editingId ? 'Modifier le Devis' : 'Nouveau Devis' }}</h2>

    <!-- Step 1: Info chantier + type pose -->
    <div class="card p-4 mb-4">
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
        <div class="col-md-4">
          <label class="form-label">Type de pose</label>
          <select v-model="form.typePose" class="form-select">
            <option value="beton">Béton</option>
            <option value="din">DIN</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Zone</label>
          <div class="input-group">
            <input v-model="newZone" class="form-control" placeholder="Ajouter zone" @keyup.enter="addZone" />
            <button class="btn btn-primary" @click="addZone" :disabled="!newZone.trim()">+</button>
          </div>
        </div>
        <div class="col-md-4 d-flex align-items-end">
          <div>
            <span v-for="(z, i) in zones" :key="i" class="badge bg-primary me-1">
              {{ z }} <span class="ms-1 cursor-pointer" @click="zones.splice(i, 1)">&times;</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Ajout produits -->
    <div class="card p-4 mb-4" v-if="zones.length > 0">
      <h5>Ajouter un produit</h5>
      <div class="row g-2 align-items-end">
        <div class="col-md-3">
          <label class="form-label">Produit</label>
          <div class="position-relative">
            <input v-model="searchText" @focus="showDropdown = true" @blur="hideDropdown" type="text" class="form-control" placeholder="Rechercher..." autocomplete="off" />
            <div v-if="showDropdown && filteredProduits.length > 0" class="dropdown-menu show w-100" style="max-height:250px;overflow-y:auto;z-index:1050">
              <button v-for="p in filteredProduits" :key="p.article" @mousedown="selectProduit(p)" class="dropdown-item" type="button">
                <strong>{{ p.article }}</strong> - {{ p.description }} ({{ p.taille }}) — {{ getPrix(p).toFixed(2) }} CHF
              </button>
            </div>
          </div>
        </div>
        <div class="col-md-1">
          <label class="form-label">Qté</label>
          <input v-model.number="newItem.quantite" type="number" min="0" class="form-control" />
        </div>
        <div class="col-md-2">
          <label class="form-label">Zone</label>
          <select v-model="newItem.zone" class="form-select">
            <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Suppléments</label>
          <div v-for="sup in supplements" :key="sup.id" class="d-inline-flex align-items-center me-2">
            <input type="checkbox" :value="sup.nom" v-model="newItem.selectedSupps" class="form-check-input me-1" />
            <span class="me-1">{{ sup.nom }}</span>
            <input v-if="newItem.selectedSupps.includes(sup.nom)" v-model.number="newItem.suppQty[sup.nom]" type="number" min="0" class="form-control form-control-sm" style="width:50px" />
          </div>
        </div>
        <div class="col-md-2">
          <button class="btn btn-success w-100" @click="addItem" :disabled="!newItem.article || !newItem.zone">Ajouter</button>
        </div>
      </div>
    </div>

    <!-- Step 3: Tableau produits -->
    <div v-if="devisItems.length > 0" class="card p-4 mb-4">
      <h5>Produits du devis</h5>
      <div v-for="zone in devisParZone" :key="zone.nom" class="mb-3">
        <h6>Zone: {{ zone.nom }}</h6>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Article</th>
              <th>Produit</th>
              <th>Taille</th>
              <th>Qté</th>
              <th>Suppl.</th>
              <th>Total ML</th>
              <th class="text-end">Prix</th>
              <th class="text-end">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in zone.items" :key="idx">
              <td>{{ item.article }}</td>
              <td>{{ item.nom }}</td>
              <td>{{ item.taille }}</td>
              <td>{{ item.ml }}</td>
              <td>{{ item.totalSuppML.toFixed(1) }}</td>
              <td>{{ item.totalML.toFixed(1) }}</td>
              <td class="text-end">{{ item.prix.toFixed(2) }}</td>
              <td class="text-end fw-bold">{{ item.total.toFixed(2) }}</td>
              <td><button class="btn btn-sm btn-outline-danger" @click="removeItem(item)">🗑</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="text-end fs-5 fw-bold">Total: {{ devisTotal.toFixed(2) }} CHF</div>
    </div>

    <!-- Boutons -->
    <div v-if="zones.length > 0" class="d-flex gap-2 justify-content-end">
      <button class="btn btn-outline-primary" @click="saveDevis(true)">💾 Sauver brouillon</button>
      <button class="btn btn-success" @click="saveDevis(false)" :disabled="devisItems.length === 0 || !form.nom">📤 Envoyer pour validation</button>
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

const form = ref({ nom: '', adresse: '', typePose: 'beton' });
const zones = ref([]);
const newZone = ref('');
const devisItems = ref([]);
const produits = ref([]);
const supplements = ref([]);
const listinoVip = ref([]);
const searchText = ref('');
const showDropdown = ref(false);
const newItem = ref({ article: '', quantite: 0, zone: '', selectedSupps: [], suppQty: {} });

const ALLOWED_PREFIXES = 'ABCDEFGHIJKLZ';

const filteredProduits = computed(() => {
  if (!searchText.value) return produits.value.slice(0, 50);
  const s = searchText.value.toLowerCase();
  return produits.value.filter(p =>
    p.article.toLowerCase().includes(s) ||
    p.description.toLowerCase().includes(s) ||
    p.taille.toLowerCase().includes(s)
  ).slice(0, 50);
});

const getPrix = (p) => {
  const vipItem = listinoVip.value.find(v => v.article === p.article);
  if (!vipItem) return Number(p.prix) || 0;
  return form.value.typePose === 'din' ? vipItem.prix_din : vipItem.prix_beton;
};

const devisParZone = computed(() => {
  const grouped = {};
  devisItems.value.forEach(item => {
    if (!grouped[item.zone]) grouped[item.zone] = [];
    grouped[item.zone].push(item);
  });
  return Object.entries(grouped).map(([nom, items]) => ({ nom, items }));
});

const devisTotal = computed(() => devisItems.value.reduce((sum, i) => sum + i.total, 0));

onMounted(async () => {
  if (!clientId.value) { router.push('/login'); return; }

  const [produitsRes, suppRes, listinoRes] = await Promise.all([
    supabase.from('produits').select('*').order('article'),
    supabase.from('supplements').select('*').order('ordre'),
    supabase.from('listino_vip').select('*').eq('client_id', Number(clientId.value))
  ]);

  // Filtrer produits: seulement A-L et Z, et seulement ceux avec prix VIP > 0
  const allProduits = (produitsRes.data || []).filter(p => {
    const firstChar = (p.article || '')[0]?.toUpperCase();
    return ALLOWED_PREFIXES.includes(firstChar);
  });

  listinoVip.value = listinoRes.data || [];

  // Ne montrer que les produits qui ont un prix VIP
  produits.value = allProduits.filter(p => {
    const vipItem = listinoVip.value.find(v => v.article === p.article);
    if (!vipItem) return false;
    return vipItem.prix_beton > 0 || vipItem.prix_din > 0;
  }).map(p => ({ ...p, description: p.description || p.nom || '' }));

  supplements.value = suppRes.data || [];

  // Charger devis existant si édition
  if (editingId.value) {
    const { data } = await supabase.from('devis').select('*').eq('id', editingId.value).single();
    if (data) {
      form.value.nom = data.nom || '';
      form.value.adresse = data.adresse || '';
      form.value.typePose = data.vip_type_pose || 'beton';
      zones.value = data.zones || [];
      devisItems.value = data.produits || [];
    }
  }
});

const addZone = () => {
  if (newZone.value.trim() && !zones.value.includes(newZone.value.trim())) {
    zones.value.push(newZone.value.trim());
    if (!newItem.value.zone) newItem.value.zone = zones.value[0];
  }
  newZone.value = '';
};

const selectProduit = (p) => {
  newItem.value.article = p.article;
  searchText.value = `${p.article} - ${p.description} (${p.taille})`;
  showDropdown.value = false;
};

const hideDropdown = () => { setTimeout(() => { showDropdown.value = false; }, 200); };

const addItem = () => {
  const p = produits.value.find(pr => pr.article === newItem.value.article);
  if (!p) return;

  const prix = getPrix(p);
  const suppDetails = newItem.value.selectedSupps.map(nom => {
    const sup = supplements.value.find(s => s.nom === nom);
    const qte = newItem.value.suppQty[nom] || 0;
    return { supplement: nom, valeur: sup?.valeur || 0, qte, qteTotale: qte * (sup?.valeur || 0) };
  });
  const totalSuppML = suppDetails.reduce((s, d) => s + d.qteTotale, 0);
  const totalML = newItem.value.quantite + totalSuppML;

  devisItems.value.push({
    zone: newItem.value.zone,
    article: p.article,
    nom: p.description,
    taille: p.taille,
    unite: p.unite || 'm',
    ml: newItem.value.quantite,
    supplements: suppDetails,
    totalSuppML,
    totalML,
    prix,
    total: totalML * prix
  });

  newItem.value = { article: '', quantite: 0, zone: newItem.value.zone, selectedSupps: [], suppQty: {} };
  searchText.value = '';
};

const removeItem = (item) => {
  const idx = devisItems.value.indexOf(item);
  if (idx !== -1) devisItems.value.splice(idx, 1);
};

const saveDevis = async (asDraft) => {
  try {
    const devisData = {
      nom: form.value.nom,
      adresse: form.value.adresse,
      client_id: clientId.value,
      technicien: '',
      zones: zones.value,
      modalita_prezzi: 'prezziFissi',
      use_listino_vip: true,
      vip_type_pose: form.value.typePose,
      produits: JSON.parse(JSON.stringify(devisItems.value)),
      total: devisTotal.value,
      draft: asDraft,
      status: asDraft ? 'Brouillon' : 'En attente',
      updated_at: new Date().toISOString()
    };

    if (editingId.value) {
      await supabase.from('devis').update(devisData).eq('id', editingId.value);
    } else {
      devisData.numero = `VIP-${Date.now().toString().slice(-6)}`;
      devisData.created_at = new Date().toISOString();
      await supabase.from('devis').insert(devisData);
    }

    alert(asDraft ? 'Brouillon sauvegardé.' : 'Devis envoyé pour validation!');
    router.push('/client');
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
};
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>
