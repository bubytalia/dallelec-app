<template>
  <div class="container py-5">
    <RetourButton to="/chef/chantiers" />
    
    <h2 class="text-center mb-4">Gestion des Métrages</h2>
    
    <!-- Selezione cantiere -->
    <div class="row mb-4">
      <div class="col-md-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Sélectionner un chantier</h5>
          </div>
          <div class="card-body">
            <select v-model="selectedChantierId" class="form-control" @change="loadDevisData">
              <option value="">Choisir un chantier</option>
              <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                {{ chantier.nom }} - {{ chantier.adresse }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Selezione zona -->
    <div v-if="selectedChantierId && zones.length > 0" class="row mb-4">
      <div class="col-md-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Sélectionner une zone</h5>
          </div>
          <div class="card-body">
            <select v-model="selectedZone" class="form-control" @change="loadZoneProducts">
              <option value="">Choisir une zone</option>
              <option v-for="zone in zones" :key="zone" :value="zone">
                Zone: {{ zone }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Form inserimento quantità per zona -->
    <div v-if="selectedZone && zoneProducts.length > 0" class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Saisir les quantités posées - Zone: {{ selectedZone }}</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <label>Période:</label>
                <select v-model="selectedPeriod" class="form-control">
                  <option value="month">Fin de mois</option>
                  <option value="project">Fin de projet</option>
                </select>
              </div>
              <div class="col-md-3">
                <label>Date de saisie:</label>
                <input v-model="saisieDate" type="date" class="form-control" />
              </div>
              <div class="col-md-6">
                <label>Remarques:</label>
                <input v-model="remarques" type="text" class="form-control" placeholder="Observations..." />
              </div>
            </div>
            
            <hr>
            
                         <!-- Prodotti principali -->
             <h6>Produits principaux:</h6>
             
             <!-- Ajouter un nouveau produit -->
             <div class="row mb-3">
               <div class="col-md-12">
                 <div class="card border-primary">
                   <div class="card-header">
                     <h6>Ajouter un produit principal</h6>
                   </div>
                   <div class="card-body">
                                           <div class="row">
                        <div class="col-md-5">
                          <label>Sélectionner un produit:</label>
                          <select v-model="newProduct.selectedId" class="form-control">
                            <option value="">Choisir un produit</option>
                            <option v-for="product in availableProducts" :key="product.id" :value="product.id">
                              {{ product.codeArticle }} - {{ product.produit }}
                            </option>
                          </select>
                        </div>
                        <div class="col-md-4">
                          <label>Quantité posée (ML):</label>
                          <input v-model.number="newProduct.quantitePosee" type="number" step="0.01" class="form-control" placeholder="Qté posée" />
                        </div>
                        <div class="col-md-3">
                          <label>&nbsp;</label>
                          <button @click="addNewProduct" class="btn btn-primary w-100" :disabled="!canAddProduct">
                            <i class="fas fa-plus"></i> Ajouter
                          </button>
                        </div>
                      </div>
                   </div>
                 </div>
               </div>
             </div>
             
             <!-- Produits ajoutés -->
             <div class="row">
               <div v-for="product in selectedProducts" :key="product.id" class="col-md-6 mb-3">
                 <div class="card">
                   <div class="card-body">
                     <div class="d-flex justify-content-between align-items-start">
                       <h6>{{ product.codeArticle }} - {{ product.produit }}</h6>
                       <button @click="removeProduct(product.id)" class="btn btn-danger btn-sm">
                         <i class="fas fa-trash"></i>
                       </button>
                     </div>
                     <p class="text-muted mb-2">Taille: {{ product.taille }} {{ product.unite }}</p>
                     <div class="row">
                       <div class="col-md-6">
                         <label>Quantité prévue (ML):</label>
                         <input :value="product.quantiteML" class="form-control" readonly />
                       </div>
                       <div class="col-md-6">
                         <label>Quantité posée (ML):</label>
                         <input v-model.number="product.quantitePosee" type="number" step="0.01" class="form-control" />
                       </div>
                     </div>
                     <div class="row mt-2">
                       <div class="col-md-6">
                         <label>Progression:</label>
                         <input :value="product.quantitePosee > 0 ? ((product.quantitePosee / product.quantiteML) * 100).toFixed(1) + '%' : '0%'" class="form-control" readonly />
                       </div>
                       <div class="col-md-6">
                         <label>Unité:</label>
                         <input :value="product.unite || 'm'" class="form-control" readonly />
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

                         <!-- Suppléments -->
             <h6 class="mt-4">Suppléments:</h6>
             
             <!-- Ajouter un nouveau supplément -->
             <div class="row mb-3">
               <div class="col-md-12">
                 <div class="card border-warning">
                   <div class="card-header">
                     <h6>Ajouter un supplément</h6>
                   </div>
                   <div class="card-body">
                                           <div class="row">
                        <div class="col-md-6">
                          <label>Type de supplément:</label>
                          <select v-model="newSupplement.type" class="form-control">
                            <option value="">Choisir un type</option>
                            <option value="virage fabriqué">Virage fabriqué</option>
                            <option value="virage avec CDC">Virage avec CDC</option>
                            <option value="T CDC">T CDC</option>
                            <option value="T fabriqué">T fabriqué</option>
                            <option value="départ/arrivé">Départ/Arrivé</option>
                            <option value="réduction">Réduction</option>
                            <option value="autre">Autre</option>
                          </select>
                        </div>
                        <div class="col-md-4">
                          <label>Quantité:</label>
                          <input v-model.number="newSupplement.qte" type="number" step="1" class="form-control" placeholder="Qté" />
                        </div>
                        <div class="col-md-2">
                          <label>&nbsp;</label>
                          <button @click="addNewSupplement" class="btn btn-success w-100" :disabled="!canAddSupplement">
                            <i class="fas fa-plus"></i> Ajouter
                          </button>
                        </div>
                      </div>
                   </div>
                 </div>
               </div>
             </div>
             
             <!-- Suppléments existants -->
             <div class="row">
               <div v-for="supplement in zoneSupplements" :key="supplement.id" class="col-md-6 mb-3">
                 <div class="card border-info">
                   <div class="card-body">
                     <div class="d-flex justify-content-between align-items-start">
                       <h6>{{ supplement.codeArticle }} - {{ supplement.supplement }}</h6>
                       <button v-if="supplement.isNew" @click="removeSupplement(supplement.id)" class="btn btn-danger btn-sm">
                         <i class="fas fa-trash"></i>
                       </button>
                     </div>
                     <p class="text-muted mb-2">Produit: {{ supplement.produit }}</p>
                     <div class="row">
                       <div class="col-md-6">
                         <label>Quantité prévue:</label>
                         <input :value="supplement.qte" class="form-control" readonly />
                       </div>
                       <div class="col-md-6">
                         <label>Quantité posée:</label>
                         <input v-model.number="supplement.quantitePosee" type="number" step="0.01" class="form-control" />
                       </div>
                     </div>
                     <div class="row mt-2">
                       <div class="col-md-6">
                         <label>Progression:</label>
                         <input :value="supplement.quantitePosee > 0 ? ((supplement.quantitePosee / supplement.qte) * 100).toFixed(1) + '%' : '0%'" class="form-control" readonly />
                       </div>
                       
                     </div>
                   </div>
                 </div>
               </div>
             </div>
            
            <div class="text-center mt-3">
              <button @click="saveMetrages" class="btn btn-primary" :disabled="!canSave">
                Enregistrer les métrages
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Riepilogo e calcolo premi -->
    <div v-if="selectedChantierId && metragesData" class="row">
      <div class="col-md-12 mb-4">
        <div class="card">
          <div class="card-header">
            <h5>Résumé et calcul des primes</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-primary">{{ metragesData.totalHeuresPrevues.toFixed(1) }}h</h4>
                  <p>Heures prévues</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-info">{{ metragesData.totalHeuresImployees.toFixed(1) }}h</h4>
                  <p>Heures employées</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-success">{{ metragesData.heuresGagnees.toFixed(1) }}h</h4>
                  <p>Heures gagnées</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-warning">{{ metragesData.heuresGagnees > 0 ? 'Oui' : 'Non' }}</h4>
                  <p>Prime possible</p>
                </div>
              </div>
            </div>
            
            <div class="row mt-3">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>Formule de calcul:</strong> (Heures prévues - Heures employées) × Taux horaire
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Storico metrages -->
    <div v-if="selectedChantierId" class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Historique des métrages</h5>
          </div>
          <div class="card-body">
            <div v-if="historiqueMetrages.length === 0" class="text-center text-muted">
              Aucun métrage enregistré
            </div>
            <div v-else>
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Zone</th>
                    <th>Période</th>
                    <th>Produits</th>
                    <th>Heures prévues</th>
                    <th>Heures employées</th>
                    <th>Prime possible</th>
                    <th>Remarques</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="metrage in historiqueMetrages" :key="metrage.id">
                    <td>{{ formatDate(metrage.dateSaisie) }}</td>
                    <td>{{ metrage.zone }}</td>
                    <td>{{ metrage.period === 'month' ? 'Fin de mois' : 'Fin de projet' }}</td>
                    <td>{{ metrage.nombreProduits }}</td>
                    <td>{{ metrage.heuresPrevues.toFixed(1) }}h</td>
                    <td>{{ metrage.heuresImployees.toFixed(1) }}h</td>
                    <td>{{ metrage.heuresGagnees > 0 ? 'Oui' : 'Non' }}</td>
                    <td>{{ metrage.remarques || '-' }}</td>
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
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

const chantiers = ref([]);
const devisData = ref(null);
const zones = ref([]);
const zoneProducts = ref([]);
const zoneSupplements = ref([]);
const heuresPropres = ref([]);
const heuresInterim = ref([]);
const collaborateurs = ref([]);
const selectedChantierId = ref('');
const selectedZone = ref('');
const selectedPeriod = ref('month');
const saisieDate = ref('');
const remarques = ref('');
const metragesData = ref(null);
const historiqueMetrages = ref([]);

// Nouveau supplément
const newSupplement = ref({
  type: '',
  qte: 0
});

// Nouveau produit
const newProduct = ref({
  selectedId: '',
  quantitePosee: 0
});

// Produits disponibles et sélectionnés
const availableProducts = ref([]);
const selectedProducts = ref([]);

// Imposta data di default
const setDefaultDate = () => {
  const today = new Date();
  saisieDate.value = today.toISOString().split('T')[0];
};

const fetchChantiers = async () => {
  const snapshot = await getDocs(collection(db, 'chantiers'));
  chantiers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchCollaborateurs = async () => {
  const snapshot = await getDocs(collection(db, 'collaborateurs'));
  collaborateurs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchHeuresPropres = async () => {
  const snapshot = await getDocs(collection(db, 'heures_chef_propres'));
  heuresPropres.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchHeuresInterim = async () => {
  const snapshot = await getDocs(collection(db, 'heures_chef_interim'));
  heuresInterim.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const loadDevisData = async () => {
  if (!selectedChantierId.value) return;
  
  try {
    // Trova il cantiere selezionato
    const chantier = chantiers.value.find(c => c.id === selectedChantierId.value);
    if (!chantier || !chantier.devisId) {
      alert('Ce chantier n\'a pas de devis associé. Veuillez contacter l\'administrateur.');
      devisData.value = null;
      zones.value = [];
      return;
    }
    
    // Carica il devis associato
    const devisDoc = await getDoc(doc(db, 'devis', chantier.devisId));
    if (!devisDoc.exists()) {
      alert('Devis non trouvé. Veuillez contacter l\'administrateur.');
      devisData.value = null;
      zones.value = [];
      return;
    }
    
    devisData.value = devisDoc.data();
    
    // Estrai le zone dai prodotti
    if (devisData.value.produits && devisData.value.produits.length > 0) {
      const zoneSet = new Set();
      devisData.value.produits.forEach(produit => {
        if (produit.zone) {
          zoneSet.add(produit.zone);
        }
      });
      zones.value = Array.from(zoneSet).sort();
    } else {
      alert('Aucun produit trouvé dans ce devis.');
      zones.value = [];
    }
    
    // Reset selezione zona
    selectedZone.value = '';
    zoneProducts.value = [];
    zoneSupplements.value = [];
    
  } catch (error) {
    console.error('Erreur lors du chargement du devis:', error);
    alert('Erreur lors du chargement du devis: ' + error.message);
    devisData.value = null;
    zones.value = [];
  }
};

const loadZoneProducts = () => {
  if (!selectedZone.value || !devisData.value) return;
  
  // Filtra prodotti per zona
  zoneProducts.value = devisData.value.produits
    .filter(produit => produit.zone === selectedZone.value)
    .map(produit => ({
      id: produit.id || `prod_${Math.random()}`,
      codeArticle: produit.codeArticle || '',
      produit: produit.produit || produit.article || '',
      taille: produit.taille || '',
      unite: produit.unite || 'm',
      quantiteML: produit.quantiteML || produit.quantite || 0,
      prixUnit: produit.prixUnit || produit.prixUnitaire || 0,
      total: produit.total || 0,
      quantitePosee: 0
    }));

  // Filtra suppléments per zona (se esistono)
  if (devisData.value.supplements) {
    zoneSupplements.value = devisData.value.supplements
      .filter(supp => supp.zone === selectedZone.value)
             .map(supp => ({
         id: supp.id || `supp_${Math.random()}`,
         codeArticle: supp.codeArticle || '',
         produit: supp.produit || '',
         supplement: supp.supplement || '',
         taille: supp.taille || '',
         qte: supp.qte || 0,
         totalML: supp.totalML || 0,
         quantitePosee: 0
       }));
  } else {
    zoneSupplements.value = [];
  }
  
  // Mise à jour des produits disponibles
  availableProducts.value = zoneProducts.value;
  selectedProducts.value = [];
  
  // Reset nouveau produit
  newProduct.value = {
    selectedId: '',
    quantitePosee: 0
  };
  
  calculateMetrages();
};

const addNewSupplement = () => {
  if (!canAddSupplement.value) return;
  
  const supplement = {
    id: `new_supp_${Date.now()}`,
    codeArticle: 'N/A',
    produit: 'Chemin de Câble 60',
    supplement: newSupplement.value.type,
    taille: '',
    qte: newSupplement.value.qte,
    totalML: newSupplement.value.qte,
    quantitePosee: 0,
    isNew: true
  };
  
  zoneSupplements.value.push(supplement);
  
  // Reset form
  newSupplement.value = {
    type: '',
    qte: 0
  };
  
  calculateMetrages();
};

const removeSupplement = (supplementId) => {
  const index = zoneSupplements.value.findIndex(s => s.id === supplementId);
  if (index > -1) {
    zoneSupplements.value.splice(index, 1);
    calculateMetrages();
  }
};



const addNewProduct = () => {
  if (!canAddProduct.value) return;
  
  const selectedProduct = availableProducts.value.find(p => p.id === newProduct.value.selectedId);
  if (!selectedProduct) return;
  
  const product = {
    ...selectedProduct,
    quantitePosee: newProduct.value.quantitePosee,
    isNew: true
  };
  
  selectedProducts.value.push(product);
  
  // Retirer du menu des produits disponibles
  const index = availableProducts.value.findIndex(p => p.id === newProduct.value.selectedId);
  if (index > -1) {
    availableProducts.value.splice(index, 1);
  }
  
  // Reset form
  newProduct.value = {
    selectedId: '',
    quantitePosee: 0,
    prixUnit: 0
  };
  
  calculateMetrages();
};

const removeProduct = (productId) => {
  const index = selectedProducts.value.findIndex(p => p.id === productId);
  if (index > -1) {
    const product = selectedProducts.value[index];
    selectedProducts.value.splice(index, 1);
    
    // Remettre dans les produits disponibles
    availableProducts.value.push({
      ...product,
      quantitePosee: 0,
      isNew: false
    });
    
    calculateMetrages();
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

const canSave = computed(() => {
  const hasProductQuantities = selectedProducts.value.some(p => p.quantitePosee > 0);
  const hasSupplementQuantities = zoneSupplements.value.some(s => s.quantitePosee > 0);
  return selectedChantierId.value && 
         selectedZone.value &&
         (hasProductQuantities || hasSupplementQuantities) &&
         saisieDate.value;
});

const canAddSupplement = computed(() => {
  return newSupplement.value.type && 
         newSupplement.value.qte > 0;
});

const canAddProduct = computed(() => {
  return newProduct.value.selectedId && 
         newProduct.value.quantitePosee > 0;
});

const calculateMetrages = () => {
  if (!selectedChantierId.value || (selectedProducts.value.length === 0 && zoneSupplements.value.length === 0)) {
    metragesData.value = null;
    return;
  }

  // Calcola ore previste basate sui metri lineari
  const metresPerHour = 10; // Metri lineari per ora (valore standard)
  
  let totalMetresPrevu = 0;
  let totalMetresPose = 0;
  
  // Calcola per prodotti principaux sélectionnés
  selectedProducts.value.forEach(product => {
    totalMetresPrevu += product.quantiteML || 0;
    totalMetresPose += product.quantitePosee || 0;
  });

  // Calcola per suppléments
  zoneSupplements.value.forEach(supplement => {
    totalMetresPrevu += supplement.qte || 0;
    totalMetresPose += supplement.quantitePosee || 0;
  });
  
  // Calcola ore previste basate sui metri
  const heuresPrevues = totalMetresPrevu / metresPerHour;
  
  // Calcola ore impiegate (dal cantiere selezionato)
  const heuresChefChantier = heuresPropres.value.filter(h => h.chantierId === selectedChantierId.value);
  const heuresCollaborateursChantier = heuresInterim.value.filter(h => h.chantierId === selectedChantierId.value);
  
  const totalHeuresChef = heuresChefChantier.reduce((sum, h) => sum + h.heuresPropres, 0);
  const totalHeuresCollaborateurs = heuresCollaborateursChantier.reduce((sum, h) => sum + h.heuresInterim, 0);
  const heuresImployees = totalHeuresChef + totalHeuresCollaborateurs;
  
  // Calcola ore guadagnate
  const heuresGagnees = Math.max(0, heuresPrevues - heuresImployees);
  
  metragesData.value = {
    totalHeuresPrevues: heuresPrevues,
    totalHeuresImployees: heuresImployees,
    heuresGagnees,
    totalMetresPrevu,
    totalMetresPose
  };
};

const saveMetrages = async () => {
  if (!canSave.value) return;
  
  try {
    const metrageData = {
      chantierId: selectedChantierId.value,
      zone: selectedZone.value,
      dateSaisie: saisieDate.value,
      period: selectedPeriod.value,
      remarques: remarques.value,
             produits: selectedProducts.value.map(p => ({
         id: p.id,
         codeArticle: p.codeArticle,
         produit: p.produit,
         quantitePrevue: p.quantiteML,
         quantitePosee: p.quantitePosee || 0
       })),
             supplements: zoneSupplements.value.map(s => ({
         id: s.id,
         codeArticle: s.codeArticle,
         supplement: s.supplement,
         quantitePrevue: s.qte,
         quantitePosee: s.quantitePosee || 0
       })),
      heuresPrevues: metragesData.value.totalHeuresPrevues,
      heuresImployees: metragesData.value.totalHeuresImployees,
      heuresGagnees: metragesData.value.heuresGagnees,
             nombreProduits: selectedProducts.value.length + zoneSupplements.value.length,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'metrages'), metrageData);
    
         // Reset form
     selectedProducts.value.forEach(p => p.quantitePosee = 0);
     zoneSupplements.value.forEach(s => s.quantitePosee = 0);
     remarques.value = '';
    
    alert('Métrages enregistrés avec succès!');
    
    // Ricarica storico
    loadHistoriqueMetrages();
    
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    alert('Erreur lors de l\'enregistrement: ' + error.message);
  }
};

const loadHistoriqueMetrages = async () => {
  if (!selectedChantierId.value) return;
  
  try {
    const q = query(collection(db, 'metrages'), where('chantierId', '==', selectedChantierId.value));
    const snapshot = await getDocs(q);
    historiqueMetrages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error);
  }
};

onMounted(async () => {
  await Promise.all([
    fetchChantiers(),
    fetchCollaborateurs(),
    fetchHeuresPropres(),
    fetchHeuresInterim()
  ]);
  setDefaultDate();
});
</script>

<style scoped>
.card {
  margin-bottom: 1rem;
}
</style>
