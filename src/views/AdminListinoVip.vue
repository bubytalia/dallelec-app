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

    <!-- Tabella completa catalogo con prezzi VIP -->
    <div v-if="selectedClient" class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Catalogue complet ({{ catalogueWithPrices.length }} produits)</h5>
        <div class="d-flex gap-2 align-items-center">
          <input v-model="searchFilter" type="text" class="form-control form-control-sm" placeholder="Rechercher..." style="width:200px" />
          <button class="btn btn-sm btn-success" @click="saveAll" :disabled="saving">{{ saving ? 'Sauvegarde...' : '💾 Sauvegarder tout' }}</button>
        </div>
      </div>
      <div class="card-body table-responsive" style="max-height:70vh;overflow-y:auto">
        <table class="table table-sm table-hover">
          <thead class="table-light sticky-top">
            <tr>
              <th>Article</th>
              <th>Description</th>
              <th>Taille</th>
              <th class="text-end">Prix catalogue</th>
              <th class="text-end">Prix Béton</th>
              <th class="text-end">Prix DIN</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredCatalogue" :key="item.article" :class="{'table-success': item.prix_beton > 0 || item.prix_din > 0}">
              <td><strong>{{ item.article }}</strong></td>
              <td>{{ item.description }}</td>
              <td>{{ item.taille }}</td>
              <td class="text-end text-muted">{{ item.prix_catalogue.toFixed(2) }}</td>
              <td class="text-end">
                <input v-model.number="item.prix_beton" type="number" step="0.01" min="0" class="form-control form-control-sm text-end" style="width:100px;display:inline" />
              </td>
              <td class="text-end">
                <input v-model.number="item.prix_din" type="number" step="0.01" min="0" class="form-control form-control-sm text-end" style="width:100px;display:inline" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
const searchFilter = ref('');
const saving = ref(false);

const vipClients = computed(() => allClients.value.filter(c => c.vip));
const nonVipClients = computed(() => allClients.value.filter(c => !c.vip));

// Catalogo completo con prezzi VIP mergiati
const catalogueWithPrices = computed(() => {
  return produits.value.map(p => {
    const vipItem = listino.value.find(l => l.article === p.article);
    return {
      article: p.article,
      description: p.description || p.nom || '',
      taille: p.taille || '',
      prix_catalogue: Number(p.prix) || 0,
      prix_beton: vipItem ? vipItem.prix_beton : 0,
      prix_din: vipItem ? vipItem.prix_din : 0,
      vip_id: vipItem ? vipItem.id : null
    };
  });
});

const filteredCatalogue = computed(() => {
  if (!searchFilter.value) return catalogueWithPrices.value;
  const s = searchFilter.value.toLowerCase();
  return catalogueWithPrices.value.filter(p =>
    p.article.toLowerCase().includes(s) ||
    p.description.toLowerCase().includes(s) ||
    p.taille.toLowerCase().includes(s)
  );
});

onMounted(async () => {
  const [clientsRes, produitsRes] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('produits').select('*').order('article')
  ]);
  allClients.value = clientsRes.data || [];
  produits.value = (produitsRes.data || []).map(p => ({ ...p, description: p.description || p.nom || '' }));
});

const loadListino = async () => {
  if (!selectedClient.value) { listino.value = []; return; }
  const { data } = await supabase.from('listino_vip').select('*').eq('client_id', selectedClient.value);
  listino.value = data || [];
};

const saveAll = async () => {
  saving.value = true;
  try {
    const toUpsert = catalogueWithPrices.value.filter(p => p.prix_beton > 0 || p.prix_din > 0);
    const toDelete = catalogueWithPrices.value.filter(p => p.vip_id && p.prix_beton === 0 && p.prix_din === 0);

    // Delete items with both prices at 0
    for (const item of toDelete) {
      await supabase.from('listino_vip').delete().eq('id', item.vip_id);
    }

    // Upsert items with prices
    for (const item of toUpsert) {
      if (item.vip_id) {
        await supabase.from('listino_vip').update({
          prix_beton: item.prix_beton,
          prix_din: item.prix_din,
          updated_at: new Date().toISOString()
        }).eq('id', item.vip_id);
      } else {
        await supabase.from('listino_vip').insert({
          client_id: selectedClient.value,
          article: item.article,
          description: item.description,
          prix_beton: item.prix_beton,
          prix_din: item.prix_din
        });
      }
    }

    await loadListino();
    alert(`Sauvegardé! ${toUpsert.length} produits avec prix, ${toDelete.length} supprimés.`);
  } catch (error) {
    alert('Erreur: ' + error.message);
  } finally {
    saving.value = false;
  }
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
.sticky-top {
  position: sticky; top: 0; z-index: 1;
}
</style>
