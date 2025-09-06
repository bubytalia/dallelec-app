<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Produits</h2>
    
    <!-- Avviso integrità dati -->
    <div class="alert alert-info mb-4">
      <strong>📊 Integrità dati:</strong> Le modifiche ai prezzi non influenzeranno i devis già salvati. 
      I prezzi storici rimangono congelati per mantenere l'integrità commerciale.
    </div>
    <div class="row mb-3">
      <div class="col">
        <input v-model="newProduit.article" placeholder="Article" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newProduit.taille" placeholder="Taille" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newProduit.description" placeholder="Description" class="form-control" />
      </div>
    </div>
    <div class="row mb-3">
      <div class="col">
        <select v-model="newProduit.unite" class="form-control">
          <option disabled value="">Unité</option>
          <option value="m">m</option>
          <option value="pc">pc</option>
          <option value="h">h</option>
        </select>
      </div>
      <div class="col">
        <input v-model="newProduit.prix" placeholder="Prix unitaire" class="form-control" type="number" />
      </div>
      <div class="col">
        <div class="form-check">
          <input v-model="newProduit.prezzoNetto" class="form-check-input" type="checkbox" id="prezzoNetto">
          <label class="form-check-label" for="prezzoNetto">
            💰 Prix net (pas de remise)
          </label>
        </div>
      </div>
    </div>
    <div class="text-center mb-4">
      <button @click="addProduit" class="btn btn-primary">Ajouter</button>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Article</th>
          <th>Taille</th>
          <th>Description</th>
          <th>Unité</th>
          <th>Prix</th>
          <th>Prix Net</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="prod in produits" :key="prod.id">
          <template v-if="editId === prod.id">
            <td><input v-model="editProduit.article" class="form-control" /></td>
            <td><input v-model="editProduit.taille" class="form-control" /></td>
            <td><input v-model="editProduit.description" class="form-control" /></td>
            <td>
              <select v-model="editProduit.unite" class="form-control">
                <option disabled value="">Unité</option>
                <option value="m">m</option>
                <option value="pc">pc</option>
                <option value="h">h</option>
              </select>
            </td>
            <td><input v-model="editProduit.prix" class="form-control" type="number" /></td>
            <td>
              <div class="form-check">
                <input v-model="editProduit.prezzoNetto" class="form-check-input" type="checkbox">
                <label class="form-check-label">Prix net</label>
              </div>
            </td>
            <td>
              <button @click="updateProduit(prod.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ prod.article }}</td>
            <td>{{ prod.taille }}</td>
            <td>{{ prod.description }}</td>
            <td>{{ prod.unite }}</td>
            <td>{{ prod.prix }}</td>
            <td>
              <span v-if="prod.prezzo_netto" class="badge bg-warning">💰 Prix net</span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <button @click="startEdit(prod)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteProduit(prod.id)" class="btn btn-danger btn-sm">🗑</button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

export default {
  name: 'Produits',
  components: {
    RetourButton
  },
  setup() {
    const produits = ref([]);
    const newProduit = ref({
      article: '',
      taille: '',
      description: '',
      unite: '',
      prix: '',
      prezzoNetto: false
    });

    const editId = ref(null);
    const editProduit = ref({});

    const fetchProduits = async () => {
      try {
        const { data, error } = await supabase
          .from('produits')
          .select('*')
          .order('article');
        
        if (error) throw error;
        produits.value = data || [];
      } catch (error) {
        console.error('Errore caricamento produits:', error);
      }
    };

    const addProduit = async () => {
      try {
        const { error } = await supabase
          .from('produits')
          .insert({
            article: newProduit.value.article,
            taille: newProduit.value.taille,
            description: newProduit.value.description,
            unite: newProduit.value.unite,
            prix: parseFloat(newProduit.value.prix),
            prezzo_netto: newProduit.value.prezzoNetto
          });
        
        if (error) throw error;
        newProduit.value = { article: '', taille: '', description: '', unite: '', prix: '', prezzoNetto: false };
        fetchProduits();
      } catch (error) {
        console.error('Errore aggiunta produit:', error);
      }
    };

    const startEdit = (prod) => {
      editId.value = prod.id;
      editProduit.value = { 
        ...prod,
        prezzoNetto: prod.prezzo_netto
      };
    };

    const cancelEdit = () => {
      editId.value = null;
      editProduit.value = {};
    };

    const updateProduit = async (id) => {
      if (confirm('Confermi la modifica? I devis già salvati manterranno i prezzi originali.')) {
        try {
          const { error } = await supabase
            .from('produits')
            .update({
              article: editProduit.value.article,
              taille: editProduit.value.taille,
              description: editProduit.value.description,
              unite: editProduit.value.unite,
              prix: parseFloat(editProduit.value.prix),
              prezzo_netto: editProduit.value.prezzoNetto || editProduit.value.prezzo_netto
            })
            .eq('id', id);
          
          if (error) throw error;
          cancelEdit();
          fetchProduits();
        } catch (error) {
          console.error('Errore aggiornamento produit:', error);
        }
      }
    };

    const deleteProduit = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        try {
          const { error } = await supabase
            .from('produits')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          fetchProduits();
        } catch (error) {
          console.error('Errore eliminazione produit:', error);
        }
      }
    };

    onMounted(fetchProduits);

    return {
      produits,
      newProduit,
      addProduit,
      editId,
      editProduit,
      startEdit,
      cancelEdit,
      updateProduit,
      deleteProduit
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: auto;
}
.table {
  margin-top: 30px;
}
</style>
