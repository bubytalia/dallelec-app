<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    <h2 class="text-center mb-4">Listino VIP - Prix Réservés</h2>

    <!-- Selezione cliente VIP -->
    <div class="row mb-4">
      <div class="col-md-6 mx-auto">
        <div class="card">
          <div class="card-header"><h5>Client VIP</h5></div>
          <div class="card-body">
            <select v-model="selectedClient" class="form-select mb-3" @change="loadListino">
              <option value="">Sélectionner un client VIP</option>
              <option v-for="c in vipClients" :key="c.id" :value="c.id">{{ c.nom }}</option>
            </select>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-success" @click="showAddVipModal = true">+ Ajouter client VIP</button>
              <button v-if="selectedClient" class="btn btn-sm btn-outline-danger" @click="removeVipFlag">Retirer VIP</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ajout produit au listino -->
    <div v-if="selectedClient" class="card mb-4">
      <div class="card-header"><h5>Ajouter un produit au listino</h5></div>
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-md-4">
            <label class="form-label">Produit</label>
            <select v-model="newItem.article" class="form-select" @change="onProduitSelect">
              <option value="">Sélectionner...</option>
              <option v-for="p in availableProduits" :key="p.article" :value="p.article">
                {{ p.article }} - {{ p.description || p.nom }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Prix Béton (CHF)</label>
            <input v-model.number="newItem.prix_beton" type="number" step="0.01" class="form-control" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Prix DIN (CHF)</label>
            <input v-model.number="newItem.prix_din" type="number" step="0.01" class="form-control" />
          </div>
          <div class="col-md-2">
            <button class="btn btn-primary w-100" @click="addItem" :disabled="!newItem.article">Ajouter</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabella listino -->
    <div v-if="selectedClient && listino.length > 0" class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Listino ({{ listino.length }} produits)</h5>
        <button class="btn btn-sm btn-outline-secondary" @click="importFromCatalogue">📥 Importer tout le catalogue</button>
      </div>
      <div class="card-body table-responsive">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Article</th>
              <th>Description</th>
              <th class="text-end">Prix Béton</th>
              <th class="text-end">Prix DIN</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in listino" :key="item.id">
              <td>{{ item.article }}</td>
              <td>{{ item.description }}</td>
              <td class="text-end">
                <input v-model.number="item.prix_beton" type="number" step="0.01" class="form-control form-control-sm text-end" style="width:100px;display:inline" @change="updateItem(item)" />
              </td>
              <td class="text-end">
                <input v-model.number="item.prix_din" type="number" step="0.01" class="form-control form-control-sm text-end" style="width:100px;display:inline" @change="updateItem(item)" />
              </td>
              <td>
                <button class="btn btn-sm btn-outline-danger" @click="deleteItem(item)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="selectedClient && listino.length === 0" class="alert alert-info text-center">
      Aucun produit dans le listino pour ce client.
    </div>

    <!-- Modal ajout client VIP -->
    <div v-if="showAddVipModal" class="modal-overlay" @click.self="showAddVipModal = false">
      <div class="modal-box">
        <h5>Sélectionner un client à marquer VIP</h5>
        <select v-model="newVipClientId" class="form-select mb-3">
          <option value="">Choisir...</option>
          <option v-for="c in nonVipClients" :key="c.id" :value="c.id">{{ c.nom }}</option>
        </select>
        <div class="d-flex gap-2 justify-content-end">
          <button class="btn btn-secondary" @click="showAddVipModal = false">Annuler</button>
          <button class="btn btn-success" @click="addVipClient" :disabled="!newVipClientId">Confirmer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/supabase';
import RetourButton from '@/components/RetourButton.vue';

const allClients = ref([]);
const produits = ref([]);
const selectedClient = ref('');
const listino = ref([]);
const showAddVipModal = ref(false);
const newVipClientId = ref('');
const newItem = ref({ article: '', description: '', prix_beton: 0, prix_din: 0 });

const vipClients = computed(() => allClients.value.filter(c => c.vip));
const nonVipClients = computed(() => allClients.value.filter(c => !c.vip));
const availableProduits = computed(() => {
  const existing = listino.value.map(l => l.article);
  return produits.value.filter(p => !existing.includes(p.article));
});

onMounted(async () => {
  const [clientsRes, produitsRes] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('produits').select('*')
  ]);
  allClients.value = clientsRes.data || [];
  produits.value = (produitsRes.data || []).map(p => ({ ...p, description: p.description || p.nom || '' }));
});

const loadListino = async () => {
  if (!selectedClient.value) { listino.value = []; return; }
  const { data } = await supabase.from('listino_vip').select('*').eq('client_id', selectedClient.value).order('article');
  listino.value = data || [];
};

const onProduitSelect = () => {
  const p = produits.value.find(pr => pr.article === newItem.value.article);
  if (p) newItem.value.description = p.description || p.nom || '';
};

const addItem = async () => {
  const { error } = await supabase.from('listino_vip').insert({
    client_id: selectedClient.value,
    article: newItem.value.article,
    description: newItem.value.description,
    prix_beton: newItem.value.prix_beton,
    prix_din: newItem.value.prix_din
  });
  if (error) { alert('Erreur: ' + error.message); return; }
  newItem.value = { article: '', description: '', prix_beton: 0, prix_din: 0 };
  await loadListino();
};

const updateItem = async (item) => {
  await supabase.from('listino_vip').update({ prix_beton: item.prix_beton, prix_din: item.prix_din, updated_at: new Date().toISOString() }).eq('id', item.id);
};
};

const deleteItem = async (item) => {
  if (!confirm('Supprimer ce produit du listino?')) return;
  await supabase.from('listino_vip').delete().eq('id', item.id);
  await loadListino();
};

const importFromCatalogue = async () => {
  if (!confirm(`Importer ${availableProduits.value.length} produits du catalogue avec prix à 0? Vous pourrez ensuite modifier les prix.`)) return;
  const items = availableProduits.value.map(p => ({
    client_id: selectedClient.value,
    article: p.article,
    description: p.description || p.nom || '',
    prix_beton: 0,
    prix_din: 0
  }));
  if (items.length > 0) {
    const { error } = await supabase.from('listino_vip').insert(items);
    if (error) { alert('Erreur: ' + error.message); return; }
  }
  await loadListino();
};

const addVipClient = async () => {
  await supabase.from('clients').update({ vip: true }).eq('id', newVipClientId.value);
  allClients.value = allClients.value.map(c => c.id === newVipClientId.value ? { ...c, vip: true } : c);
  selectedClient.value = newVipClientId.value;
  showAddVipModal.value = false;
  newVipClientId.value = '';
  await loadListino();
};

const removeVipFlag = async () => {
  if (!confirm('Retirer le statut VIP de ce client?')) return;
  await supabase.from('clients').update({ vip: false }).eq('id', selectedClient.value);
  allClients.value = allClients.value.map(c => c.id === selectedClient.value ? { ...c, vip: false } : c);
  selectedClient.value = '';
  listino.value = [];
};
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.modal-box {
  background: white; border-radius: 10px; padding: 20px; width: 400px; max-width: 90vw;
}
</style>
