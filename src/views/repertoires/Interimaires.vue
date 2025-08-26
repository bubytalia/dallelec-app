<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Gestion des Intérimaires</h2>

    <!-- Form per aggiungere/modificare intérimaire -->
    <div class="card p-4 mb-4">
      <h5>{{ editingInterimaire ? 'Modifier' : 'Ajouter' }} un intérimaire</h5>
      <div class="row">
        <div class="col-md-3">
          <label>Nom:</label>
          <input v-model="newInterimaire.nom" type="text" class="form-control" required />
        </div>
        <div class="col-md-3">
          <label>Prénom:</label>
          <input v-model="newInterimaire.prenom" type="text" class="form-control" required />
        </div>
        <div class="col-md-3">
          <label>Téléphone:</label>
          <input v-model="newInterimaire.telephone" type="tel" class="form-control" />
        </div>
        <div class="col-md-3">
          <label>Email:</label>
          <input v-model="newInterimaire.email" type="email" class="form-control" />
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-md-4">
          <label>Spécialité:</label>
          <select v-model="newInterimaire.specialite" class="form-control">
            <option value="">Sélectionner</option>
            <option value="Électricien">Électricien</option>
            <option value="Aide électricien">Aide électricien</option>
            <option value="Technicien">Technicien</option>
            <option value="Manœuvre">Manœuvre</option>
          </select>
        </div>
        <div class="col-md-4">
          <label>Tarif horaire (€):</label>
          <input v-model.number="newInterimaire.tarifHoraire" type="number" step="0.01" class="form-control" />
        </div>
        <div class="col-md-4">
          <label>Agence intérim:</label>
          <input v-model="newInterimaire.agence" type="text" class="form-control" placeholder="Nom de l'agence" />
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-md-12">
          <label>Notes:</label>
          <textarea v-model="newInterimaire.notes" class="form-control" rows="2" placeholder="Notes sur l'intérimaire..."></textarea>
        </div>
      </div>
      <div class="mt-3">
        <button @click="saveInterimaire" class="btn btn-primary me-2">
          {{ editingInterimaire ? 'Modifier' : 'Ajouter' }}
        </button>
        <button v-if="editingInterimaire" @click="cancelEdit" class="btn btn-secondary">Annuler</button>
      </div>
    </div>

    <!-- Liste des intérimaires -->
    <div class="card p-4">
      <h5>Liste des Intérimaires ({{ interimaires.length }})</h5>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Spécialité</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Tarif/h</th>
              <th>Agence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="interimaire in interimaires" :key="interimaire.id">
              <td>{{ interimaire.nom }}</td>
              <td>{{ interimaire.prenom }}</td>
              <td>{{ interimaire.specialite || '-' }}</td>
              <td>{{ interimaire.telephone || '-' }}</td>
              <td>{{ interimaire.email || '-' }}</td>
              <td>{{ interimaire.tarifHoraire ? interimaire.tarifHoraire + '€' : '-' }}</td>
              <td>{{ interimaire.agence || '-' }}</td>
              <td>
                <button @click="editInterimaire(interimaire)" class="btn btn-sm btn-warning me-2">✎</button>
                <button @click="deleteInterimaire(interimaire.id)" class="btn btn-sm btn-danger">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="interimaires.length === 0" class="text-center text-muted py-4">
          Aucun intérimaire enregistré
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

const interimaires = ref([]);
const editingInterimaire = ref(null);

const newInterimaire = ref({
  nom: '',
  prenom: '',
  telephone: '',
  email: '',
  specialite: '',
  tarifHoraire: 0,
  agence: '',
  notes: ''
});

const fetchInterimaires = async () => {
  try {
    const { data, error } = await supabase.from('interimaires').select('*').order('nom');
    if (!error) {
      interimaires.value = data || [];
    } else {
      console.error('Erreur lors du chargement des intérimaires:', error);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des intérimaires:', error);
  }
};

const saveInterimaire = async () => {
  if (!newInterimaire.value.nom || !newInterimaire.value.prenom) {
    alert('Nom et prénom sont obligatoires');
    return;
  }

  try {
    const interimaireData = {
      nom: newInterimaire.value.nom,
      prenom: newInterimaire.value.prenom,
      telephone: newInterimaire.value.telephone,
      email: newInterimaire.value.email,
      specialite: newInterimaire.value.specialite,
      tarif_horaire: newInterimaire.value.tarifHoraire || 0,
      agence: newInterimaire.value.agence,
      notes: newInterimaire.value.notes
    };

    if (editingInterimaire.value) {
      const { error } = await supabase.from('interimaires').update(interimaireData).eq('id', editingInterimaire.value.id);
      if (error) throw error;
      alert('Intérimaire modifié avec succès');
    } else {
      const { error } = await supabase.from('interimaires').insert([interimaireData]);
      if (error) throw error;
      alert('Intérimaire ajouté avec succès');
    }

    resetForm();
    fetchInterimaires();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert('Erreur lors de la sauvegarde: ' + error.message);
  }
};

const editInterimaire = (interimaire) => {
  editingInterimaire.value = interimaire;
  newInterimaire.value = {
    nom: interimaire.nom,
    prenom: interimaire.prenom,
    telephone: interimaire.telephone || '',
    email: interimaire.email || '',
    specialite: interimaire.specialite || '',
    tarifHoraire: interimaire.tarifHoraire || 0,
    agence: interimaire.agence || '',
    notes: interimaire.notes || ''
  };
};

const cancelEdit = () => {
  editingInterimaire.value = null;
  resetForm();
};

const deleteInterimaire = async (id) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet intérimaire ?')) return;

  try {
    const { error } = await supabase.from('interimaires').delete().eq('id', id);
    if (error) throw error;
    alert('Intérimaire supprimé avec succès');
    fetchInterimaires();
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    alert('Erreur lors de la suppression: ' + error.message);
  }
};

const resetForm = () => {
  newInterimaire.value = {
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    specialite: '',
    tarifHoraire: 0,
    agence: '',
    notes: ''
  };
  editingInterimaire.value = null;
};

onMounted(() => {
  fetchInterimaires();
});
</script>