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
            <select v-model="newChantier.technicien" class="form-select" required :disabled="!newChantier.client">
              <option disabled value="">{{ !newChantier.client ? 'Sélectionner d\'abord un client' : 'Sélectionner le technicien' }}</option>
              <option v-for="tech in filteredTechniciens" :key="tech.id" :value="tech.nom">
                {{ tech.nom }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="newChantier.devisId" class="form-select" :disabled="!newChantier.client">
              <option value="">{{ !newChantier.client ? 'Sélectionner d\'abord un client' : 'Sélectionner un devis (optionnel)' }}</option>
              <option v-for="devis in filteredDevis" :key="devis.id" :value="devis.id">
                {{ devis.numero }} - {{ devis.nom || devis.adresse }}
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
            <div class="input-group">
              <input v-model.number="newChantier.prixRegie" class="form-control" type="number" step="1" />
              <span class="input-group-text">CHF</span>
            </div>
            <small class="text-muted">Défaut: {{ newChantier.prixRegie || 75 }} CHF</small>
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
              <th>État</th>
              <th>Interne</th>
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
                  <input v-model.number="editChantier.prixRegie" class="form-control" type="number" step="1" placeholder="75">
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
                <td><strong>{{ chantier.numero_cantiere || 'N/A' }}</strong></td>
                <td>{{ chantier.nom }}</td>
                <td>{{ chantier.adresse }}</td>
                <td>{{ chantier.ville }}</td>
                <td>{{ chantier.client }}</td>
                <td>{{ chantier.technicien }}</td>
                <td>
                  <span v-if="chantier.devis_id || chantier.devisId" class="badge bg-success">Oui</span>
                  <span v-else class="badge bg-warning">Non</span>
                </td>
                <td>
                  <span class="badge" :class="chantier.modalita_resoconto === 'percentuale' ? 'bg-info' : 'bg-secondary'">
                    {{ chantier.modalita_resoconto === 'percentuale' ? '📊 Percentuel' : '📏 Métrages' }}
                  </span>
                </td>
                <td>{{ getChefName(chantier.capocantiere) }}</td>
                <td>{{ chantier.prix_regie || '-' }} CHF</td>
                <td>{{ chantier.percentuale_impresa || 30 }}%</td>
                <td>
                  <span class="badge me-1" :class="{
                    'bg-warning': !chantier.stato_cantiere || chantier.stato_cantiere === 'a_commencer',
                    'bg-success': chantier.stato_cantiere === 'en_cours',
                    'bg-secondary': chantier.stato_cantiere === 'ferme'
                  }">
                    {{ chantier.stato_cantiere === 'en_cours' ? 'En cours' : chantier.stato_cantiere === 'ferme' ? 'Fermé' : 'À commencer' }}
                  </span>
                  <select 
                    v-model="chantier.stato_cantiere"
                    class="form-select form-select-sm d-inline-block w-auto"
                    @change="updateStatoCantiere(chantier, chantier.stato_cantiere)"
                  >
                    <option value="a_commencer">À commencer</option>
                    <option value="en_cours">En cours</option>
                    <option value="ferme">Fermé</option>
                  </select>
                </td>
                <td>
                  <input type="checkbox" class="form-check-input" :checked="chantier.type === 'interne'" @change="toggleInterne(chantier)">
                </td>
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
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '../../supabase.js';
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
      prixRegie: 75,
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
      const { data, error } = await supabase.from('chantiers').select('*').order('nom');
      if (!error) chantiers.value = data || [];
    };

    const fetchClients = async () => {
      const { data, error } = await supabase.from('clients').select('*').order('nom');
      if (!error) clients.value = data || [];
    };

    const fetchTechniciens = async () => {
      const { data, error } = await supabase.from('techniciens').select('*').order('nom');
      if (!error) techniciens.value = data || [];
    };

    const fetchDevis = async () => {
      try {
        const { data, error } = await supabase
          .from('devis')
          .select('id, numero, nom, adresse, client_id')
          .order('numero', { ascending: false });
        
        if (error) throw error;
        devis.value = data || [];
      } catch (error) {
        console.error('Erreur chargement devis:', error);
        devis.value = [];
      }
    };

    const fetchCollaborateurs = async () => {
      // TODO: Implementare quando collaborateurs saranno migrati
      collaborateurs.value = [];
    };

    const fetchChefDeChantiers = async () => {
      try {
        const { data, error } = await supabase
          .from('chefdechantiers')
          .select('*')
          .order('nom');
        
        if (error) throw error;
        chefDeChantiers.value = data || [];
      } catch (error) {
        console.error('Erreur chargement chef de chantiers:', error);
        chefDeChantiers.value = [];
      }
    };

    const fetchPrixRegieDefault = async () => {
      try {
        const { data, error } = await supabase
          .from('configuration')
          .select('prix_default')
          .eq('type', 'regies')
          .single();
        
        if (data && !error) {
          newChantier.value.prixRegie = data.prix_default || 75;
        } else {
          newChantier.value.prixRegie = 75;
        }
      } catch (error) {
        console.log('Utilisation prix par défaut: 75 CHF');
        newChantier.value.prixRegie = 75;
      }
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
      
      // TODO: Implementare quando devis saranno migrati
      devisAssocie.value = null;
    };

    const fetchProduitsDevis = async () => {
      if (!selectedChantier.value?.devisId) return;
      
      // TODO: Implementare quando devis saranno migrati
      produitsDevis.value = [];
    };

    const fetchHeures = async () => {
      if (!selectedChantierId.value) return;
      
      // TODO: Implementare quando heures saranno migrate
      heures.value = [];
    };

    const fetchOeuvres = async () => {
      if (!selectedChantierId.value) return;
      
      // TODO: Implementare quando oeuvres saranno migrate
      oeuvres.value = [];
    };

    const addChantier = async () => {
      // Determina type_metrage basato su modalita_resoconto
      const typeMetrage = newChantier.value.modalitaResoconto === 'percentuale' ? 'percentuel' : 'detaille';
      
      const { error } = await supabase.from('chantiers').insert([{
        numero_cantiere: newChantier.value.numeroCantiere,
        nom: newChantier.value.nom,
        adresse: newChantier.value.adresse,
        ville: newChantier.value.ville,
        client: newChantier.value.client,
        technicien: newChantier.value.technicien,
        devis_id: newChantier.value.devisId || null,
        modalita_resoconto: newChantier.value.modalitaResoconto,
        type_metrage: typeMetrage,
        capocantiere: newChantier.value.capocantiere,
        prix_regie: newChantier.value.prixRegie,
        percentuale_impresa: newChantier.value.percentualeImpresa
      }]);
      if (!error) {
        await fetchPrixRegieDefault();
        newChantier.value = { 
          numeroCantiere: '', 
          nom: '', 
          adresse: '', 
          ville: '', 
          client: '', 
          technicien: '', 
          devisId: '', 
          modalitaResoconto: 'metrages', 
          capocantiere: '', 
          prixRegie: newChantier.value.prixRegie, 
          percentualeImpresa: 30 
        };
        fetchChantiers();
      }
    };

    const addHeure = async () => {
      if (!newHeure.value.collaborateurId || !newHeure.value.date || !selectedChantierId.value) return;
      
      // TODO: Implementare quando heures saranno migrate
      console.log('Aggiunta ore non ancora implementata');
    };

    const addOeuvre = async () => {
      if (!newOeuvre.value.produitId || !newOeuvre.value.date || !selectedChantierId.value) return;
      
      // TODO: Implementare quando oeuvres saranno migrate
      console.log('Aggiunta oeuvre non ancora implementata');
    };

    const deleteHeure = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        // TODO: Implementare quando heures saranno migrate
        console.log('Eliminazione ore non ancora implementata');
      }
    };

    const deleteOeuvre = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        // TODO: Implementare quando oeuvres saranno migrate
        console.log('Eliminazione oeuvre non ancora implementata');
      }
    };

    const updateStatut = async () => {
      if (!selectedChantierId.value) return;
      
      const { error } = await supabase
        .from('chantiers')
        .update({ statut: selectedChantier.value.statut })
        .eq('id', selectedChantierId.value);
      
      if (error) console.error('Errore aggiornamento statut:', error);
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
      // Determina type_metrage basato su modalita_resoconto
      const typeMetrage = editChantier.value.modalitaResoconto === 'percentuale' ? 'percentuel' : 'detaille';
      
      const { error } = await supabase.from('chantiers').update({
        numero_cantiere: editChantier.value.numeroCantiere,
        nom: editChantier.value.nom,
        adresse: editChantier.value.adresse,
        ville: editChantier.value.ville,
        client: editChantier.value.client,
        technicien: editChantier.value.technicien,
        devis_id: editChantier.value.devisId || null,
        modalita_resoconto: editChantier.value.modalitaResoconto,
        type_metrage: typeMetrage,
        capocantiere: editChantier.value.capocantiere,
        prix_regie: editChantier.value.prixRegie,
        percentuale_impresa: editChantier.value.percentualeImpresa
      }).eq('id', id);
      if (!error) {
        cancelEdit();
        fetchChantiers();
      }
    };

    const deleteChantier = async (id) => {
      console.log('🗑️ Tentativo eliminazione cantiere ID:', id);
      if (confirm('Confirmer la suppression ? Cela supprimera aussi tous les métrages associés.')) {
        try {
          // Prima elimina i métrages associati
          const { error: metragesError } = await supabase
            .from('metrages')
            .delete()
            .eq('chantier_id', id);
          
          if (metragesError) {
            console.error('❌ Errore eliminazione métrages:', metragesError);
          }
          
          // Poi elimina il cantiere
          const { error } = await supabase.from('chantiers').delete().eq('id', id);
          if (error) {
            console.error('❌ Errore eliminazione cantiere:', error);
            alert('Erreur lors de la suppression: ' + error.message);
          } else {
            console.log('✅ Cantiere eliminato con successo');
            await fetchChantiers();
            alert('Chantier supprimé avec succès');
          }
        } catch (error) {
          console.error('❌ Errore generale:', error);
          alert('Erreur: ' + error.message);
        }
      }
    };

    const updateStatoCantiere = async (chantier, newValue) => {
      const { error } = await supabase
        .from('chantiers')
        .update({ stato_cantiere: newValue })
        .eq('id', chantier.id);
      if (error) {
        console.error('Erreur mise à jour stato_cantiere:', error);
      }
    };

    const toggleInterne = async (chantier) => {
      const newType = chantier.type === 'interne' ? 'chantier' : 'interne';
      await supabase.from('chantiers').update({ type: newType }).eq('id', chantier.id);
      fetchChantiers();
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
    const filteredDevis = computed(() => {
      if (!newChantier.value.client) return [];
      
      // Trova l'ID del cliente selezionato
      const selectedClient = clients.value.find(c => c.nom === newChantier.value.client);
      if (!selectedClient) return [];
      
      // Filtra devis per client_id
      return devis.value.filter(d => d.client_id == selectedClient.id);
    });

    const filteredTechniciens = computed(() => {
      if (!newChantier.value.client) return [];
      
      // Trova l'ID del cliente selezionato
      const selectedClient = clients.value.find(c => c.nom === newChantier.value.client);
      if (!selectedClient) return [];
      
      // Filtra techniciens per client_id
      return techniciens.value.filter(t => t.client_id == selectedClient.id);
    });

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

    // Watcher per resettare devis e technicien quando cambia cliente
    watch(() => newChantier.value.client, () => {
      newChantier.value.devisId = '';
      newChantier.value.technicien = '';
    });

    onMounted(() => {
      fetchChantiers();
      fetchClients();
      fetchTechniciens();
      fetchDevis();
      fetchCollaborateurs();
      fetchChefDeChantiers();
      fetchPrixRegieDefault();
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
      filteredTechniciens,
      devis,
      filteredDevis,
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
      getChefName,
      fetchPrixRegieDefault,
      toggleInterne,
      updateStatoCantiere
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
