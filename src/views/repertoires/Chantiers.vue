<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Chantiers</h2>

    <!-- Tabs per anagrafica e gestione -->
    <ul class="nav nav-tabs mb-4" id="chantierTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button class="nav-link active" id="anagrafica-tab" data-bs-toggle="tab" data-bs-target="#anagrafica" type="button" role="tab">
          Anagrafica
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" id="gestion-tab" data-bs-toggle="tab" data-bs-target="#gestion" type="button" role="tab">
          Gestion Chantiers
        </button>
      </li>
    </ul>

    <div class="tab-content" id="chantierTabContent">
      <!-- Tab Anagrafica -->
      <div class="tab-pane fade show active" id="anagrafica" role="tabpanel">
        <form @submit.prevent="addChantier" class="row g-3 mb-4">
          <div class="col-md-3">
            <input v-model="newChantier.numeroCantiere" type="text" class="form-control" placeholder="Numéro Cantiere" required />
          </div>
          <div class="col-md-3">
            <input v-model="newChantier.nom" type="text" class="form-control" placeholder="Nom" required />
          </div>
          <div class="col-md-3">
            <input v-model="newChantier.adresse" type="text" class="form-control" placeholder="Adresse" required />
          </div>
          <div class="col-md-3">
            <input v-model="newChantier.ville" type="text" class="form-control" placeholder="Ville" required />
          </div>
          <div class="col-md-4">
            <select v-model="newChantier.client" class="form-select" required>
              <option disabled value="">Sélectionner le client</option>
              <option v-for="client in clients" :key="client.id" :value="client.nom">
                {{ client.nom }}
              </option>
            </select>
          </div>
          <div class="col-md-4">
            <select v-model="newChantier.technicien" class="form-select" required>
              <option disabled value="">Sélectionner le technicien</option>
              <option v-for="tech in techniciens" :key="tech.id" :value="tech.nom">
                {{ tech.nom }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="newChantier.devisId" class="form-select">
              <option value="">Sélectionner un devis (optionnel)</option>
              <option v-for="devis in devis" :key="devis.id" :value="devis.id">
                {{ devis.numero }} - {{ devis.nom || devis.nomChantier }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="newChantier.modalitaResoconto" class="form-select" required>
              <option disabled value="">Modalité resoconto</option>
              <option value="metrages">📏 Métrages détaillés</option>
              <option value="percentuale">📊 Resoconto percentuel</option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="newChantier.capocantiere" class="form-select">
              <option value="">Sélectionner chef de chantier</option>
              <option v-for="chef in chefDeChantiers" :key="chef.id" :value="chef.email">
                {{ chef.nom }} {{ chef.prenom }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <label>Prix régie/h (CHF)</label>
            <input v-model.number="newChantier.prixRegie" placeholder="65" class="form-control" type="number" step="1" />
          </div>
          <div class="col-md-2">
            <label>% Impresa</label>
            <input v-model.number="newChantier.percentualeImpresa" placeholder="30" class="form-control" type="number" step="1" min="0" max="100" />
          </div>
          <div class="col-12 text-end">
            <button type="submit" class="btn btn-primary">Ajouter</button>
          </div>
        </form>

        <table class="table table-striped">
          <thead>
            <tr>
              <th>N° Cantiere</th>
              <th>Nom</th>
              <th>Adresse</th>
              <th>Ville</th>
              <th>Client</th>
              <th>Technicien</th>
              <th>Devis associé</th>
              <th>Modalité</th>
              <th>Chef Responsable</th>
              <th>Prix Régie/h</th>
              <th>% Impresa</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="chantier in chantiers" :key="chantier.id">
              <template v-if="editId === chantier.id">
                <td><input v-model="editChantier.numeroCantiere" class="form-control" /></td>
                <td><input v-model="editChantier.nom" class="form-control" /></td>
                <td><input v-model="editChantier.adresse" class="form-control" /></td>
                <td><input v-model="editChantier.ville" class="form-control" /></td>
                <td>
                  <select v-model="editChantier.client" class="form-select">
                    <option v-for="c in clients" :key="c.id" :value="c.nom">{{ c.nom }}</option>
                  </select>
                </td>
                <td>
                  <select v-model="editChantier.technicien" class="form-select">
                    <option v-for="t in techniciens" :key="t.id" :value="t.nom">{{ t.nom }}</option>
                  </select>
                </td>
                <td>
                  <select v-model="editChantier.devisId" class="form-select">
                    <option value="">Aucun devis</option>
                    <option v-for="devis in devis" :key="devis.id" :value="devis.id">
                      {{ devis.numero }} - {{ devis.nom || devis.nomChantier }}
                    </option>
                  </select>
                </td>
                <td>
                  <select v-model="editChantier.modalitaResoconto" class="form-select">
                    <option value="metrages">📏 Métrages</option>
                    <option value="percentuale">📊 Percentuel</option>
                  </select>
                </td>
                <td>
                  <select v-model="editChantier.capocantiere" class="form-select">
                    <option value="">Aucun chef</option>
                    <option v-for="chef in chefDeChantiers" :key="chef.id" :value="chef.email">
                      {{ chef.nom }} {{ chef.prenom }}
                    </option>
                  </select>
                </td>
                <td>
                  <input v-model.number="editChantier.prixRegie" class="form-control" type="number" step="1" placeholder="65">
                </td>
                <td>
                  <input v-model.number="editChantier.percentualeImpresa" class="form-control" type="number" step="1" min="0" max="100" placeholder="30">
                </td>
                <td>
                  <button class="btn btn-success btn-sm" @click="updateChantier(chantier.id)">✔</button>
                  <button class="btn btn-secondary btn-sm" @click="cancelEdit">✖</button>
                </td>
              </template>
              <template v-else>
                <td><strong>{{ chantier.numeroCantiere || 'N/A' }}</strong></td>
                <td>{{ chantier.nom }}</td>
                <td>{{ chantier.adresse }}</td>
                <td>{{ chantier.ville }}</td>
                <td>{{ chantier.client }}</td>
                <td>{{ chantier.technicien }}</td>
                <td>{{ getDevisName(chantier.devisId) }}</td>
                <td>
                  <span class="badge" :class="chantier.modalitaResoconto === 'percentuale' ? 'bg-info' : 'bg-secondary'">
                    {{ chantier.modalitaResoconto === 'percentuale' ? '📊 Percentuel' : '📏 Métrages' }}
                  </span>
                </td>
                <td>{{ getChefName(chantier.capocantiere) }}</td>
                <td>{{ chantier.prixRegie || '-' }} CHF</td>
                <td>{{ chantier.percentualeImpresa || 30 }}%</td>
                <td>
                  <button class="btn btn-warning btn-sm" @click="startEdit(chantier)">✎</button>
                  <button class="btn btn-danger btn-sm" @click="deleteChantier(chantier.id)">🗑</button>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab Gestion Chantiers -->
      <div class="tab-pane fade" id="gestion" role="tabpanel">
        <div class="row mb-4">
          <div class="col-md-6">
            <h4>Sélectionner un chantier</h4>
            <select v-model="selectedChantierId" class="form-select" @change="loadChantierData">
              <option value="">Choisir un chantier</option>
              <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                {{ chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '' }}{{ chantier.nom }} - {{ chantier.adresse }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="selectedChantier" class="row">
          <div class="col-md-8">
            <h4>{{ selectedChantier.numeroCantiere ? `N° ${selectedChantier.numeroCantiere} - ` : '' }}{{ selectedChantier.nom }}</h4>
            <p class="text-muted">{{ selectedChantier.adresse }}, {{ selectedChantier.ville }}</p>
            <p v-if="devisAssocie"><strong>Devis associé:</strong> {{ devisAssocie.numero }} - {{ devisAssocie.nomChantier }}</p>
          </div>
          <div class="col-md-4 text-end">
            <select v-model="selectedChantier.statut" class="form-select" @change="updateStatut">
              <option value="En attente">En attente</option>
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
            </select>
          </div>
        </div>

        <div v-if="selectedChantier" class="row mt-4">
          <div class="col-md-6">
            <h5>Heures travaillées</h5>
            <div class="mb-3">
              <label>Date:</label>
              <input v-model="newHeure.date" type="date" class="form-control" />
            </div>
            <div class="mb-3">
              <label>Collaborateur:</label>
              <select v-model="newHeure.collaborateurId" class="form-control">
                <option value="">Sélectionner</option>
                <option v-for="collab in collaborateurs" :key="collab.id" :value="collab.id">
                  {{ collab.nom }} {{ collab.prenom }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label>Heures propres:</label>
              <input v-model.number="newHeure.heuresPropres" type="number" step="0.5" class="form-control" />
            </div>
            <div class="mb-3">
              <label>Heures intérimaires:</label>
              <input v-model.number="newHeure.heuresInterim" type="number" step="0.5" class="form-control" />
            </div>
            <button @click="addHeure" class="btn btn-primary">Ajouter</button>
          </div>
          
          <div class="col-md-6">
            <h5>Liste des heures</h5>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Collaborateur</th>
                  <th>Propres</th>
                  <th>Intérim</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="heure in heures" :key="heure.id">
                  <td>{{ formatDate(heure.date) }}</td>
                  <td>{{ getCollaborateurName(heure.collaborateurId) }}</td>
                  <td>{{ heure.heuresPropres || 0 }}</td>
                  <td>{{ heure.heuresInterim || 0 }}</td>
                  <td>
                    <button @click="deleteHeure(heure.id)" class="btn btn-danger btn-sm">🗑</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="selectedChantier && produitsDevis.length > 0" class="row mt-4">
          <div class="col-md-6">
            <h5>Œuvres réalisées</h5>
            <div class="mb-3">
              <label>Date:</label>
              <input v-model="newOeuvre.date" type="date" class="form-control" />
            </div>
            <div class="mb-3">
              <label>Produit:</label>
              <select v-model="newOeuvre.produitId" class="form-control">
                <option value="">Sélectionner</option>
                <option v-for="produit in produitsDevis" :key="produit.id" :value="produit.id">
                  {{ produit.article }} - {{ produit.description }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label>Quantité réalisée:</label>
              <input v-model.number="newOeuvre.quantite" type="number" step="0.01" class="form-control" />
            </div>
            <button @click="addOeuvre" class="btn btn-success">Ajouter</button>
          </div>
          
          <div class="col-md-6">
            <h5>Liste des œuvres</h5>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="oeuvre in oeuvres" :key="oeuvre.id">
                  <td>{{ formatDate(oeuvre.date) }}</td>
                  <td>{{ getProduitName(oeuvre.produitId) }}</td>
                  <td>{{ oeuvre.quantite }}</td>
                  <td>
                    <button @click="deleteOeuvre(oeuvre.id)" class="btn btn-danger btn-sm">🗑</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="selectedChantier" class="row mt-4">
          <div class="col-md-6">
            <h5>Résumé des heures</h5>
            <p><strong>Total heures propres:</strong> {{ totalHeuresPropres }}</p>
            <p><strong>Total heures intérimaires:</strong> {{ totalHeuresInterim }}</p>
            <p><strong>Total général:</strong> {{ totalHeuresGeneral }}</p>
          </div>
          <div class="col-md-6">
            <h5>Résumé des œuvres</h5>
            <div v-for="oeuvre in resumeOeuvres" :key="oeuvre.produitId">
              <p><strong>{{ oeuvre.nom }}:</strong> {{ oeuvre.quantiteTotale }} {{ oeuvre.unite }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

export default {
  name: 'Chantiers',
  components: {
    RetourButton
  },
  setup() {
    const chantiers = ref([]);
    const clients = ref([]);
    const techniciens = ref([]);
    const devis = ref([]);
    const collaborateurs = ref([]);
    const chefDeChantiers = ref([]);
    const heures = ref([]);
    const oeuvres = ref([]);
    const produitsDevis = ref([]);

    const selectedChantierId = ref('');
    const selectedChantier = ref(null);
    const devisAssocie = ref(null);

    const newChantier = ref({
      numeroCantiere: '',
      nom: '',
      adresse: '',
      ville: '',
      client: '',
      technicien: '',
      devisId: '',
      modalitaResoconto: 'metrages',
      capocantiere: '',
      prixRegie: 65,
      percentualeImpresa: 30
    });

    const newHeure = ref({
      date: new Date().toISOString().split('T')[0],
      collaborateurId: '',
      heuresPropres: 0,
      heuresInterim: 0
    });

    const newOeuvre = ref({
      date: new Date().toISOString().split('T')[0],
      produitId: '',
      quantite: 0
    });

    const editId = ref(null);
    const editChantier = ref({});

    const fetchChantiers = async () => {
      const snapshot = await getDocs(collection(db, 'chantiers'));
      chantiers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchClients = async () => {
      const snapshot = await getDocs(collection(db, 'clients'));
      clients.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchTechniciens = async () => {
      const snapshot = await getDocs(collection(db, 'techniciens'));
      techniciens.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchDevis = async () => {
      const snapshot = await getDocs(collection(db, 'devis'));
      devis.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchCollaborateurs = async () => {
      const snapshot = await getDocs(collection(db, 'collaborateurs'));
      collaborateurs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchChefDeChantiers = async () => {
      const snapshot = await getDocs(collection(db, 'chefdechantiers'));
      chefDeChantiers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const loadChantierData = async () => {
      if (!selectedChantierId.value) {
        selectedChantier.value = null;
        devisAssocie.value = null;
        heures.value = [];
        oeuvres.value = [];
        produitsDevis.value = [];
        return;
      }

      selectedChantier.value = chantiers.value.find(c => c.id === selectedChantierId.value);
      
      if (selectedChantier.value?.devisId) {
        await fetchDevisAssocie();
        await fetchProduitsDevis();
      }
      
      await fetchHeures();
      await fetchOeuvres();
    };

    const fetchDevisAssocie = async () => {
      if (!selectedChantier.value?.devisId) return;
      
      const docRef = doc(db, 'devis', selectedChantier.value.devisId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        devisAssocie.value = { id: docSnap.id, ...docSnap.data() };
      }
    };

    const fetchProduitsDevis = async () => {
      if (!selectedChantier.value?.devisId) return;
      
      const snapshot = await getDocs(collection(db, 'devis', selectedChantier.value.devisId, 'produits'));
      produitsDevis.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchHeures = async () => {
      if (!selectedChantierId.value) return;
      
      const snapshot = await getDocs(collection(db, 'chantiers', selectedChantierId.value, 'heures'));
      heures.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchOeuvres = async () => {
      if (!selectedChantierId.value) return;
      
      const snapshot = await getDocs(collection(db, 'chantiers', selectedChantierId.value, 'oeuvres'));
      oeuvres.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const addChantier = async () => {
      await addDoc(collection(db, 'chantiers'), newChantier.value);
      newChantier.value = { numeroCantiere: '', nom: '', adresse: '', ville: '', client: '', technicien: '', devisId: '', modalitaResoconto: 'metrages', capocantiere: '', prixRegie: 65, percentualeImpresa: 30 };
      fetchChantiers();
    };

    const addHeure = async () => {
      if (!newHeure.value.collaborateurId || !newHeure.value.date || !selectedChantierId.value) return;
      
      await addDoc(collection(db, 'chantiers', selectedChantierId.value, 'heures'), {
        date: newHeure.value.date,
        collaborateurId: newHeure.value.collaborateurId,
        heuresPropres: newHeure.value.heuresPropres || 0,
        heuresInterim: newHeure.value.heuresInterim || 0
      });
      
      newHeure.value = {
        date: new Date().toISOString().split('T')[0],
        collaborateurId: '',
        heuresPropres: 0,
        heuresInterim: 0
      };
      fetchHeures();
    };

    const addOeuvre = async () => {
      if (!newOeuvre.value.produitId || !newOeuvre.value.date || !selectedChantierId.value) return;
      
      await addDoc(collection(db, 'chantiers', selectedChantierId.value, 'oeuvres'), {
        date: newOeuvre.value.date,
        produitId: newOeuvre.value.produitId,
        quantite: newOeuvre.value.quantite
      });
      
      newOeuvre.value = {
        date: new Date().toISOString().split('T')[0],
        produitId: '',
        quantite: 0
      };
      fetchOeuvres();
    };

    const deleteHeure = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'chantiers', selectedChantierId.value, 'heures', id));
        fetchHeures();
      }
    };

    const deleteOeuvre = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'chantiers', selectedChantierId.value, 'oeuvres', id));
        fetchOeuvres();
      }
    };

    const updateStatut = async () => {
      if (!selectedChantierId.value) return;
      
      await updateDoc(doc(db, 'chantiers', selectedChantierId.value), {
        statut: selectedChantier.value.statut
      });
    };

    const startEdit = (chantier) => {
      editId.value = chantier.id;
      editChantier.value = { ...chantier };
    };

    const cancelEdit = () => {
      editId.value = null;
      editChantier.value = {};
    };

    const updateChantier = async (id) => {
      const docRef = doc(db, 'chantiers', id);
      await updateDoc(docRef, editChantier.value);
      cancelEdit();
      fetchChantiers();
    };

    const deleteChantier = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'chantiers', id));
        fetchChantiers();
      }
    };

    const getDevisName = (devisId) => {
      if (!devisId) return '-';
      const devisObj = devis.value.find(d => d.id === devisId);
      return devisObj ? `${devisObj.numero} - ${devisObj.nomChantier}` : '-';
    };

    const getCollaborateurName = (id) => {
      const collab = collaborateurs.value.find(c => c.id === id);
      return collab ? `${collab.nom} ${collab.prenom}` : '-';
    };

    const getChefName = (email) => {
      if (!email) return '-';
      const chef = chefDeChantiers.value.find(c => c.email === email);
      return chef ? `${chef.nom} ${chef.prenom}` : email;
    };

    const getProduitName = (id) => {
      const produit = produitsDevis.value.find(p => p.id === id);
      return produit ? `${produit.article} - ${produit.description}` : '-';
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('fr-FR');
    };

    // Computed properties
    const totalHeuresPropres = computed(() => {
      return heures.value.reduce((sum, h) => sum + (h.heuresPropres || 0), 0);
    });

    const totalHeuresInterim = computed(() => {
      return heures.value.reduce((sum, h) => sum + (h.heuresInterim || 0), 0);
    });

    const totalHeuresGeneral = computed(() => {
      return totalHeuresPropres.value + totalHeuresInterim.value;
    });

    const resumeOeuvres = computed(() => {
      const resume = {};
      oeuvres.value.forEach(oeuvre => {
        const produit = produitsDevis.value.find(p => p.id === oeuvre.produitId);
        if (produit) {
          if (!resume[oeuvre.produitId]) {
            resume[oeuvre.produitId] = {
              produitId: oeuvre.produitId,
              nom: produit.article,
              unite: produit.unite,
              quantiteTotale: 0
            };
          }
          resume[oeuvre.produitId].quantiteTotale += oeuvre.quantite;
        }
      });
      return Object.values(resume);
    });

    onMounted(() => {
      fetchChantiers();
      fetchClients();
      fetchTechniciens();
      fetchDevis();
      fetchCollaborateurs();
      fetchChefDeChantiers();
    });

    return {
      chantiers,
      newChantier,
      addChantier,
      editId,
      editChantier,
      startEdit,
      cancelEdit,
      updateChantier,
      deleteChantier,
      clients,
      techniciens,
      devis,
      collaborateurs,
      chefDeChantiers,
      selectedChantierId,
      selectedChantier,
      devisAssocie,
      heures,
      oeuvres,
      produitsDevis,
      newHeure,
      newOeuvre,
      loadChantierData,
      addHeure,
      addOeuvre,
      deleteHeure,
      deleteOeuvre,
      updateStatut,
      getDevisName,
      getCollaborateurName,
      getProduitName,
      formatDate,
      totalHeuresPropres,
      totalHeuresInterim,
      totalHeuresGeneral,
      resumeOeuvres,
      getChefName
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: auto;
}
.table th, .table td {
  vertical-align: middle;
}
</style>
