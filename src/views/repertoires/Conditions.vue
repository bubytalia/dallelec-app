<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Conditions de Vente</h2>

    <!-- Formulaire d'ajout d'une nouvelle condition -->
    <div class="row mb-3 justify-content-center">
      <div class="col-md-4">
        <input
          v-model="newCondition.texte"
          placeholder="Texte de la condition"
          class="form-control mb-2"
        />
      </div>
      <div class="col-md-2">
        <select v-model="newCondition.type" class="form-select mb-2">
          <option disabled value="">Type</option>
          <option value="generales">Conditions générales</option>
          <option value="comprend">Comprend</option>
          <option value="ne_comprend_pas">Ne comprend pas</option>
        </select>
      </div>
      <div class="col-md-2 d-flex align-items-center">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            v-model="newCondition.default"
            id="newDefault"
          />
          <label class="form-check-label" for="newDefault">Actif</label>
        </div>
      </div>
    </div>

    <div class="text-center mb-4">
      <button @click="addCondition" class="btn btn-primary">Ajouter</button>
    </div>

    <!-- Tableau des conditions existantes -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Texte</th>
          <th>Type</th>
          <th>Par défaut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cond in conditions" :key="cond.id">
          <template v-if="editId === cond.id">
            <td><input v-model="editCondition.texte" class="form-control" /></td>
            <td>
              <select v-model="editCondition.type" class="form-select">
                <option value="generales">Conditions générales</option>
                <option value="comprend">Comprend</option>
                <option value="ne_comprend_pas">Ne comprend pas</option>
              </select>
            </td>
            <td class="text-center">
              <input type="checkbox" class="form-check-input" v-model="editCondition.default" />
            </td>
            <td>
              <button class="btn btn-success btn-sm me-1" @click="updateCondition(cond.id)">✔</button>
              <button class="btn btn-secondary btn-sm" @click="cancelEdit">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ cond.nom }}</td>
            <td>{{ 
              cond.type === 'generales' ? 'Conditions générales' : 
              cond.type === 'comprend' ? 'Comprend' : 'Ne comprend pas' 
            }}</td>
            <td class="text-center">
              <span v-if="cond.active">✔</span>
            </td>
            <td>
              <button class="btn btn-warning btn-sm me-1" @click="startEdit(cond)">✎</button>
              <button class="btn btn-danger btn-sm" @click="deleteCondition(cond.id)">🗑</button>
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
  name: 'Conditions',
  components: {
    RetourButton
  },
  setup() {
    const conditions = ref([]);
    const newCondition = ref({ texte: '', type: '', default: false });

    const editId = ref(null);
    const editCondition = ref({ texte: '', type: '', default: false });

    const fetchConditions = async () => {
      try {
        const { data, error } = await supabase
          .from('conditions')
          .select('*')
          .order('ordre');
        
        if (error) throw error;
        conditions.value = data || [];
      } catch (error) {
        console.error('Errore caricamento condizioni:', error);
      }
    };

    const addCondition = async () => {
      if (newCondition.value.texte.trim() && newCondition.value.type) {
        try {
          const { error } = await supabase
            .from('conditions')
            .insert({
              nom: newCondition.value.texte,
              description: newCondition.value.texte,
              type: newCondition.value.type,
              active: newCondition.value.default
            });
          
          if (error) throw error;
          newCondition.value = { texte: '', type: '', default: false };
          fetchConditions();
        } catch (error) {
          console.error('Errore aggiunta condizione:', error);
        }
      }
    };

    const startEdit = (cond) => {
      editId.value = cond.id;
      editCondition.value = {
        texte: cond.texte,
        type: cond.type,
        default: cond.default || false
      };
    };

    const cancelEdit = () => {
      editId.value = null;
      editCondition.value = { texte: '', type: '', default: false };
    };

    const updateCondition = async (id) => {
      try {
        const { error } = await supabase
          .from('conditions')
          .update({
            nom: editCondition.value.texte,
            description: editCondition.value.texte,
            type: editCondition.value.type,
            active: editCondition.value.default
          })
          .eq('id', id);
        
        if (error) throw error;
        cancelEdit();
        fetchConditions();
      } catch (error) {
        console.error('Errore aggiornamento condizione:', error);
      }
    };

    const deleteCondition = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        try {
          const { error } = await supabase
            .from('conditions')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          fetchConditions();
        } catch (error) {
          console.error('Errore eliminazione condizione:', error);
        }
      }
    };

    onMounted(fetchConditions);

    return {
      conditions,
      newCondition,
      addCondition,
      editId,
      editCondition,
      startEdit,
      cancelEdit,
      updateCondition,
      deleteCondition
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: auto;
}
.table {
  margin-top: 30px;
}
</style>