<template>
  <div class="container-fluid">
    <RetourButton />
    
    <div class="row mb-4">
      <div class="col-12">
        <h2>Bilan des Chantiers - Admin</h2>
      </div>
    </div>

    <!-- Filtres -->
    <div class="row mb-4">
      <div class="col-md-3">
        <label class="form-label">Période de début</label>
        <input type="date" v-model="dateDebut" class="form-control" @change="() => calculerBilans()">
      </div>
      <div class="col-md-3">
        <label class="form-label">Période de fin</label>
        <input type="date" v-model="dateFin" class="form-control" @change="() => calculerBilans()">
      </div>
      <div class="col-md-3">
        <label class="form-label">Chantier</label>
        <select v-model="selectedChantierId" class="form-control" @change="() => calculerBilans()">
          <option value="">Tous les chantiers</option>
          <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
            {{ chantier.nom }}
          </option>
        </select>
      </div>
      <div class="col-md-3">
        <label class="form-label">Année</label>
        <select v-model="selectedYear" class="form-control" @change="() => calculerBilans()">
          <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
        </select>
      </div>
    </div>

    <!-- Résumé général -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5>Résumé Général</h5>
            <button @click="exportBilanGeneral" class="btn btn-primary btn-sm">
              <i class="fas fa-download"></i> Exporter PDF
            </button>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-primary">{{ totalHeures.toFixed(2) }}</h4>
                  <p>Heures totales</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-success">{{ totalCout.toFixed(2) }} CHF</h4>
                  <p>Coût total</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-info">{{ nombreChantiers }}</h4>
                  <p>Chantiers actifs</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-warning">{{ nombrePersonnes }}</h4>
                  <p>Personnes impliquées</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bilan par chantier -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5>Bilan par Chantier</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Chantier</th>
                    <th>Heures Chef</th>
                    <th>Coût Chef</th>
                    <th>Heures Collaborateurs</th>
                    <th>Coût Collaborateurs</th>
                    <th>Total Heures</th>
                    <th>Total Coût</th>
                    <th>Coût/H</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(bilan, index) in bilansParChantier" :key="`bilan-${bilan.chantierId}-${index}`">
                    <td>{{ getChantierName(bilan.chantierId) }}</td>
                    <td>{{ bilan.heuresChef.toFixed(2) }}</td>
                    <td>{{ bilan.coutChef.toFixed(2) }} CHF</td>
                    <td>{{ bilan.heuresCollaborateurs.toFixed(2) }}</td>
                    <td>{{ bilan.coutCollaborateurs.toFixed(2) }} CHF</td>
                    <td>{{ bilan.totalHeures.toFixed(2) }}</td>
                    <td>{{ bilan.totalCout.toFixed(2) }} CHF</td>
                    <td>{{ bilan.coutHoraire.toFixed(2) }} CHF/h</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Détail des heures par personne -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5>Détail des Heures par Personne</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Personne</th>
                    <th>Type</th>
                    <th>Chantier</th>
                    <th>Heures</th>
                    <th>Coût/H</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(heure, index) in heuresDetaillees" :key="`heure-${heure.id}-${index}`">
                    <td>{{ getUserName(heure.userId) }}</td>
                    <td>{{ heure.type === 'propre' ? 'Chef' : 'Collaborateur' }}</td>
                    <td>{{ getChantierName(heure.chantierId) }}</td>
                    <td>{{ heure.heures }}</td>
                    <td>{{ heure.coutHoraire }} CHF/h</td>
                    <td>{{ (heure.heures * heure.coutHoraire).toFixed(2) }} CHF</td>
                    <td>{{ formatDate(heure.date) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rapport mensuel -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5>Rapport Mensuel</h5>
            <button @click="exportRapportMensuel" class="btn btn-success btn-sm">
              <i class="fas fa-download"></i> Exporter PDF
            </button>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Résumé par mois</h6>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Mois</th>
                        <th>Heures</th>
                        <th>Coût</th>
                        <th>Chantiers</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(rapport, index) in rapportMensuel" :key="`rapport-${rapport.mois}-${index}`">
                        <td>{{ rapport.mois }}</td>
                        <td>{{ rapport.heures.toFixed(2) }}</td>
                        <td>{{ rapport.cout.toFixed(2) }} CHF</td>
                        <td>{{ rapport.chantiers }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="col-md-6">
                <h6>Répartition par type</h6>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Heures</th>
                        <th>Coût</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Chefs</td>
                        <td>{{ totalHeuresChefs.toFixed(2) }}</td>
                        <td>{{ totalCoutChefs.toFixed(2) }} CHF</td>
                        <td>{{ ((totalHeuresChefs / totalHeures) * 100).toFixed(1) }}%</td>
                      </tr>
                      <tr>
                        <td>Collaborateurs</td>
                        <td>{{ totalHeuresCollaborateurs.toFixed(2) }}</td>
                        <td>{{ totalCoutCollaborateurs.toFixed(2) }} CHF</td>
                        <td>{{ ((totalHeuresCollaborateurs / totalHeures) * 100).toFixed(1) }}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import RetourButton from '../components/RetourButton.vue'
import jsPDF from 'jspdf'

// Références réactives
const chantiers = ref([])
const collaborateurs = ref([])
const chefs = ref([])
const heuresPropres = ref([])
const heuresInterim = ref([])
const dateDebut = ref('')
const dateFin = ref('')
const selectedChantierId = ref('')
const selectedYear = ref(new Date().getFullYear())

// Données calculées
const bilansParChantier = ref([])
const heuresDetaillees = ref([])
const rapportMensuel = ref([])

// Fonctions utilitaires
const formatDate = (date) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('fr-FR')
}

const getUserName = (userId) => {
  // Cerca prima nei chef
  const chef = chefs.value.find(c => c.email === userId)
  if (chef) return `${chef.nom} ${chef.prenom}`
  
  // Cerca nei collaboratori
  const collaborateur = collaborateurs.value.find(c => c.email === userId)
  if (collaborateur) return `${collaborateur.nom} ${collaborateur.prenom}`
  
  // Fallback per email conosciute
  if (userId === 'junior@dallelec.com') return 'Repellin Junior'
  if (userId === 'chef@dallelec.com') return 'Chef de Chantier'
  if (userId === 'tony@dallelec.com') return 'Maullier Tony'
  if (userId === 'dylan@dallelec.com') return 'Laplane Dylan'
  
  return `Chef inconnu (${userId})`
}

const getChantierName = (chantierId) => {
  const chantier = chantiers.value.find(c => c.id === chantierId)
  return chantier ? chantier.nom : chantierId
}

const getCoutHoraire = (userId, type) => {
  if (type === 'propre') {
    const chef = chefs.value.find(c => c.email === userId)
    return chef ? chef.cout_horaire || 45 : 45
  } else {
    const collaborateur = collaborateurs.value.find(c => c.email === userId)
    return collaborateur ? collaborateur.cout_horaire || 35 : 35
  }
}

// Computed properties
const totalHeures = computed(() => {
  return heuresDetaillees.value.reduce((sum, h) => sum + h.heures, 0)
})

const totalCout = computed(() => {
  return heuresDetaillees.value.reduce((sum, h) => sum + (h.heures * h.coutHoraire), 0)
})

const nombreChantiers = computed(() => {
  return new Set(heuresDetaillees.value.map(h => h.chantierId)).size
})

const nombrePersonnes = computed(() => {
  return new Set(heuresDetaillees.value.map(h => h.userId)).size
})

const totalHeuresChefs = computed(() => {
  return heuresDetaillees.value
    .filter(h => h.type === 'propre')
    .reduce((sum, h) => sum + h.heures, 0)
})

const totalCoutChefs = computed(() => {
  return heuresDetaillees.value
    .filter(h => h.type === 'propre')
    .reduce((sum, h) => sum + (h.heures * h.coutHoraire), 0)
})

const totalHeuresCollaborateurs = computed(() => {
  return heuresDetaillees.value
    .filter(h => h.type === 'interim')
    .reduce((sum, h) => sum + h.heures, 0)
})

const totalCoutCollaborateurs = computed(() => {
  return heuresDetaillees.value
    .filter(h => h.type === 'interim')
    .reduce((sum, h) => sum + (h.heures * h.coutHoraire), 0)
})

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push(i)
  }
  return years
})

