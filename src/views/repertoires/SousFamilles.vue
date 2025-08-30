<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Sous-Familles</h2>

    <div class="row mb-3">
      <div class="col-md-3">
        <input v-model="newSousFamille.nom" placeholder="Nom de la sous-famille" class="form-control" />
      </div>
      <div class="col-md-3">
        <input v-model.number="newSousFamille.pourcentage" placeholder="Pourcentage de remise (%)" type="number" class="form-control" />
      </div>
      <div class="col-md-3">
        <select v-model="newSousFamille.familleId" class="form-control">
          <option disabled value="">Sélectionnez une famille</option>
          <option v-for="fam in familles" :key="fam.id" :value="fam.id">{{ fam.nom }}</option>
        </select>
      </div>
      <div class="col-md-3">
        <input v-model.number="newSousFamille.ordre" placeholder="Ordre" type="number" min="0" class="form-control" />
      </div>
    </div>

    <div class="text-center mb-4">
      <button @click="addSousFamille" class="btn btn-primary">Ajouter</button>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Famille</th>
          <th>Remise (%)</th>
          <th>Ordre</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sous in sousFamillesTries" :key="sous.id">
          <template v-if="editId === sous.id">
            <td><input v-model="editSousFamille.nom" class="form-control" /></td>
            <td>
              <select v-model="editSousFamille.familleId" class="form-control">
                <option v-for="fam in familles" :key="fam.id" :value="fam.id">{{ fam.nom }}</option>
              </select>
            </td>
            <td><input v-model.number="editSousFamille.pourcentage" type="number" class="form-control" /></td>
            <td><input v-model.number="editSousFamille.ordre" type="number" min="0" class="form-control" /></td>
            <td>
              <button @click="updateSousFamille(sous.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ sous.nom }}</td>
            <td>{{ getFamilleName(sous.familleId) }}</td>
            <td>{{ sous.pourcentage }}</td>
            <td>{{ sous.ordre || 0 }}</td>
            <td>
              <button @click="startEdit(sous)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteSousFamille(sous.id)" class="btn btn-danger btn-sm">🗑</button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '../../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

export default {
  name: 'SousFamilles',
  components: {
    RetourButton
  },
  setup() {
    const familles = ref([]);
    const sousFamilles = ref([]);

    const newSousFamille = ref({
      nom: '',
      pourcentage: null,
      familleId: '',
      ordre: 0
    });

    const editId = ref(null);
    const editSousFamille = ref({
      nom: '',
      pourcentage: null,
      familleId: '',
      ordre: 0
    });



    const fetchFamilles = async () => {
      const { data, error } = await supabase.from('familles').select('*');
      if (error) {
        console.error('Errore caricamento familles:', error);
        return;
      }
      familles.value = data
        .sort((a, b) => {
          const aOrder = Number.isFinite(Number(a.ordrePDF)) ? Number(a.ordrePDF) : Number.POSITIVE_INFINITY;
          const bOrder = Number.isFinite(Number(b.ordrePDF)) ? Number(b.ordrePDF) : Number.POSITIVE_INFINITY;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (a.nom || '').localeCompare(b.nom || '');
        });
    };

    const fetchSousFamilles = async () => {
      const { data, error } = await supabase.from('sousfamilles').select('*');
      if (error) {
        console.error('Errore caricamento sousfamilles:', error);
        return;
      }
      sousFamilles.value = (data || []).map(sf => ({
        ...sf,
        familleId: sf.famille_id
      }));
    };

    const addSousFamille = async () => {
      if (!newSousFamille.value.nom || !newSousFamille.value.familleId) return;
      const { error } = await supabase.from('sousfamilles').insert({
        nom: newSousFamille.value.nom,
        pourcentage: newSousFamille.value.pourcentage,
        famille_id: newSousFamille.value.familleId,
        ordre: newSousFamille.value.ordre || 0
      });
      if (error) {
        console.error('Errore aggiunta sousfamille:', error);
        return;
      }
      newSousFamille.value = { nom: '', pourcentage: null, familleId: '', ordre: 0 };
      fetchSousFamilles();
    };

    const startEdit = (sous) => {
      editId.value = sous.id;
      editSousFamille.value = {
        nom: sous.nom,
        pourcentage: sous.pourcentage,
        familleId: sous.familleId,
        ordre: sous.ordre || 0
      };
    };

    const cancelEdit = () => {
      editId.value = null;
      editSousFamille.value = { nom: '', pourcentage: null, familleId: '' };
    };

    const updateSousFamille = async (id) => {
      const { error } = await supabase.from('sousfamilles').update({
        nom: editSousFamille.value.nom,
        pourcentage: editSousFamille.value.pourcentage,
        famille_id: editSousFamille.value.familleId,
        ordre: editSousFamille.value.ordre || 0
      }).eq('id', id);
      if (error) {
        console.error('Errore aggiornamento sousfamille:', error);
        return;
      }
      cancelEdit();
      fetchSousFamilles();
    };

    const deleteSousFamille = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        const { error } = await supabase.from('sousfamilles').delete().eq('id', id);
        if (error) {
          console.error('Errore cancellazione sousfamille:', error);
          return;
        }
        fetchSousFamilles();
      }
    };

    const getFamilleName = (id) => {
      const fam = familles.value.find(f => f.id === id);
      return fam ? fam.nom : '';
    };

    const sousFamillesTries = computed(() => {
      const getFamille = (id) => familles.value.find(f => f.id === id);
      const copy = [...sousFamilles.value];
      return copy.sort((a, b) => {
        const famA = getFamille(a.familleId);
        const famB = getFamille(b.familleId);
        const famOrderA = Number.isFinite(Number(famA?.ordrePDF)) ? Number(famA?.ordrePDF) : Number.POSITIVE_INFINITY;
        const famOrderB = Number.isFinite(Number(famB?.ordrePDF)) ? Number(famB?.ordrePDF) : Number.POSITIVE_INFINITY;
        if (famOrderA !== famOrderB) return famOrderA - famOrderB;
        const nomFamille = (famA?.nom || '').localeCompare(famB?.nom || '');
        if (nomFamille !== 0) return nomFamille;
        const ordreSous = (Number(a.ordre) || 0) - (Number(b.ordre) || 0);
        if (ordreSous !== 0) return ordreSous;
        return (a.nom || '').localeCompare(b.nom || '');
      });
    });

    onMounted(() => {
      fetchFamilles();
      fetchSousFamilles();
    });

    return {
      sousFamilles,
      sousFamillesTries,
      newSousFamille,
      addSousFamille,
      editId,
      editSousFamille,
      startEdit,
      cancelEdit,
      updateSousFamille,
      deleteSousFamille,
      getFamilleName,
      familles
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
