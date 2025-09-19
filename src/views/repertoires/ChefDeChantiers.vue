<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Chefs de Chantiers</h2>

    <form @submit.prevent="addChef" class="row g-3 mb-4">
      <div class="col-md-4">
        <input v-model="newChef.nom" type="text" class="form-control" placeholder="Nom" required />
      </div>
      <div class="col-md-4">
        <input v-model="newChef.prenom" type="text" class="form-control" placeholder="Prénom" required />
      </div>
      <div class="col-md-4">
        <input v-model="newChef.telephone" type="text" class="form-control" placeholder="Téléphone" required />
      </div>
      <div class="col-md-4">
        <input v-model="newChef.email" type="email" class="form-control" placeholder="Email" required />
      </div>
      <div class="col-md-4">
        <select v-model="newChef.etat" class="form-select" required>
          <option disabled value="">Sélectionner l'état</option>
          <option value="direct">Direct</option>
          <option value="interimaire">Intérimaire</option>
        </select>
      </div>
      <div class="col-md-4">
        <input v-model.number="newChef.coutHoraire" type="number" class="form-control" placeholder="Coût horaire (€)" required />
      </div>
      <div class="col-md-4">
        <div class="form-check">
          <input v-model="newChef.excludeFromReport" type="checkbox" class="form-check-input" id="excludeNewChef">
          <label class="form-check-label" for="excludeNewChef">Exclure du rapport mensuel</label>
        </div>
      </div>
      <div class="col-12 text-end">
        <button type="submit" class="btn btn-primary">Ajouter</button>
      </div>
    </form>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Prénom</th>
          <th>Téléphone</th>
          <th>Email</th>
          <th>État</th>
          <th>Coût horaire</th>
          <th>Exclu rapport</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="chef in chefs" :key="chef.id">
          <template v-if="editId === chef.id">
            <td><input v-model="editChef.nom" class="form-control" /></td>
            <td><input v-model="editChef.prenom" class="form-control" /></td>
            <td><input v-model="editChef.telephone" class="form-control" /></td>
            <td><input v-model="editChef.email" class="form-control" /></td>
            <td>
              <select v-model="editChef.etat" class="form-select">
                <option value="direct">Direct</option>
                <option value="interimaire">Intérimaire</option>
              </select>
            </td>
            <td><input v-model.number="editChef.coutHoraire" class="form-control" /></td>
            <td>
              <input v-model="editChef.excludeFromReport" type="checkbox" class="form-check-input">
            </td>
            <td>
              <button @click="updateChef(chef.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ chef.nom }}</td>
            <td>{{ chef.prenom }}</td>
            <td>{{ chef.telephone }}</td>
            <td>{{ chef.email }}</td>
            <td>{{ chef.etat }}</td>
            <td>{{ chef.cout_horaire || chef.coutHoraire }} €</td>
            <td>
              <span v-if="chef.exclude_from_report || chef.excludeFromReport" class="badge bg-warning">⚠️ Exclu</span>
              <span v-else class="badge bg-success">✓ Inclus</span>
            </td>
            <td>
              <button @click="startEdit(chef)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteChef(chef.id)" class="btn btn-danger btn-sm">🗑</button>
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
  name: 'ChefDeChantiers',
  components: {
    RetourButton
  },
  setup() {
    const chefs = ref([]);
    const newChef = ref({
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      etat: '',
      coutHoraire: null,
      excludeFromReport: false
    });

    const editId = ref(null);
    const editChef = ref({});

    const fetchChefs = async () => {
      const { data, error } = await supabase.from('chefdechantiers').select('*').order('nom');
      if (!error) chefs.value = data || [];
    };

    const addChef = async () => {
      const { error } = await supabase.from('chefdechantiers').insert([{
        nom: newChef.value.nom,
        prenom: newChef.value.prenom,
        telephone: newChef.value.telephone,
        email: newChef.value.email,
        etat: newChef.value.etat,
        cout_horaire: newChef.value.coutHoraire,
        exclude_from_report: newChef.value.excludeFromReport
      }]);
      if (!error) {
        newChef.value = { nom: '', prenom: '', telephone: '', email: '', etat: '', coutHoraire: null, excludeFromReport: false };
        fetchChefs();
      }
    };

    const startEdit = (chef) => {
      editId.value = chef.id;
      editChef.value = { ...chef };
    };

    const cancelEdit = () => {
      editId.value = null;
      editChef.value = {};
    };

    const updateChef = async (id) => {
      const { error } = await supabase.from('chefdechantiers').update({
        nom: editChef.value.nom,
        prenom: editChef.value.prenom,
        telephone: editChef.value.telephone,
        email: editChef.value.email,
        etat: editChef.value.etat,
        cout_horaire: editChef.value.coutHoraire,
        exclude_from_report: editChef.value.excludeFromReport
      }).eq('id', id);
      if (!error) {
        cancelEdit();
        fetchChefs();
      }
    };

    const deleteChef = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        const { error } = await supabase.from('chefdechantiers').delete().eq('id', id);
        if (!error) fetchChefs();
      }
    };

    onMounted(fetchChefs);

    return {
      chefs,
      newChef,
      addChef,
      editId,
      editChef,
      startEdit,
      cancelEdit,
      updateChef,
      deleteChef
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: auto;
}
.table th, .table td {
  vertical-align: middle;
}
</style>
