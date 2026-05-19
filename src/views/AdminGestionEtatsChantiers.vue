<template>
  <div class="container-fluid py-4">
    <RetourButton />
    
    <div class="row mb-4">
      <div class="col-12">
        <h2>Gestion États Chantiers</h2>
        <p class="text-muted">Gérer l'état des chantiers pour l'insertion des heures par les employés</p>
      </div>
    </div>

    <!-- Filtres -->
    <div class="row mb-3">
      <div class="col-md-4">
        <input v-model="searchQuery" type="text" class="form-control" placeholder="🔍 Rechercher un chantier...">
      </div>
      <div class="col-md-3">
        <select v-model="filterEtat" class="form-select">
          <option value="">Tous les états</option>
          <option value="ouvert">🟢 Ouverts</option>
          <option value="ferme">🔴 Fermés</option>
        </select>
      </div>
      <div class="col-md-5 text-end">
        <span class="badge bg-success me-2">{{ statsOuverts }} Ouverts</span>
        <span class="badge bg-danger">{{ statsFermes }} Fermés</span>
      </div>
    </div>

    <!-- Tableau -->
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>N° Chantier</th>
                <th>Nom</th>
                <th>Adresse</th>
                <th>Client</th>
                <th>Chef Responsable</th>
                <th>État pour insertion heures</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="chantier in filteredChantiers" :key="chantier.id">
                <td><strong>{{ chantier.numero_cantiere || 'N/A' }}</strong></td>
                <td>{{ chantier.nom }}</td>
                <td>{{ chantier.adresse }}, {{ chantier.ville }}</td>
                <td>{{ chantier.client }}</td>
                <td>{{ getChefName(chantier.capocantiere) }}</td>
                <td>
                  <select 
                    v-model="chantier.etat_insertion_heures" 
                    class="form-select form-select-sm"
                    :class="chantier.etat_insertion_heures === 'ouvert' ? 'border-success' : 'border-danger'"
                    @change="updateEtat(chantier)"
                  >
                    <option value="ouvert">🟢 Ouvert</option>
                    <option value="ferme">🔴 Fermé</option>
                  </select>
                </td>
                <td>
                  <button 
                    v-if="chantier.etat_insertion_heures === 'ouvert'"
                    @click="fermerChantier(chantier)" 
                    class="btn btn-sm btn-outline-danger"
                    title="Fermer le chantier"
                  >
                    🔒 Fermer
                  </button>
                  <button 
                    v-else
                    @click="ouvrirChantier(chantier)" 
                    class="btn btn-sm btn-outline-success"
                    title="Ouvrir le chantier"
                  >
                    🔓 Ouvrir
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="alert alert-info mt-3">
      <strong>ℹ️ Information:</strong> Les chantiers fermés ne seront plus visibles dans les formulaires d'insertion des heures pour les employés. 
      Les statistiques et rapports afficheront toujours tous les chantiers.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import RetourButton from '../components/RetourButton.vue'

const chantiers = ref([])
const chefDeChantiers = ref([])
const searchQuery = ref('')
const filterEtat = ref('')

const fetchChantiers = async () => {
  const { data, error } = await supabase
    .from('chantiers')
    .select('*')
    .neq('type', 'interne')
    .order('nom')
  
  if (!error) {
    // Imposta default 'ouvert' se il campo non esiste
    chantiers.value = (data || []).map(c => ({
      ...c,
      etat_insertion_heures: c.etat_insertion_heures || 'ouvert'
    }))
  }
}

const fetchChefDeChantiers = async () => {
  const { data, error } = await supabase
    .from('chefdechantiers')
    .select('*')
    .order('nom')
  
  if (!error) chefDeChantiers.value = data || []
}

const getChefName = (email) => {
  if (!email) return '-'
  const chef = chefDeChantiers.value.find(c => c.email === email)
  return chef ? `${chef.nom} ${chef.prenom}` : email
}

const updateEtat = async (chantier) => {
  const { error } = await supabase
    .from('chantiers')
    .update({ etat_insertion_heures: chantier.etat_insertion_heures })
    .eq('id', chantier.id)
  
  if (error) {
    console.error('Erreur mise à jour état:', error)
    alert('Erreur lors de la mise à jour')
  }
}

const fermerChantier = async (chantier) => {
  if (confirm(`Fermer le chantier "${chantier.nom}" ?\n\nLes employés ne pourront plus y insérer des heures.`)) {
    chantier.etat_insertion_heures = 'ferme'
    await updateEtat(chantier)
  }
}

const ouvrirChantier = async (chantier) => {
  if (confirm(`Ouvrir le chantier "${chantier.nom}" ?\n\nLes employés pourront y insérer des heures.`)) {
    chantier.etat_insertion_heures = 'ouvert'
    await updateEtat(chantier)
  }
}

const filteredChantiers = computed(() => {
  let filtered = chantiers.value

  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(c => 
      c.nom?.toLowerCase().includes(query) ||
      c.numero_cantiere?.toLowerCase().includes(query) ||
      c.adresse?.toLowerCase().includes(query) ||
      c.client?.toLowerCase().includes(query)
    )
  }

  // Filtre par état
  if (filterEtat.value) {
    filtered = filtered.filter(c => c.etat_insertion_heures === filterEtat.value)
  }

  return filtered
})

const statsOuverts = computed(() => {
  return chantiers.value.filter(c => c.etat_insertion_heures === 'ouvert').length
})

const statsFermes = computed(() => {
  return chantiers.value.filter(c => c.etat_insertion_heures === 'ferme').length
})

onMounted(() => {
  fetchChantiers()
  fetchChefDeChantiers()
})
</script>

<style scoped>
.table th {
  background-color: #f8f9fa;
}
</style>