// Fonctions de calcul
const calculerBilans = async () => {
  if (!dateDebut.value || !dateFin.value) return

  const debut = new Date(dateDebut.value)
  const fin = new Date(dateFin.value)

  // Charger aussi les heures ouvriers pour le calcul complet
  const { data: heuresOuvriersData } = await supabase.from('heures_ouvriers').select('*')
  const heuresOuvriers = heuresOuvriersData || []
  
  // Filtrer les heures par période
  const heuresFiltrees = [...heuresPropres.value, ...heuresInterim.value, ...heuresOuvriers]
    .filter(h => {
      const dateHeure = h.date.toDate ? h.date.toDate() : new Date(h.date)
      return dateHeure >= debut && dateHeure <= fin
    })
  
  console.log('DEBUG - Heures après filtre période:', heuresFiltrees.length)
  console.log('DEBUG - Période:', debut, 'à', fin)
  console.log('DEBUG - Cantiere selezionato:', selectedChantierId.value)

  // Filtrer par chantier si sélectionné
  const heuresFinales = selectedChantierId.value 
    ? heuresFiltrees.filter(h => String(h.chantier_id) === String(selectedChantierId.value))
    : heuresFiltrees
    
  console.log('DEBUG - Heures finales après filtre cantiere:', heuresFinales.length)
  
  // Debug: mostra tutti i chantier_id presenti nelle ore
  const chantiersIds = [...new Set(heuresFiltrees.map(h => h.chantier_id))]
  console.log('DEBUG - Chantier IDs trovati nelle ore:', chantiersIds)
  console.log('DEBUG - Cercando cantiere ID:', selectedChantierId.value)

  // Préparer les données détaillées
  heuresDetaillees.value = heuresFinales.map(h => {
    const isChefPropre = heuresPropres.value.some(hp => hp.id === h.id)
    const isChefInterim = heuresInterim.value.some(hi => hi.id === h.id)
    const type = isChefPropre ? 'propre' : 'interim'
    const userId = h.chef_id || h.ouvrier_id
    
    // Debug per identificare Chef inconnu
    const userName = getUserName(userId)
    if (userName.includes('Chef inconnu')) {
      console.log('🔍 Chef inconnu trovato:', {
        userId,
        date: h.date,
        heures: h.total_heures || h.heures_normales || h.heures || 0,
        type,
        chantier_id: h.chantier_id
      })
    }
    
    return {
      ...h,
      type,
      heures: h.total_heures || h.heures_normales || h.heures || 0,
      userId,
      chantierId: h.chantier_id,
      coutHoraire: h.tarif_utilise || getCoutHoraire(userId, type)
    }
  })

  // Calculer les bilans par chantier
  const bilans = {}
  heuresDetaillees.value.forEach(h => {
    if (!bilans[h.chantierId]) {
      bilans[h.chantierId] = {
        chantierId: h.chantierId,
        heuresChef: 0,
        coutChef: 0,
        heuresCollaborateurs: 0,
        coutCollaborateurs: 0,
        totalHeures: 0,
        totalCout: 0,
        coutHoraire: 0
      }
    }

    if (h.type === 'propre') {
      bilans[h.chantierId].heuresChef += h.heures
      bilans[h.chantierId].coutChef += h.heures * h.coutHoraire
    } else {
      bilans[h.chantierId].heuresCollaborateurs += h.heures
      bilans[h.chantierId].coutCollaborateurs += h.heures * h.coutHoraire
    }

    bilans[h.chantierId].totalHeures += h.heures
    bilans[h.chantierId].totalCout += h.heures * h.coutHoraire
  })

  // Calculer le coût horaire moyen par chantier
  Object.values(bilans).forEach(bilan => {
    bilan.coutHoraire = bilan.totalHeures > 0 ? bilan.totalCout / bilan.totalHeures : 0
  })

  bilansParChantier.value = Object.values(bilans)

  // Calculer le rapport mensuel
  calculerRapportMensuel(heuresFinales)
}

