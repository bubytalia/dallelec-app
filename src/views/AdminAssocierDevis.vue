<template>
  <div class="container py-5">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Associer Devis aux Chantiers</h2>
    
    <!-- Selezione cantiere -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Sélectionner un chantier</h5>
          </div>
          <div class="card-body">
            <select v-model="selectedChantierId" class="form-control" @change="loadChantierDetails">
              <option value="">Choisir un chantier</option>
              <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                {{ chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '' }}{{ chantier.nom }} - {{ chantier.adresse }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Détails du chantier -->
    <div v-if="selectedChantier" class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Détails du chantier</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>Nom:</strong> {{ selectedChantier.numeroCantiere ? `N° ${selectedChantier.numeroCantiere} - ` : '' }}{{ selectedChantier.nom }}</p>
                <p><strong>Adresse:</strong> {{ selectedChantier.adresse }}</p>
                <p><strong>Ville:</strong> {{ selectedChantier.ville }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Client:</strong> {{ selectedChantier.client }}</p>
                <p><strong>Technicien:</strong> {{ selectedChantier.technicien }}</p>
                <p><strong>Devis actuel:</strong> 
                  <span v-if="selectedChantier.devisId" class="badge bg-success">
                    {{ getDevisInfo(selectedChantier.devisId) }}
                  </span>
                  <span v-else class="badge bg-warning">Aucun devis</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sélection du devis -->
    <div v-if="selectedChantier" class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Sélectionner un devis</h5>
          </div>
          <div class="card-body">
                         <div class="row">
               <div class="col-md-8">
                 <select v-model="selectedDevisId" class="form-control">
                   <option value="">Choisir un devis</option>
                   <option v-for="devis in devisDisponibles" :key="devis.id" :value="devis.id">
                     {{ devis.numero }} - {{ devis.nom }} ({{ devis.adresse }})
                   </option>
                 </select>
                 <small v-if="devisDisponibles.length === 0" class="text-muted">
                   Aucun devis disponible. Tous les devis sont déjà associés à un chantier.
                 </small>
               </div>
               <div class="col-md-4">
                 <button @click="associerDevis" class="btn btn-primary" :disabled="!selectedDevisId">
                   Associer le devis
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Détails du devis sélectionné -->
    <div v-if="selectedDevis" class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Détails du devis sélectionné</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>Numéro:</strong> {{ selectedDevis.numero }}</p>
                <p><strong>Client:</strong> {{ getClientName(selectedDevis.clientId) }}</p>
                <p><strong>Adresse:</strong> {{ selectedDevis.adresse }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Technicien:</strong> {{ selectedDevis.technicien }}</p>
                <p><strong>Total:</strong> {{ selectedDevis.total }}€</p>
                <p><strong>Statut:</strong> 
                  <span :class="getStatusClass(selectedDevis.status)">
                    {{ selectedDevis.status }}
                  </span>
                </p>
              </div>
            </div>
            
            
          </div>
        </div>
      </div>
    </div>

         <!-- Liste des devis disponibles -->
     <div class="row">
       <div class="col-md-12">
         <div class="card">
           <div class="card-header">
             <h5>Liste des devis disponibles</h5>
           </div>
           <div class="card-body">
             <div class="table-responsive">
               <table class="table table-striped">
                 <thead>
                   <tr>
                     <th>Numéro</th>
                     <th>Client</th>
                     <th>Adresse</th>
                     <th>Technicien</th>
                     <th>Total</th>
                     <th>Statut</th>
                     <th>Chantier associé</th>
                     <th>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr v-for="devis in devis" :key="devis.id">
                     <td>{{ devis.numero }}</td>
                     <td>{{ getClientName(devis.clientId) }}</td>
                     <td>{{ devis.adresse }}</td>
                     <td>{{ devis.technicien }}</td>
                     <td>{{ devis.total }}€</td>
                     <td>
                       <span :class="getStatusClass(devis.status)">
                         {{ devis.status }}
                       </span>
                     </td>
                     <td>
                       <span v-if="getChantierAssocie(devis.id)" class="badge bg-success">
                         {{ getChantierAssocie(devis.id) }}
                       </span>
                       <span v-else class="badge bg-warning">Non associé</span>
                     </td>
                     <td>
                       <button 
                         v-if="getChantierAssocie(devis.id)" 
                         @click="dissocierDevis(getChantierId(devis.id))" 
                         class="btn btn-warning btn-sm"
                         title="Dissocier le devis"
                       >
                         <i class="fas fa-unlink"></i> Dissocier
                       </button>
                       <button 
                         v-else 
                         @click="associerDevisDirect(devis.id)" 
                         class="btn btn-success btn-sm"
                         title="Associer le devis"
                       >
                         <i class="fas fa-link"></i> Associer
                       </button>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </div>
         </div>
       </div>
     </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import RetourButton from '../components/RetourButton.vue'

// Références réactives
const chantiers = ref([])
const devis = ref([])
const clients = ref([])
const selectedChantierId = ref('')
const selectedDevisId = ref('')
const selectedChantier = ref(null)
const selectedDevis = ref(null)

// Computed properties
const devisDisponibles = computed(() => {
  return devis.value.filter(d => {
    // Filtra i devis che non sono già associati a un cantiere
    const chantierAssocie = chantiers.value.find(c => c.devisId === d.id)
    return !chantierAssocie
  })
})

// Computed per mostrare tutti i devis non associati, indipendentemente dal nome
const devisNonAssocies = computed(() => {
  return devis.value.filter(d => {
    const chantierAssocie = chantiers.value.find(c => c.devisId === d.id)
    return !chantierAssocie
  })
})

const devisAssocies = computed(() => {
  return devis.value.filter(d => {
    // Filtra i devis che sono già associati a un cantiere
    const chantierAssocie = chantiers.value.find(c => c.devisId === d.id)
    return chantierAssocie
  })
})

// Fonctions utilitaires
const getClientName = (clientId) => {
  const client = clients.value.find(c => c.id === clientId)
  return client ? client.nom : 'Inconnu'
}

const getDevisInfo = (devisId) => {
  const devisItem = devis.value.find(d => d.id === devisId)
  return devisItem ? `${devisItem.numero} - ${devisItem.nom}` : 'Devis inconnu'
}

const getChantierAssocie = (devisId) => {
  const chantier = chantiers.value.find(c => c.devisId === devisId)
  if (!chantier) return null
  const numero = chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : ''
  return `${numero}${chantier.nom}`
}

const getChantierId = (devisId) => {
  const chantier = chantiers.value.find(c => c.devisId === devisId)
  return chantier ? chantier.id : null
}

const getStatusClass = (status) => {
  switch (status) {
    case 'Accepté':
      return 'badge bg-success'
    case 'Non accepté':
      return 'badge bg-danger'
    case 'En cours':
      return 'badge bg-warning'
    default:
      return 'badge bg-secondary'
  }
}

// Fonctions de chargement
const loadChantierDetails = async () => {
  if (!selectedChantierId.value) {
    selectedChantier.value = null
    selectedDevis.value = null
    return
  }

  selectedChantier.value = chantiers.value.find(c => c.id === selectedChantierId.value)
  
  if (selectedChantier.value?.devisId) {
    await loadDevisDetails(selectedChantier.value.devisId)
  }
}

const loadDevisDetails = async (devisId) => {
  try {
    const devisDoc = await getDoc(doc(db, 'devis', devisId))
    if (devisDoc.exists()) {
      selectedDevis.value = { id: devisDoc.id, ...devisDoc.data() }
    }
  } catch (error) {
    console.error('Erreur lors du chargement du devis:', error)
  }
}

const associerDevis = async () => {
  if (!selectedChantierId.value || !selectedDevisId.value) return

  try {
    await updateDoc(doc(db, 'chantiers', selectedChantierId.value), {
      devisId: selectedDevisId.value,
      updatedAt: new Date()
    })

    // Recharge les données
    await fetchData()
    
    // Met à jour l'affichage
    selectedChantier.value = chantiers.value.find(c => c.id === selectedChantierId.value)
    await loadDevisDetails(selectedDevisId.value)

    alert('Devis associé avec succès!')
  } catch (error) {
    console.error('Erreur lors de l\'association:', error)
    alert('Erreur lors de l\'association: ' + error.message)
  }
}

const dissocierDevis = async (chantierId) => {
  if (!chantierId) return

  try {
    await updateDoc(doc(db, 'chantiers', chantierId), {
      devisId: null,
      updatedAt: new Date()
    })

    // Recharge les données
    await fetchData()
    
    // Met à jour l'affichage
    if (selectedChantierId.value === chantierId) {
      selectedChantier.value = chantiers.value.find(c => c.id === selectedChantierId.value)
      selectedDevis.value = null
    }

    alert('Devis dissocié avec succès!')
  } catch (error) {
    console.error('Erreur lors de la dissociation:', error)
    alert('Erreur lors de la dissociation: ' + error.message)
  }
}

const associerDevisDirect = async (devisId) => {
  if (!selectedChantierId.value) {
    alert('Veuillez d\'abord sélectionner un chantier')
    return
  }

  try {
    await updateDoc(doc(db, 'chantiers', selectedChantierId.value), {
      devisId: devisId,
      updatedAt: new Date()
    })

    // Recharge les données
    await fetchData()
    
    // Met à jour l'affichage
    selectedChantier.value = chantiers.value.find(c => c.id === selectedChantierId.value)
    await loadDevisDetails(devisId)

    alert('Devis associé avec succès!')
  } catch (error) {
    console.error('Erreur lors de l\'association:', error)
    alert('Erreur lors de l\'association: ' + error.message)
  }
}

const fetchData = async () => {
  try {
    const [chantiersSnap, devisSnap, clientsSnap] = await Promise.all([
      getDocs(collection(db, 'chantiers')),
      getDocs(collection(db, 'devis')),
      getDocs(collection(db, 'clients'))
    ])

    chantiers.value = chantiersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    devis.value = devisSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    clients.value = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  }
}

// Watch per aggiornare i dettagli del devis quando cambia la selezione
import { watch } from 'vue'

watch(selectedDevisId, async (newDevisId) => {
  if (newDevisId) {
    await loadDevisDetails(newDevisId)
  } else {
    selectedDevis.value = null
  }
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.card {
  margin-bottom: 1rem;
}
</style>
