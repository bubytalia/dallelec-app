<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Modalités de Paiement</h2>

    <div class="row mb-3 justify-content-center">
      <div class="col-md-4">
        <input v-model="newPaiement.nom" placeholder="Nom du mode de paiement" class="form-control" />
      </div>
      <div class="col-md-2">
        <input v-model="newPaiement.giorni_calcolo" type="number" placeholder="Jours" class="form-control" />
      </div>
    </div>

    <div class="text-center mb-4">
      <button @click="addPaiement" class="btn btn-primary">Ajouter</button>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Jours</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in paiements" :key="p.id">
          <template v-if="editId === p.id">
            <td><input v-model="editPaiement.nom" class="form-control" /></td>
            <td><input v-model="editPaiement.giorni_calcolo" type="number" class="form-control" style="width:80px" /></td>
            <td>
              <button class="btn btn-success btn-sm me-1" @click="updatePaiement(p.id)">✔</button>
              <button class="btn btn-secondary btn-sm" @click="cancelEdit">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ p.nom }}</td>
            <td>{{ p.giorni_calcolo || 30 }}</td>
            <td>
              <button class="btn btn-warning btn-sm me-1" @click="startEdit(p)">✎</button>
              <button class="btn btn-danger btn-sm" @click="deletePaiement(p.id)">🗑</button>
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
  name: 'Paiements',
  components: {
    RetourButton
  },
  setup() {
    const paiements = ref([]);
    const newPaiement = ref({ nom: '', giorni_calcolo: 30 });

    const editId = ref(null);
    const editPaiement = ref({ nom: '', giorni_calcolo: 30 });

    const fetchPaiements = async () => {
      const { data, error } = await supabase.from('paiements').select('id, nom, giorni_calcolo').order('nom');
      if (!error) {
        paiements.value = data || [];
        console.log('Paiements caricati:', data);
      } else {
        console.error('Errore caricamento paiements:', error);
      }
    };

    const addPaiement = async () => {
      if (newPaiement.value.nom.trim()) {
        const { error } = await supabase.from('paiements').insert([newPaiement.value]);
        if (!error) {
          newPaiement.value = { nom: '', giorni_calcolo: 30 };
          fetchPaiements();
        }
      }
    };

    const startEdit = (paiement) => {
      editId.value = paiement.id;
      editPaiement.value = { nom: paiement.nom, giorni_calcolo: paiement.giorni_calcolo || 30 };
    };

    const cancelEdit = () => {
      editId.value = null;
      editPaiement.value = { nom: '', giorni_calcolo: 30 };
    };

    const updatePaiement = async (id) => {
      const dataToUpdate = {
        nom: editPaiement.value.nom,
        giorni_calcolo: parseInt(editPaiement.value.giorni_calcolo) || 0
      };
      console.log('Aggiornamento paiement:', id, dataToUpdate);
      const { error } = await supabase.from('paiements').update(dataToUpdate).eq('id', id);
      if (!error) {
        console.log('Aggiornamento riuscito');
        cancelEdit();
        fetchPaiements();
      } else {
        console.error('Errore aggiornamento:', error);
      }
    };

    const deletePaiement = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        const { error } = await supabase.from('paiements').delete().eq('id', id);
        if (!error) fetchPaiements();
      }
    };

    onMounted(fetchPaiements);

    return {
      paiements,
      newPaiement,
      addPaiement,
      editId,
      editPaiement,
      startEdit,
      cancelEdit,
      updatePaiement,
      deletePaiement
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: auto;
}
.table {
  margin-top: 30px;
}
</style>
