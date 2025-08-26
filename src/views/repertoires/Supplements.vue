<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Suppléments</h2>

    <form @submit.prevent="addSupplement" class="row g-3 mb-4 justify-content-center">
      <div class="col-md-5">
        <input v-model="newSupplement.nom" placeholder="Nom du supplément" class="form-control" required />
      </div>
      <div class="col-md-3">
        <input v-model.number="newSupplement.valeur" placeholder="Valeur (mètres)" type="number" step="0.01" class="form-control" required />
      </div>
      <div class="col-md-2">
        <input v-model.number="newSupplement.ordre" placeholder="Ordre" type="number" class="form-control" min="0" />
      </div>
      <div class="col-12 text-center">
        <button type="submit" class="btn btn-primary">Ajouter</button>
      </div>
    </form>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Valeur (m)</th>
          <th>Ordre</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="supp in supplements" :key="supp.id">
          <td v-if="editId !== supp.id">{{ supp.nom }}</td>
          <td v-else><input v-model="editData.nom" class="form-control" /></td>

          <td v-if="editId !== supp.id">{{ supp.valeur }}</td>
          <td v-else><input v-model.number="editData.valeur" type="number" step="0.01" class="form-control" /></td>

          <td v-if="editId !== supp.id">{{ supp.ordre || 0 }}</td>
          <td v-else><input v-model.number="editData.ordre" type="number" class="form-control" min="0" /></td>

          <td>
            <button v-if="editId !== supp.id" @click="startEdit(supp)" class="btn btn-sm btn-warning me-1">✏️</button>
            <button v-else @click="confirmEdit(supp.id)" class="btn btn-sm btn-success me-1">💾</button>
            <button @click="deleteSupplement(supp.id)" class="btn btn-sm btn-danger">🗑️</button>
          </td>
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
  name: 'Supplements',
  components: {
    RetourButton
  },
  setup() {
    const supplements = ref([]);
    const newSupplement = ref({ nom: '', valeur: null, ordre: 0 });
    const editId = ref(null);
    const editData = ref({ nom: '', valeur: null, ordre: 0 });

    const fetchSupplements = async () => {
      const { data, error } = await supabase
        .from('supplements')
        .select('*')
        .order('ordre');
      
      if (error) {
        console.error('Errore caricamento supplements:', error);
      } else {
        supplements.value = data || [];
      }
    };

    const addSupplement = async () => {
      if (!newSupplement.value.nom || newSupplement.value.valeur === null) return;
      
      const { error } = await supabase
        .from('supplements')
        .insert([{
          nom: newSupplement.value.nom,
          valeur: newSupplement.value.valeur,
          ordre: newSupplement.value.ordre || 0
        }]);
      
      if (error) {
        console.error('Errore aggiunta supplement:', error);
      } else {
        newSupplement.value = { nom: '', valeur: null, ordre: 0 };
        fetchSupplements();
      }
    };

    const deleteSupplement = async (id) => {
      const { error } = await supabase
        .from('supplements')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Errore eliminazione supplement:', error);
      } else {
        fetchSupplements();
      }
    };

    const startEdit = (supp) => {
      editId.value = supp.id;
      editData.value = { nom: supp.nom, valeur: supp.valeur, ordre: supp.ordre || 0 };
    };

    const confirmEdit = async (id) => {
      const { error } = await supabase
        .from('supplements')
        .update({
          nom: editData.value.nom,
          valeur: editData.value.valeur,
          ordre: editData.value.ordre || 0
        })
        .eq('id', id);
      
      if (error) {
        console.error('Errore aggiornamento supplement:', error);
      } else {
        editId.value = null;
        editData.value = { nom: '', valeur: null, ordre: 0 };
        fetchSupplements();
      }
    };

    onMounted(fetchSupplements);

    return {
      supplements,
      newSupplement,
      addSupplement,
      editId,
      editData,
      startEdit,
      confirmEdit,
      deleteSupplement
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