const calculerRapportMensuel = (heures) => {
  const rapports = {}
  
  heures.forEach(h => {
    const date = h.date.toDate ? h.date.toDate() : new Date(h.date)
    const mois = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!rapports[mois]) {
      rapports[mois] = {
        mois: `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        heures: 0,
        cout: 0,
        chantiers: new Set()
      }
    }
    
    const coutHoraire = h.coutHoraire || getCoutHoraire(h.userId, h.type)
    rapports[mois].heures += h.heures
    rapports[mois].cout += h.heures * coutHoraire
    rapports[mois].chantiers.add(h.chantierId)
  })

  // Convertir les Sets en nombres
  Object.values(rapports).forEach(r => {
    r.chantiers = r.chantiers.size
  })

  rapportMensuel.value = Object.values(rapports).sort((a, b) => a.mois.localeCompare(b.mois))
}

// Fonctions d'export
const exportBilanGeneral = () => {
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.text('Bilan Général des Chantiers', 20, 20)
  
  doc.setFontSize(12)
  doc.text(`Période: ${formatDate(new Date(dateDebut.value))} - ${formatDate(new Date(dateFin.value))}`, 20, 35)
  
  doc.setFontSize(14)
  doc.text('Résumé', 20, 50)
  
  doc.setFontSize(10)
  doc.text(`Heures totales: ${totalHeures.value.toFixed(2)}`, 20, 65)
  doc.text(`Coût total: ${totalCout.value.toFixed(2)} CHF`, 20, 75)
  doc.text(`Chantiers actifs: ${nombreChantiers.value}`, 20, 85)
  doc.text(`Personnes impliquées: ${nombrePersonnes.value}`, 20, 95)
  
  doc.save('bilan-general.pdf')
}

const exportRapportMensuel = () => {
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.text('Rapport Mensuel', 20, 20)
  
  doc.setFontSize(12)
  doc.text(`Année: ${selectedYear.value}`, 20, 35)
  
  let y = 50
  doc.setFontSize(14)
  doc.text('Résumé par mois', 20, y)
  
  y += 15
  doc.setFontSize(10)
  rapportMensuel.value.forEach(rapport => {
    doc.text(`${rapport.mois}: ${rapport.heures.toFixed(2)}h - ${rapport.cout.toFixed(2)} CHF`, 20, y)
    y += 10
  })
  
  doc.save('rapport-mensuel.pdf')
}

// Initialisation
const setDefaultDates = () => {
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  dateDebut.value = thirtyDaysAgo.toISOString().split('T')[0]
  dateFin.value = today.toISOString().split('T')[0]
}

const fetchData = async () => {
  try {
    // Charger les chantiers
    const { data: chantiersData } = await supabase.from('chantiers').select('*')
    chantiers.value = chantiersData || []

    // Charger les collaborateurs
    const { data: collaborateursData } = await supabase.from('collaborateurs').select('*')
    collaborateurs.value = collaborateursData || []

    // Charger les chefs
    const { data: chefsData } = await supabase.from('chefdechantiers').select('*')
    chefs.value = chefsData || []
    
    // Debug: verifica dati caricati
    console.log('DEBUG BILANCI - Chefs:', chefs.value.map(c => c.email + ' - ' + c.nom))
    console.log('DEBUG BILANCI - Collaboratori:', collaborateurs.value.map(c => c.email + ' - ' + c.nom))

    // Charger les heures propres
    const { data: heuresPropreData } = await supabase.from('heures_chef_propres').select('*')
    heuresPropres.value = heuresPropreData || []
    console.log('DEBUG - Heures chef propres:', heuresPropres.value.length)

    // Charger les heures intérimaires  
    const { data: heuresInterimData } = await supabase.from('heures_chef_interim').select('*')
    heuresInterim.value = heuresInterimData || []
    console.log('DEBUG - Heures interim:', heuresInterim.value.length)
    
    // Charger aussi les heures ouvriers
    const { data: heuresOuvriersData } = await supabase.from('heures_ouvriers').select('*')
    const heuresOuvriers = heuresOuvriersData || []
    console.log('DEBUG - Heures ouvriers:', heuresOuvriers.length)

    setDefaultDates()
    await calculerBilans()
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
