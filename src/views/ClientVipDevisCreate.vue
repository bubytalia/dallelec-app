<template>
  <div class="container py-4">
    <button class="btn btn-outline-secondary mb-3" @click="$router.push('/client')">← Retour</button>
    
    <h2 class="text-center mb-4">{{ editingId ? 'Modifier le Devis' : 'Nouveau Devis' }}</h2>

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
          <input v-model="newZone" @keyup.enter="addZone" class="form-control" placeholder="Ajouter une zone" />
          <button class="btn btn-primary" @click="addZone" :disabled="!newZone.trim()">Ajouter</button>
        </div>
        <span v-for="(zone, i) in form.zones" :key="i" class="badge bg-primary me-2">
          {{ zone }} <span class="ms-1 cursor-pointer" @click="form.zones.splice(i, 1)">&times;</span>
        </span>
      </div>
      <button class="btn btn-success" :disabled="!step1Valid" @click="step = 2">Continuer →</button>
    </div>

    <!-- Step 2: Produits -->
    <div v-if="step === 2">
      <div class="alert alert-info text-center mb-3">
        <strong>{{ form.nom }}</strong> — Pose: <strong>{{ form.typePose === 'din' ? 'DIN' : 'Béton' }}</strong>
      </div>

      <!-- Formulaire ajout produit -->
      <div class="card p-3 mb-4">
        <h5>Ajouter un produit</h5>
        <div class="row g-2 align-items-end">
          <div class="col-md-4">
            <label class="form-label">Produit</label>
            <input v-model="searchText" @focus="showDropdown = true" @blur="hideDropdown" type="text" class="form-control" placeholder="Rechercher..." autocomplete="off" />
            <div v-if="showDropdown && filteredProduits.length > 0" class="dropdown-menu show w-100" style="max-height:250px;overflow-y:auto;position:absolute;z-index:1050">
              <button v-for="p in filteredProduits.slice(0, 50)" :key="p.article" @mousedown="selectProduit(p)" class="dropdown-item" type="button">
                <strong>{{ p.article }}</strong> - {{ p.description }} ({{ p.taille }}) — {{ getPrix(p).toFixed(2) }} CHF
              </button>
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
          <div class="col-md-3">
            <label class="form-label">Suppléments</label>
            <div v-for="sup in supplements" :key="sup.id" class="d-flex align-items-center mb-1">
              <input type="checkbox" :value="sup.nom" v-model="newItem.selectedSupplements" class="form-check-input me-1" />
              <span class="me-1" style="font-size:0.85em">{{ sup.nom }}</span>
              <input v-if="newItem.selectedSupplements.includes(sup.nom)" v-model.number="newItem.suppQty[sup.nom]" type="number" min="0" class="form-control form-control-sm" style="width:60px" />
            </div>
          </div>
          <div class="col-md-2">
            <button class="btn btn-primary w-100" @click="addItem" :disabled="!newItem.article || !newItem.zone">Ajouter</button>
          </div>
        </div>
      </div>

      <!-- Tableau produits -->
      <div class="card mb-4">
        <div class="card-header"><h5 class="mb-0">Produits du devis ({{ devisItems.length }})</h5></div>
        <div class="card-body table-responsive">
          <table v-if="devisItems.length > 0" class="table table-sm">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Article</th>
                <th>Description</th>
                <th>Taille</th>
                <th class="text-end">Qté</th>
                <th class="text-end">Suppl.</th>
                <th class="text-end">Total ML</th>
                <th class="text-end">Prix</th>
                <th class="text-end">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in devisItems" :key="idx">
                <td>{{ item.zone }}</td>
                <td>{{ item.article }}</td>
                <td>{{ item.nom }}</td>
                <td>{{ item.taille }}</td>
                <td class="text-end">{{ item.ml }}</td>
                <td class="text-end">{{ item.totalSuppML.toFixed(1) }}</td>
                <td class="text-end">{{ item.totalML.toFixed(1) }}</td>
                <td class="text-end">{{ item.prix.toFixed(2) }}</td>
                <td class="text-end fw-bold">{{ item.total.toFixed(2) }}</td>
                <td><button class="btn btn-sm btn-outline-danger" @click="devisItems.splice(idx, 1)">🗑</button></td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="8" class="text-end fw-bold">Total HT:</td>
                <td class="text-end fw-bold">{{ totalDevis.toFixed(2) }} CHF</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          <p v-else class="text-muted text-center">Aucun produit ajouté.</p>
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-secondary" @click="step = 1">← Retour</button>
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
const newItem = ref({ article: '', zone: '', ml: 0, selectedSupplements: [], suppQty: {} });

// Lettere permesse: A-L + Z
const allowedLetters = 'ABCDEFGHIJKLZ';

const step1Valid = computed(() => form.value.nom && form.value.adresse && form.value.zones.length > 0);

const totalDevis = computed(() => devisItems.value.reduce((sum, i) => sum + i.total, 0));

const filteredProduits = computed(() => {
  const list = produits.value.filter(p => {
    const firstChar = (p.article || '').charAt(0).toUpperCase();
    return allowedLetters.includes(firstChar);
  }).filter(p => {
    // Solo prodotti con prezzo VIP > 0
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

const addItem = () => {
  const p = newItem.value._produit;
  if (!p) return;

  const prix = getPrix(p);
  const suppDetails = newItem.value.selectedSupplements.map(nom => {
    const sup = supplements.value.find(s => s.nom === nom);
    const qte = newItem.value.suppQty[nom] || 0;
    return { supplement: nom, valeur: sup?.valeur || 0, qte, qteTotale: qte * (sup?.valeur || 0) };
  });
  const totalSuppML = suppDetails.reduce((sum, s) => sum + s.qteTotale, 0);
  const totalML = newItem.value.ml + totalSuppML;

  devisItems.value.push({
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
  });

  // Reset
  newItem.value = { article: '', zone: newItem.value.zone, ml: 0, selectedSupplements: [], suppQty: {} };
  searchText.value = '';
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingId.value) {
      const { error } = await supabase.from('devis').update(devisData).eq('id', editingId.value);
      if (error) throw error;
    } else {
      devisData.numero = `VIP-${Date.now().toString().slice(-6)}`;
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

  // Si édition, charger le devis
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
</style>
