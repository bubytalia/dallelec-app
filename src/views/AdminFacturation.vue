<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Gestion Facturation</h2>

    <!-- Resoconti et Métrages en attente -->
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <h5>Resoconti et Métrages en attente</h5>
          <small class="text-muted">Resoconti percentuels à approuver et métrages prêts pour facturation</small>
        </div>
        <button @click="pulirVecchiResoconti" class="btn btn-sm btn-warning">
          🧹 Nettoyer anciens tests
        </button>
      </div>
      <div class="card-body">
        <div v-if="resocontiEnAttente.length === 0 && metragesEnAttente.length === 0" class="text-center text-muted py-4">
          Aucun resoconto ou métrage en attente
        </div>
        <div v-else-if="resocontiEnAttente.length > 0 || metragesEnAttente.length > 0" class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Chantier</th>
                <th>Client</th>
                <th>Date</th>
                <th>Période</th>
                <th>Détails</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <!-- Resoconti percentuali -->
              <tr v-for="resoconto in resocontiEnAttente" :key="'r-' + resoconto.id">
                <td><span class="badge bg-info">📊 Percentuel</span></td>
                <td>{{ getChantierNameWithNumber(resoconto.chantierId) }}</td>
                <td>{{ getClientName(resoconto.chantierId) }}</td>
                <td>{{ formatDate(resoconto.createdAt) }}</td>
                <td>{{ resoconto.periodeMonth }}</td>
                <td>{{ Object.keys(resoconto.avancementi || {}).join(', ') }}</td>
                <td>
                  <button @click="voirDetailResoconto(resoconto)" class="btn btn-sm btn-info me-1">
                    👁
                  </button>
                  <button 
                    v-if="resoconto.status === 'approved'"
                    @click="generarFactureResoconto(resoconto)" 
                    class="btn btn-sm btn-warning me-1"
                  >
                    💰 Genera Fattura
                  </button>
                  <button 
                    v-else
                    @click="approuverResoconto(resoconto)" 
                    class="btn btn-sm btn-success me-1"
                  >
                    ✅
                  </button>
                  <button @click="eliminarResoconto(resoconto)" class="btn btn-sm btn-danger">
                    🗑
                  </button>
                </td>
              </tr>
              <!-- Métrages -->
              <tr v-for="metrage in metragesEnAttente" :key="'m-' + metrage.id">
                <td><span class="badge bg-secondary">📏 Métrage</span></td>
                <td>{{ getChantierNameWithNumber(metrage.chantierId) }}</td>
                <td>{{ getClientName(metrage.chantierId) }}</td>
                <td>{{ formatDate(metrage.createdAt) }}</td>
                <td>{{ formatPeriodeMetrage(metrage) }}</td>
                <td>{{ metrage.zones?.join(', ') || 'Toutes' }} - {{ metrage.totalML?.toFixed(2) || '0.00' }} ML</td>
                <td>
                  <button @click="voirDetailMetrage(metrage)" class="btn btn-sm btn-info me-1">
                    👁
                  </button>
                  <button @click="autoriserFacturation(metrage)" class="btn btn-sm btn-success me-1">
                    ✅
                  </button>
                  <button @click="eliminarMetrage(metrage)" class="btn btn-sm btn-danger">
                    🗑
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Factures récentes -->
    <div class="card mb-4">
      <div class="card-header">
        <h5>Factures récentes</h5>
      </div>
      <div class="card-body">
        <div v-if="facturesRecentes.length === 0" class="text-center text-muted py-4">
          Aucune facture récente
        </div>
        <div v-else class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Chantier</th>
                <th>Client</th>
                <th>Date</th>
                <th>Montant TTC</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="facture in facturesRecentes" :key="facture.id">
                <td><strong>{{ facture.numero }}</strong></td>
                <td>{{ getChantierName(facture.chantierId) }}</td>
                <td>{{ facture.clientNom }}</td>
                <td>{{ formatDate(facture.dateFacture) }}</td>
                <td>{{ formatCurrency(facture.montantTTC) }}</td>
                <td>
                  <span :class="getStatutClass(facture.statut)">
                    {{ getStatutLabel(facture.statut) }}
                  </span>
                </td>
                <td>
                  <button @click="modifierFacture(facture)" class="btn btn-sm btn-primary me-2">
                    ✏️ Modifier
                  </button>
                  <button @click="changerStatutFacture(facture)" class="btn btn-sm btn-warning me-2">
                    📝 Changer Statut
                  </button>
                  <button @click="genererPDF(facture)" class="btn btn-sm btn-info me-2">
                    📄 PDF
                  </button>
                  <button @click="supprimerFacture(facture)" class="btn btn-sm btn-danger" title="Supprimer (test)">
                    🗑
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="row">
      <div class="col-md-3">
        <div class="card bg-warning text-white text-center">
          <div class="card-body">
            <h6>En Attente</h6>
            <h4>{{ metragesEnAttente.length }}</h4>
            <small>Métrages à facturer</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-primary text-white text-center">
          <div class="card-body">
            <h6>Ce Mois</h6>
            <h4>{{ formatCurrency(facturationMois) }}</h4>
            <small>Facturé ce mois</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white text-center">
          <div class="card-body">
            <h6>Payées</h6>
            <h4>{{ formatCurrency(facturesPayees) }}</h4>
            <small>Factures payées</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-danger text-white text-center">
          <div class="card-body">
            <h6>En Retard</h6>
            <h4>{{ formatCurrency(facturesEnRetard) }}</h4>
            <small>Factures en retard</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Détail Resoconto -->
    <div v-if="showDetailResoconto" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5>Détail Resoconto - {{ getChantierName(detailResoconto.chantierId) }}</h5>
            <button @click="showDetailResoconto = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Informations Générales</h6>
                <p><strong>Chantier:</strong> {{ getChantierName(detailResoconto.chantierId) }}</p>
                <p><strong>Période:</strong> {{ detailResoconto.periodeMonth }}</p>
                <p><strong>Description:</strong> {{ detailResoconto.descrizione || '-' }}</p>
                <p><strong>Date soumission:</strong> {{ formatDate(detailResoconto.createdAt) }}</p>
              </div>
              <div class="col-md-6">
                <h6>Avancement par zone</h6>
                <div v-for="(percentage, zone) in detailResoconto.avancementi" :key="zone">
                  <p><strong>{{ zone }}:</strong> +{{ percentage }}%</p>
                </div>
              </div>
            </div>
            <div class="mt-3">
              <button @click="approuverResoconto(detailResoconto)" class="btn btn-success me-2">
                ✅ Approuver
              </button>
              <button @click="refuserResoconto(detailResoconto)" class="btn btn-danger me-2">
                ❌ Refuser
              </button>
              <button @click="showDetailResoconto = false" class="btn btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Détail Métrage -->
    <div v-if="showDetailMetrage" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5>Détail Métrage - {{ getChantierName(detailMetrage.chantierId) }}</h5>
            <button @click="showDetailMetrage = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Informations Générales</h6>
                <p><strong>Chantier:</strong> {{ getChantierName(detailMetrage.chantierId) }}</p>
                <p><strong>Client:</strong> {{ getClientName(detailMetrage.chantierId) }}</p>
                <p><strong>Date:</strong> {{ formatDate(detailMetrage.createdAt) }}</p>
                <p><strong>Chef:</strong> {{ detailMetrage.chefId }}</p>
              </div>
              <div class="col-md-6">
                <h6>Métrages</h6>
                <p><strong>Total ML:</strong> {{ detailMetrage.totalML?.toFixed(2) }} ML</p>
                <p><strong>Produits:</strong> {{ detailMetrage.totalProduits || 0 }}</p>
                <p><strong>Zones:</strong> {{ detailMetrage.zones?.join(', ') || 'N/A' }}</p>
                <p><strong>Montant Estimé:</strong> {{ formatCurrency(calculateMontantEstime(detailMetrage)) }}</p>
              </div>
            </div>
            <div class="mt-3">
              <button @click="autoriserFacturation(detailMetrage)" class="btn btn-success me-2">
                ✅ Autoriser Facturation
              </button>
              <button @click="showDetailMetrage = false" class="btn btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Modifier Facture -->
    <div v-if="showModifierFacture" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5>Modifier Facture {{ factureEnCours.numero }}</h5>
            <button @click="showModifierFacture = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label>Date Facture:</label>
              <input v-model="nouvelleDate" type="date" class="form-control">
              <small class="text-muted">Modifiez la date pour l'aligner au période de référence</small>
            </div>
            <div class="mb-3">
              <label>Date Échéance:</label>
              <input v-model="nouvelleDateEcheance" type="date" class="form-control">
            </div>
            <div class="mb-3">
              <label>Notes:</label>
              <textarea v-model="nouvellesNotes" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="confirmerModificationFacture" class="btn btn-primary">Sauvegarder</button>
            <button @click="showModifierFacture = false" class="btn btn-secondary">Annuler</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Changer Statut -->
    <div v-if="showChangeStatut" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5>Changer Statut Facture {{ factureEnCours.numero }}</h5>
            <button @click="showChangeStatut = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label>Nouveau Statut:</label>
              <select v-model="nouveauStatut" class="form-control">
                <option value="emise">Émise</option>
                <option value="envoyee">Envoyée</option>
                <option value="payee">Payée</option>
                <option value="en_retard">En retard</option>
              </select>
            </div>
            <div class="mb-3">
              <label>Notes (optionnel):</label>
              <textarea v-model="notesStatut" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="confirmerChangeStatut" class="btn btn-primary">Confirmer</button>
            <button @click="showChangeStatut = false" class="btn btn-secondary">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const metrages = ref([]);
const resocontiPercentuali = ref([]);
const factures = ref([]);
const chantiers = ref([]);
const devis = ref([]);

const showDetailMetrage = ref(false);
const detailMetrage = ref({});
const showDetailResoconto = ref(false);
const detailResoconto = ref({});
const showChangeStatut = ref(false);
const showModifierFacture = ref(false);
const factureEnCours = ref({});
const nouveauStatut = ref('');
const notesStatut = ref('');
const nouvelleDate = ref('');
const nouvelleDateEcheance = ref('');
const nouvellesNotes = ref('');

// Resoconti percentuali en attente d'approbation
const resocontiEnAttente = computed(() => {
  return resocontiPercentuali.value.filter(r => 
    !r.draft && // Resoconto sauvegardé (non brouillon)
    ((r.status === 'en_attente' || !r.status) || // En attente o senza status
     (r.status === 'approved' && !hasFacture(r))) // Approvati senza fattura
  );
});

const hasFacture = (resoconto) => {
  return factures.value.some(f => f.resocontoId === resoconto.id);
};

// Métrages complétés mais non encore facturés
const metragesEnAttente = computed(() => {
  return metrages.value.filter(m => 
    !m.draft && // Métrage sauvegardé (non brouillon)
    (m.status === 'en_attente' || !m.status) && // En attente d'approbation ou ancien
    !m.facture && // Pas encore facturé
    m.totalML > 0 // A du contenu
  );
});

// Factures des 30 derniers jours
const facturesRecentes = computed(() => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return factures.value
    .filter(f => new Date(f.dateFacture) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.dateFacture) - new Date(a.dateFacture))
    .slice(0, 10);
});

// Statistiques
const facturationMois = computed(() => {
  const thisMonth = new Date();
  return factures.value
    .filter(f => {
      const factureDate = new Date(f.dateFacture);
      return factureDate.getMonth() === thisMonth.getMonth() && 
             factureDate.getFullYear() === thisMonth.getFullYear();
    })
    .reduce((sum, f) => sum + (f.montantTTC || 0), 0);
});

const facturesPayees = computed(() => {
  return factures.value
    .filter(f => f.statut === 'payee')
    .reduce((sum, f) => sum + (f.montantTTC || 0), 0);
});

const facturesEnRetard = computed(() => {
  return factures.value
    .filter(f => f.statut === 'en_retard')
    .reduce((sum, f) => sum + (f.montantTTC || 0), 0);
});

const loadData = async () => {
  try {
    // Métrages
    const metragesSnap = await getDocs(collection(db, 'metrages'));
    metrages.value = metragesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Resoconti percentuali
    const resocontiSnap = await getDocs(collection(db, 'resoconti_percentuali'));
    resocontiPercentuali.value = resocontiSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Resoconti caricati:', resocontiPercentuali.value);
    console.log('Resoconti en attente:', resocontiPercentuali.value.filter(r => !r.draft && r.status === 'en_attente'));

    // Factures
    const facturesSnap = await getDocs(collection(db, 'factures'));
    factures.value = facturesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Chantiers
    const chantiersSnap = await getDocs(collection(db, 'chantiers'));
    chantiers.value = chantiersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Devis
    const devisSnap = await getDocs(collection(db, 'devis'));
    devis.value = devisSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erreur chargement données:', error);
  }
};

const calculateMontantEstime = (metrage) => {
  // Trova il devis associato al chantier
  const chantier = chantiers.value.find(c => c.id === metrage.chantierId);
  const chantierDevis = devis.value.find(d => d.id === chantier?.devisId);
  
  if (!chantierDevis || !chantierDevis.total) return 0;
  
  // Stima basata sulla percentuale di completamento
  // Se il métrage ha totalML, calcola percentuale rispetto al devis
  const devisML = chantierDevis.produits?.reduce((sum, p) => sum + (p.ml || 0), 0) || 1;
  const percentageComplete = Math.min((metrage.totalML || 0) / devisML, 1);
  
  return chantierDevis.total * percentageComplete;
};

const autoriserFacturation = async (metrage) => {
  if (!confirm('Approuver ce métrage et autoriser la facturation ?')) return;
  
  try {
    // Approuve d'abord le métrage
    await updateDoc(doc(db, 'metrages', metrage.id), {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: 'admin'
    });
    
    const chantier = chantiers.value.find(c => c.id === metrage.chantierId);
    const chantierDevis = devis.value.find(d => d.id === chantier?.devisId);
    
    const montantTravauxHT = calculateMontantEstime(metrage);
    
    // Calcola montant regie
    const montantRegiesHT = (metrage.regies || []).reduce((sum, r) => sum + (r.heures * r.prixHeure), 0);
    const montantHT = montantTravauxHT + montantRegiesHT;
    
    const numeroFacture = `F${new Date().getFullYear()}-${String(factures.value.length + 1).padStart(4, '0')}`;
    
    // Crée la facture
    const factureData = {
      numero: numeroFacture,
      chantierId: metrage.chantierId,
      metrageId: metrage.id,
      dateFacture: new Date().toISOString().split('T')[0],
      montantHT: montantHT,
      tauxTVA: 20,
      montantTTC: montantHT * 1.2,
      statut: 'emise',
      clientNom: chantierDevis?.nom || 'Client',
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 jours
      notes: `Facture générée automatiquement depuis métrage du ${formatDate(metrage.createdAt)}`,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'factures'), factureData);
    
    // Marque le métrage comme facturé
    await updateDoc(doc(db, 'metrages', metrage.id), {
      facture: true,
      factureNumero: numeroFacture,
      factureDate: new Date()
    });
    
    alert(`Métrage approuvé et facture ${numeroFacture} créée avec succès !`);
    loadData();
    showDetailMetrage.value = false;
  } catch (error) {
    console.error('Erreur création facture:', error);
    alert('Erreur: ' + error.message);
  }
};

const voirDetailMetrage = (metrage) => {
  detailMetrage.value = metrage;
  showDetailMetrage.value = true;
};

const voirDetailResoconto = (resoconto) => {
  detailResoconto.value = resoconto;
  showDetailResoconto.value = true;
};

const approuverResoconto = async (resoconto) => {
  if (!confirm('Approuver ce resoconto percentuel et générer la facture ?')) return;
  
  try {
    // Approva il resoconto
    await updateDoc(doc(db, 'resoconti_percentuali', resoconto.id), {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: 'admin'
    });
    
    // Genera la fattura
    const chantier = chantiers.value.find(c => c.id === resoconto.chantierId);
    const chantierDevis = devis.value.find(d => d.id === chantier?.devisId);
    
    // Calcola importo basato sulle percentuali
    const totalPercentuali = Object.values(resoconto.avancementi || {}).reduce((sum, pct) => sum + pct, 0);
    const montantTravauxHT = chantierDevis?.total ? (chantierDevis.total * totalPercentuali / 100) : 1000;
    
    // Calcola montant regie
    const montantRegiesHT = (resoconto.regies || []).reduce((sum, r) => sum + (r.heures * r.prixHeure), 0);
    const montantHT = montantTravauxHT + montantRegiesHT;
    
    const numeroFacture = `F${new Date().getFullYear()}-${String(factures.value.length + 1).padStart(4, '0')}`;
    
    const factureData = {
      numero: numeroFacture,
      chantierId: resoconto.chantierId,
      resocontoId: resoconto.id,
      dateFacture: new Date().toISOString().split('T')[0],
      montantHT: montantHT,
      tauxTVA: 20,
      montantTTC: montantHT * 1.2,
      statut: 'emise',
      clientNom: chantierDevis?.nom || 'Client',
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: `Facture générée depuis resoconto percentuel ${resoconto.periodeMonth}`,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'factures'), factureData);
    
    alert(`Resoconto approuvé et facture ${numeroFacture} créée!`);
    loadData();
  } catch (error) {
    console.error('Erreur approbation resoconto:', error);
    alert('Erreur: ' + error.message);
  }
};

const refuserResoconto = async (resoconto) => {
  const motif = prompt('Motif du refus (optionnel):');
  if (motif === null) return; // Annulé
  
  try {
    await updateDoc(doc(db, 'resoconti_percentuali', resoconto.id), {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: 'admin', // TODO: utiliser l'utilisateur connecté
      rejectionReason: motif
    });
    
    alert('Resoconto refusé.');
    loadData();
  } catch (error) {
    console.error('Erreur refus resoconto:', error);
    alert('Erreur: ' + error.message);
  }
};

const eliminarResoconto = async (resoconto) => {
  if (!confirm('Eliminer ce resoconto? Il sera marqué comme refusé et le chef pourra en créer un nouveau.')) return;
  
  try {
    await updateDoc(doc(db, 'resoconti_percentuali', resoconto.id), {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: 'admin',
      rejectionReason: 'Eliminato dall\'admin'
    });
    
    alert('Resoconto éliminé (marqué comme refusé).');
    loadData();
  } catch (error) {
    console.error('Erreur élimination:', error);
    alert('Erreur: ' + error.message);
  }
};

const generarFactureResoconto = async (resoconto) => {
  if (!confirm('Générer la facture pour ce resoconto approuvé ?')) return;
  
  try {
    const chantier = chantiers.value.find(c => c.id === resoconto.chantierId);
    const chantierDevis = devis.value.find(d => d.id === chantier?.devisId);
    
    const totalPercentuali = Object.values(resoconto.avancementi || {}).reduce((sum, pct) => sum + pct, 0);
    const montantTravauxHT = chantierDevis?.total ? (chantierDevis.total * totalPercentuali / 100) : 1000;
    
    // Calcola montant regie
    const montantRegiesHT = (resoconto.regies || []).reduce((sum, r) => sum + (r.heures * r.prixHeure), 0);
    const montantHT = montantTravauxHT + montantRegiesHT;
    
    const numeroFacture = `F${new Date().getFullYear()}-${String(factures.value.length + 1).padStart(4, '0')}`;
    
    const factureData = {
      numero: numeroFacture,
      chantierId: resoconto.chantierId,
      resocontoId: resoconto.id,
      dateFacture: new Date().toISOString().split('T')[0],
      montantHT: montantHT,
      tauxTVA: 20,
      montantTTC: montantHT * 1.2,
      statut: 'emise',
      clientNom: chantierDevis?.nom || 'Client',
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: `Facture générée depuis resoconto percentuel ${resoconto.periodeMonth}`,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'factures'), factureData);
    alert(`Facture ${numeroFacture} créée avec succès!`);
    loadData();
  } catch (error) {
    console.error('Erreur génération facture:', error);
    alert('Erreur: ' + error.message);
  }
};

const eliminarMetrage = async (metrage) => {
  if (!confirm('Eliminer ce métrage de test?')) return;
  
  try {
    await deleteDoc(doc(db, 'metrages', metrage.id));
    alert('Métrage éliminé.');
    loadData();
  } catch (error) {
    console.error('Erreur élimination métrage:', error);
    alert('Erreur: ' + error.message);
  }
};

const pulirVecchiResoconti = async () => {
  if (!confirm('Supprimer tous les anciens resoconti de test? Cette action est irréversible.')) return;
  
  try {
    // Trova resoconti orfani (senza cantiere valido)
    const resocontiOrfani = resocontiPercentuali.value.filter(r => {
      const chantier = chantiers.value.find(c => c.id === r.chantierId);
      return !chantier; // Cantiere non esiste più
    });
    
    for (const resoconto of resocontiOrfani) {
      await deleteDoc(doc(db, 'resoconti_percentuali', resoconto.id));
    }
    
    alert(`${resocontiOrfani.length} anciens resoconti supprimés.`);
    loadData();
  } catch (error) {
    console.error('Erreur nettoyage:', error);
    alert('Erreur: ' + error.message);
  }
};

const changerStatutFacture = (facture) => {
  factureEnCours.value = facture;
  nouveauStatut.value = facture.statut;
  notesStatut.value = '';
  showChangeStatut.value = true;
};

const confirmerChangeStatut = async () => {
  try {
    await updateDoc(doc(db, 'factures', factureEnCours.value.id), {
      statut: nouveauStatut.value,
      statutNotes: notesStatut.value,
      statutUpdatedAt: new Date()
    });
    
    alert('Statut mis à jour avec succès');
    loadData();
    showChangeStatut.value = false;
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    alert('Erreur: ' + error.message);
  }
};

const modifierFacture = (facture) => {
  factureEnCours.value = facture;
  nouvelleDate.value = facture.dateFacture;
  nouvelleDateEcheance.value = facture.dateEcheance || '';
  nouvellesNotes.value = facture.notes || '';
  showModifierFacture.value = true;
};

const confirmerModificationFacture = async () => {
  try {
    await updateDoc(doc(db, 'factures', factureEnCours.value.id), {
      dateFacture: nouvelleDate.value,
      dateEcheance: nouvelleDateEcheance.value,
      notes: nouvellesNotes.value,
      updatedAt: new Date()
    });
    
    alert('Facture modifiée avec succès');
    loadData();
    showModifierFacture.value = false;
  } catch (error) {
    console.error('Erreur modification facture:', error);
    alert('Erreur: ' + error.message);
  }
};

const supprimerFacture = async (facture) => {
  if (!confirm(`Supprimer la facture ${facture.numero} ?\n\nATTENTION: Le métrage associé sera remis en attente de facturation.`)) return;
  
  try {
    // Supprime la facture
    await deleteDoc(doc(db, 'factures', facture.id));
    
    // Remet le métrage en attente si il existe
    if (facture.metrageId) {
      await updateDoc(doc(db, 'metrages', facture.metrageId), {
        facture: false,
        factureNumero: null,
        factureDate: null
      });
    }
    
    alert('Facture supprimée avec succès');
    loadData();
  } catch (error) {
    console.error('Erreur suppression facture:', error);
    alert('Erreur: ' + error.message);
  }
};

const getChantierName = (id) => {
  const chantier = chantiers.value.find(c => c.id === id);
  return chantier ? chantier.nom : 'N/A';
};

const getChantierNameWithNumber = (id) => {
  const chantier = chantiers.value.find(c => c.id === id);
  if (!chantier) return 'N/A';
  const numero = chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '';
  return `${numero}${chantier.nom}`;
};

const getClientName = (chantierId) => {
  const chantier = chantiers.value.find(c => c.id === chantierId);
  return chantier?.client || 'N/A';
};

const getStatutLabel = (statut) => {
  const labels = {
    emise: 'Émise',
    envoyee: 'Envoyée', 
    payee: 'Payée',
    en_retard: 'En retard'
  };
  return labels[statut] || statut;
};

const getStatutClass = (statut) => {
  const classes = {
    emise: 'badge bg-secondary',
    envoyee: 'badge bg-info',
    payee: 'badge bg-success',
    en_retard: 'badge bg-danger'
  };
  return classes[statut] || 'badge bg-secondary';
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return date.toDate ? date.toDate().toLocaleDateString('fr-FR') : new Date(date).toLocaleDateString('fr-FR');
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const formatPeriodeMetrage = (metrage) => {
  if (metrage.periodeDebut && metrage.periodeFin) {
    return `${metrage.periodeDebut} - ${metrage.periodeFin}`;
  }
  if (metrage.periodeDebut) {
    return `Du ${metrage.periodeDebut}`;
  }
  if (metrage.periodeFin) {
    return `Jusqu'au ${metrage.periodeFin}`;
  }
  return '-';
};

const genererPDF = async (facture) => {
  // Carica tutti i dati necessari
  const chantier = chantiers.value.find(c => c.id === facture.chantierId);
  const chantierDevis = devis.value.find(d => d.id === chantier?.devisId);
  const metrageDoc = metrages.value.find(m => m.id === facture.metrageId);
  const resocontoDoc = resocontiPercentuali.value.find(r => r.id === facture.resocontoId);
  
  // Carica i dati completi del cliente dall'anagrafica
  let clienteCompleto = null;
  const nomeCliente = chantier?.client || chantierDevis?.nom || 'Client';
  
  try {
    const clientsSnapshot = await getDocs(collection(db, 'clients'));
    const clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    clienteCompleto = clients.find(c => c.nom === nomeCliente);
  } catch (error) {
    console.error('Erreur chargement clients:', error);
  }
  
  // Import logo
  let logo;
  try {
    const logoModule = await import('@/assets/logo.jpg');
    logo = logoModule.default;
  } catch (e) {
    console.warn('Logo non trovato');
  }
  
  const drawHeader = (doc, title) => {
    // Logo Dallelec
    if (logo) {
      const logoW = 55;
      const logoH = logoW / 5.32;
      doc.addImage(logo, 'JPEG', 10, 10, logoW, logoH);
    }
    
    // Dati aziendali reali Dallelec
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const companyInfo = [
      'DALLELEC Sarl',
      'Rue de Bourgogne 25', 
      '1203 Genève',
      'contact@dallelec.ch'
    ];
    let y = 12;
    doc.setTextColor(80);
    companyInfo.forEach((line) => {
      doc.text(line, 200, y, { align: 'right' });
      y += 4;
    });
    
    // Titolo documento
    doc.setFontSize(20);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(40);
    doc.text(title, 10, 40);
  };
  
  const drawFooter = (doc) => {
    // Pied de page (dati Svizzera)
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('DALLELEC Sarl - CHE-123.456.789 TVA - 1203 Genève', 105, 280, { align: 'center' });
  };
  
  const addPageNumbers = (doc) => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Page ${i}/${totalPages}`, 200, 290, { align: 'right' });
    }
  };
  
  // 1. GENERA DOCUMENTO PRINCIPALE (Métrées ou Resoconto)
  const docMetrees = new jsPDF({ unit: 'mm', format: 'a4' });
  const titleDoc = resocontoDoc ? 'RESOCONTO PERCENTUALE' : 'MÉTRÉES DÉTAILLÉES';
  drawHeader(docMetrees, `${titleDoc} - ${facture.numero}`);
  
  // Informazioni generali métrées (font più piccolo)
  docMetrees.setFontSize(9);
  docMetrees.setFont('Helvetica', 'normal');
  docMetrees.text(`Date: ${formatDate(facture.dateFacture)}`, 10, 50);
  
  // Periodo di riferimento se disponibile
  if (metrageDoc && (metrageDoc.periodeDebut || metrageDoc.periodeFin)) {
    const periodeText = `Période: ${metrageDoc.periodeDebut || ''} - ${metrageDoc.periodeFin || ''}`;
    docMetrees.text(periodeText, 10, 55);
  }
  
  // Dati completi del cliente anche nelle métrées (compatti)
  let yClientMetrees = metrageDoc && (metrageDoc.periodeDebut || metrageDoc.periodeFin) ? 62 : 57;
  if (clienteCompleto) {
    docMetrees.text(`Client: ${clienteCompleto.nom}`, 10, yClientMetrees);
    yClientMetrees += 4;
    if (clienteCompleto.adresse) {
      docMetrees.text(`${clienteCompleto.adresse}`, 10, yClientMetrees);
      yClientMetrees += 4;
    }
    if (clienteCompleto.ville) {
      docMetrees.text(`${clienteCompleto.ville}`, 10, yClientMetrees);
      yClientMetrees += 4;
    }
  } else {
    docMetrees.text(`Client: ${nomeCliente}`, 10, yClientMetrees);
    yClientMetrees += 4;
  }
  
  const numeroCantiereMetrees = chantier?.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '';
  docMetrees.text(`Chantier: ${numeroCantiereMetrees}${getChantierName(facture.chantierId)}`, 10, yClientMetrees + 2);
  
  let tableStartY = Math.max(yClientMetrees + 10, 80);
  
  // Tabella resoconto percentuale
  if (resocontoDoc) {
    // Riferimento devis
    docMetrees.setFontSize(10);
    docMetrees.setFont('helvetica', 'bold');
    docMetrees.text(`Référence Devis: ${chantierDevis?.numero || 'N/A'}`, 10, tableStartY);
    docMetrees.setFont('helvetica', 'normal');
    docMetrees.text('Objet: Pose de chemin de câbles', 10, tableStartY + 5);
    
    docMetrees.setFontSize(12);
    docMetrees.setFont('helvetica', 'bold');
    docMetrees.text('DÉTAIL PAR ZONE', 10, tableStartY + 15);
    
    // Spiegazione calcolo
    docMetrees.setFontSize(8);
    docMetrees.setFont('helvetica', 'italic');
    docMetrees.text('Calcul: Pourcentage Réalisé - Pourcentage Déjà Facturé = Pourcentage à Facturer ce mois', 10, tableStartY + 22);
    
    const head = [['Zone', 'Montant Devis (CHF)', '% Réalisé', '% Déjà Facturé', '% à Facturer', 'Montant (CHF)']];
    const body = [];
    
    tableStartY += 30;
    
    // Calcola percentuali già fatturate per zona
    const percentualiGiaFatturate = {};
    
    // Trova tutte le fatture precedenti per questo cantiere da resoconti
    const fatturePassate = factures.value.filter(f => 
      f.chantierId === facture.chantierId && 
      f.resocontoId && 
      f.id !== facture.id
    );
    
    // Per ogni fattura passata, somma le percentuali
    for (const fatturaPassata of fatturePassate) {
      const resocontoPassato = resocontiPercentuali.value.find(r => r.id === fatturaPassata.resocontoId);
      if (resocontoPassato?.avancementi) {
        Object.entries(resocontoPassato.avancementi).forEach(([zona, pct]) => {
          percentualiGiaFatturate[zona] = (percentualiGiaFatturate[zona] || 0) + pct;
        });
      }
    }
    
    // Calcola importo devis per zona basandosi sui prodotti reali
    const importoPerZona = {};
    if (chantierDevis?.produits) {
      chantierDevis.produits.forEach(prodotto => {
        const zona = prodotto.zone;
        const importoProdotto = (prodotto.totalML || prodotto.ml || 0) * (prodotto.prix || 0);
        importoPerZona[zona] = (importoPerZona[zona] || 0) + importoProdotto;
      });
    }
    
    // Genera righe per ogni zona nel resoconto corrente
    Object.entries(resocontoDoc.avancementi || {}).forEach(([zona, percentualeCorrente]) => {
      const importoDevis = importoPerZona[zona] || 0;
      const percentualeGiaFatt = percentualiGiaFatturate[zona] || 0;
      const percentualeDaFatturare = percentualeCorrente; // Questo mese
      const importoFatturato = importoDevis * (percentualeDaFatturare / 100);
      const percentualeTotaleRealizzata = percentualeGiaFatt + percentualeCorrente;
      
      body.push([
        zona,
        importoDevis.toFixed(2),
        percentualeTotaleRealizzata.toFixed(1) + '%',
        percentualeGiaFatt.toFixed(1) + '%',
        percentualeDaFatturare.toFixed(1) + '%',
        importoFatturato.toFixed(2)
      ]);
    });
    
    autoTable(docMetrees, {
      head,
      body,
      startY: tableStartY + 4,
      theme: 'grid',
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 20,
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      }
    });
    
    tableStartY = docMetrees.lastAutoTable.finalY + 10;
  }
  // Tabella métrées détaillées
  else if (metrageDoc && metrageDoc.items) {
    const grouped = {};
    metrageDoc.items.forEach(item => {
      if (!grouped[item.zone]) grouped[item.zone] = [];
      grouped[item.zone].push(item);
    });
    
    Object.entries(grouped).forEach(([zoneName, items]) => {
      docMetrees.setFontSize(12);
      docMetrees.setFont('helvetica', 'bold');
      docMetrees.text(`Zone: ${zoneName}`, 10, tableStartY);
      
      const head = [['Code', 'Produit', 'Taille', 'ML', 'ML Suppléments', 'ML Total']];
      const body = [];
      
      items.forEach(item => {
        body.push([
          item.article || '',
          item.nom || '',
          item.taille || '',
          (item.mlPosee || 0).toFixed(2),
          (item.totalSuppML || 0).toFixed(2),
          (item.totalML || 0).toFixed(2)
        ]);
      });
      
      autoTable(docMetrees, {
        head,
        body,
        startY: tableStartY + 4,
        theme: 'grid',
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: 20,
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 8
        }
      });
      
      tableStartY = docMetrees.lastAutoTable.finalY + 10;
    });
  }
  
  // Détail des suppléments (sezione analitica completa)
  // Ricostruisco supplementParZone dai dati salvati
  const supplementParZone = [];
  if (metrageDoc && metrageDoc.items) {
    const grouped = {};
    metrageDoc.items.forEach(item => {
      if (Array.isArray(item.supplements) && item.supplements.length > 0) {
        if (!grouped[item.zone]) grouped[item.zone] = [];
        item.supplements.forEach(supp => {
          grouped[item.zone].push({
            article: item.article,
            nom: item.nom,
            taille: item.taille,
            supplement: supp.supplement || supp.nom || supp.type,
            qte: parseFloat(supp.qte || supp.qtePosee) >= 0 ? parseFloat(supp.qte || supp.qtePosee) : 0,
            valeur: parseFloat(supp.valeur) >= 0 ? parseFloat(supp.valeur) : 0
          });
        });
      }
    });
    
    Object.entries(grouped).forEach(([nom, details]) => {
      supplementParZone.push({ nom, details });
    });
  }
  
  if (supplementParZone.length > 0) {
    docMetrees.setFontSize(14);
    docMetrees.setFont('Helvetica', 'bold');
    docMetrees.text('DÉTAIL DES SUPPLÉMENTS PAR ZONE', 10, tableStartY);
    tableStartY += 10;
    
    // Copio esattamente la logica del DevisPdf.vue
    supplementParZone.forEach((suppZone, idx) => {
      const suppZoneName = suppZone.nom || `Zone ${idx + 1}`;
      docMetrees.setFontSize(11);
      docMetrees.setFont('Helvetica', 'bold');
      docMetrees.text(suppZoneName, 10, tableStartY);
      
      const head = [[
        'Code',
        'Produit',
        'Taille',
        'Supplement',
        'Qté',
        'Valeur',
        'Total ML'
      ]];
      const body = [];
      
      // Raggruppiamo per prodotto/taglia come nel componente SupplementDetails
      if (Array.isArray(suppZone.details)) {
        const grouped = {};
        suppZone.details.forEach((entry) => {
          const key = `${entry.article}-${entry.nom}-${entry.taille}`;
          if (!grouped[key]) {
            grouped[key] = {
              article: entry.article,
              nom: entry.nom,
              taille: entry.taille,
              entries: []
            };
          }
          grouped[key].entries.push(entry);
        });
        
        // Per ogni gruppo di prodotto/taglia
        Object.values(grouped).forEach((group) => {
          // Aggiungiamo le righe del gruppo
          group.entries.forEach((s) => {
            const totalML = s.totalML || (s.qte && s.valeur ? s.qte * s.valeur : 0);
            body.push([
              s.article || '',
              s.nom || '',
              s.taille || '',
              s.supplement || '',
              s.qte != null ? String(s.qte) : '',
              s.valeur != null ? s.valeur.toFixed(2) : '',
              totalML.toFixed(2)
            ]);
          });
          
          // Aggiungiamo la riga totale per il gruppo
          const groupTotal = group.entries.reduce((sum, e) => {
            const totalML = e.totalML || (e.qte && e.valeur ? e.qte * e.valeur : 0);
            return sum + totalML;
          }, 0);
          
          body.push([
            '',
            '',
            '',
            { content: `Total Suppléments (${group.nom}):`, colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
            { content: groupTotal.toFixed(2) + ' ML', colSpan: 1, styles: { fontStyle: 'bold' } }
          ]);
        });
      }
      

      
      autoTable(docMetrees, {
        head: head,
        body: body,
        startY: tableStartY + 4,
        theme: 'grid',
        margin: { top: 35 },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: 20,
          halign: 'center',
          valign: 'middle',
          fontSize: 8
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 8,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 20 },  // Code (uguale)
          1: { cellWidth: 45 },  // Produit (più grande)
          2: { cellWidth: 15 },  // Taille (uguale)
          3: { cellWidth: 45 },  // Supplement (più grande)
          4: { cellWidth: 12 },  // Qté (leggermente più grande)
          5: { cellWidth: 18 },  // Valeur (più grande)
          6: { cellWidth: 18 }   // Total ML (più grande)
        },

      });
      
      // Aggiorniamo la posizione per la prossima zona
      tableStartY = docMetrees.lastAutoTable.finalY + 10;
    });
  }
  
  // 2. GENERA FACTURE (semplificata)
  const docFacture = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(docFacture, `FACTURE N. ${facture.numero}`);
  
  // Date e informazioni facture (font più piccolo)
  docFacture.setFontSize(9);
  docFacture.setFont('Helvetica', 'normal');
  docFacture.text(`Date: ${formatDate(facture.dateFacture)}`, 10, 50);
  
  let yFactureInfo = 55;
  if (facture.dateEcheance) {
    docFacture.text(`Échéance: ${formatDate(facture.dateEcheance)}`, 10, yFactureInfo);
    yFactureInfo += 5;
  }
  
  // Periodo di riferimento se disponibile
  if (metrageDoc && (metrageDoc.periodeDebut || metrageDoc.periodeFin)) {
    const periodeText = `Période: ${metrageDoc.periodeDebut || ''} - ${metrageDoc.periodeFin || ''}`;
    docFacture.text(periodeText, 10, yFactureInfo);
    yFactureInfo += 5;
  }
  
  // Informations client (font più piccolo)
  docFacture.setFontSize(10);
  docFacture.setFont('Helvetica', 'bold');
  const yFactureA = Math.max(yFactureInfo + 5, 70);
  docFacture.text('FACTURÉ À:', 10, yFactureA);
  
  docFacture.setFontSize(8);
  docFacture.setFont('Helvetica', 'normal');
  
  // Dati completi del cliente (compatti)
  let yClient = yFactureA + 7;
  if (clienteCompleto) {
    docFacture.text(clienteCompleto.nom, 10, yClient);
    yClient += 4;
    if (clienteCompleto.adresse) {
      docFacture.text(clienteCompleto.adresse, 10, yClient);
      yClient += 4;
    }
    if (clienteCompleto.ville) {
      docFacture.text(clienteCompleto.ville, 10, yClient);
      yClient += 4;
    }
  } else {
    docFacture.text(nomeCliente, 10, yClient);
    yClient += 4;
  }
  
  docFacture.setFontSize(8);
  const numeroCantiere = chantier?.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '';
  docFacture.text(`Chantier: ${numeroCantiere}${getChantierName(facture.chantierId)}`, 10, yClient + 2);
  
  // Tabella facture con struttura corretta (posizione ottimizzata)
  let factureTableY = Math.max(yClient + 10, 100);
  let totalFactureHT = 0;
  
  if (resocontoDoc) {
    // Référence et objet (con spaziatura corretta)
    docFacture.setFontSize(9);
    docFacture.setFont('helvetica', 'bold');
    docFacture.text(`Référence Devis: ${chantierDevis?.numero || 'N/A'}`, 10, factureTableY);
    docFacture.setFont('helvetica', 'normal');
    docFacture.text('Objet: Pose de chemin de câbles', 10, factureTableY + 5);
    
    factureTableY += 15; // Sposta la tabella più in basso
    
    // Tabella facture per resoconto percentuale
    const head = [['Zone', 'Montant Devis', '% Réalisé', '% Déjà Facturé', '% Facturé', 'Montant HT']];
    const body = [];
    
    // Calcola percentuali già fatturate per zona
    const percentualiGiaFatturate = {};
    const fatturePassate = factures.value.filter(f => 
      f.chantierId === facture.chantierId && 
      f.resocontoId && 
      f.id !== facture.id
    );
    
    for (const fatturaPassata of fatturePassate) {
      const resocontoPassato = resocontiPercentuali.value.find(r => r.id === fatturaPassata.resocontoId);
      if (resocontoPassato?.avancementi) {
        Object.entries(resocontoPassato.avancementi).forEach(([zona, pct]) => {
          percentualiGiaFatturate[zona] = (percentualiGiaFatturate[zona] || 0) + pct;
        });
      }
    }
    
    // Calcola importo devis per zona basandosi sui prodotti reali
    const importoPerZona = {};
    if (chantierDevis?.produits) {
      chantierDevis.produits.forEach(prodotto => {
        const zona = prodotto.zone;
        const importoProdotto = (prodotto.totalML || prodotto.ml || 0) * (prodotto.prix || 0);
        importoPerZona[zona] = (importoPerZona[zona] || 0) + importoProdotto;
      });
    }
    
    // Genera righe per ogni zona
    Object.entries(resocontoDoc.avancementi || {}).forEach(([zona, percentualeCorrente]) => {
      const importoDevis = importoPerZona[zona] || 0;
      const percentualeGiaFatt = percentualiGiaFatturate[zona] || 0;
      const percentualeDaFatturare = percentualeCorrente;
      const importoFatturato = importoDevis * (percentualeDaFatturare / 100);
      const percentualeTotaleRealizzata = percentualeGiaFatt + percentualeCorrente;
      totalFactureHT += importoFatturato;
      
      body.push([
        zona,
        importoDevis.toFixed(2) + ' CHF',
        percentualeTotaleRealizzata.toFixed(1) + '%',
        percentualeGiaFatt.toFixed(1) + '%',
        percentualeDaFatturare.toFixed(1) + '%',
        importoFatturato.toFixed(2) + ' CHF'
      ]);
    });
    
    autoTable(docFacture, {
      head,
      body,
      startY: factureTableY,
      theme: 'grid',
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 20,
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      }
    });
    
    factureTableY = docFacture.lastAutoTable.finalY + 10;
  }
  else if (metrageDoc && metrageDoc.items) {
    const grouped = {};
    metrageDoc.items.forEach(item => {
      if (!grouped[item.zone]) grouped[item.zone] = [];
      grouped[item.zone].push(item);
    });
    
    Object.entries(grouped).forEach(([zoneName, items]) => {
      docFacture.setFontSize(12);
      docFacture.setFont('helvetica', 'bold');
      docFacture.text(`Zone: ${zoneName}`, 10, factureTableY);
      
      const head = [['Code', 'Produit', 'Taille', 'ML', 'ML Suppléments', 'ML Total', 'Prix Unit.', 'Total']];
      const body = [];
      let zoneTotal = 0;
      
      items.forEach(item => {
        const devisProduit = chantierDevis?.produits?.find(p => 
          p.article === item.article && p.nom === item.nom && p.taille === item.taille
        );
        const prixUnit = devisProduit?.prix || 0;
        const mlTotal = item.totalML || 0;
        const total = mlTotal * prixUnit;
        zoneTotal += total;
        
        body.push([
          item.article || '',
          item.nom || '',
          item.taille || '',
          (item.mlPosee || 0).toFixed(2),
          (item.totalSuppML || 0).toFixed(2),
          mlTotal.toFixed(2),
          prixUnit.toFixed(2) + ' CHF',
          total.toFixed(2) + ' CHF'
        ]);
      });
      
      autoTable(docFacture, {
        head,
        body,
        startY: factureTableY + 4,
        theme: 'grid',
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: 20,
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 8
        }
      });
      
      // Sous-total per zona
      const finalYZone = docFacture.lastAutoTable.finalY;
      docFacture.setFontSize(9);
      docFacture.setFont('Helvetica', 'bold');
      docFacture.text(`Sous-total (${zoneName}): ${zoneTotal.toFixed(2)} CHF`, 170, finalYZone + 4, { align: 'right' });
      
      totalFactureHT += zoneTotal;
      factureTableY = finalYZone + 15;
    });
  } else {
    // Tabella semplificata se non ci sono détails métrage
    const head = [['Description', 'Quantité', 'Prix unitaire', 'Total HT']];
    const body = [[
      `Travaux électriques - ${getChantierName(facture.chantierId)}`,
      '1',
      facture.montantHT.toFixed(2) + ' CHF',
      facture.montantHT.toFixed(2) + ' CHF'
    ]];
    
    autoTable(docFacture, {
      head,
      body,
      startY: factureTableY,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230] }
    });
    
    totalFactureHT = facture.montantHT;
    factureTableY = docFacture.lastAutoTable.finalY + 10;
  }
  
  // Sezione Regie nella fattura
  let totalRegiesHT = 0;
  if ((resocontoDoc?.regies && resocontoDoc.regies.length > 0) || (metrageDoc?.regies && metrageDoc.regies.length > 0)) {
    const regiesData = resocontoDoc?.regies || metrageDoc?.regies || [];
    
    // Controlla se c'è spazio sufficiente (almeno 60mm dal fondo)
    if (factureTableY > 220) {
      docFacture.addPage();
      drawHeader(docFacture, `FACTURE N. ${facture.numero}`);
      factureTableY = 50;
    }
    
    docFacture.setFontSize(12);
    docFacture.setFont('helvetica', 'bold');
    docFacture.text('RÉGIES (Heures supplémentaires)', 10, factureTableY);
    
    const headRegies = [['Zone', 'Description', 'Heures', 'Prix/h', 'Total']];
    const bodyRegies = [];
    
    regiesData.forEach(regie => {
      const totalRegie = regie.heures * regie.prixHeure;
      totalRegiesHT += totalRegie;
      
      bodyRegies.push([
        regie.zone,
        regie.description,
        regie.heures + 'h',
        regie.prixHeure + ' CHF',
        totalRegie.toFixed(2) + ' CHF'
      ]);
    });
    
    autoTable(docFacture, {
      head: headRegies,
      body: bodyRegies,
      startY: factureTableY + 4,
      theme: 'grid',
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 20,
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      }
    });
    
    factureTableY = docFacture.lastAutoTable.finalY + 10;
  }
  
  // Controlla spazio per totali (almeno 40mm dal fondo)
  if (factureTableY > 240) {
    docFacture.addPage();
    drawHeader(docFacture, `FACTURE N. ${facture.numero}`);
    factureTableY = 50;
  }
  
  // Totaux (TVA Suisse 7.7%) - usa il totale calcolato dalla tabella + regie
  const finalY = factureTableY;
  
  docFacture.setFontSize(10);
  docFacture.text(`Sous-total Travaux:`, 130, finalY);
  docFacture.text(`${totalFactureHT.toFixed(2)} CHF`, 170, finalY);
  
  let yTotaux = finalY;
  if (totalRegiesHT > 0) {
    yTotaux += 7;
    docFacture.text(`Sous-total Régies:`, 130, yTotaux);
    docFacture.text(`${totalRegiesHT.toFixed(2)} CHF`, 170, yTotaux);
  }
  
  yTotaux += 7;
  const totalHT = totalFactureHT + totalRegiesHT;
  docFacture.text(`Total HT:`, 130, yTotaux);
  docFacture.text(`${totalHT.toFixed(2)} CHF`, 170, yTotaux);
  
  const tvaRate = 7.7; // TVA Suisse
  const montantTVA = totalHT * (tvaRate / 100);
  const montantTTC = totalHT + montantTVA;
  
  docFacture.text(`TVA (${tvaRate}%):`, 130, yTotaux + 7);
  docFacture.text(`${montantTVA.toFixed(2)} CHF`, 170, yTotaux + 7);
  
  docFacture.setFontSize(12);
  docFacture.setFont(undefined, 'bold');
  docFacture.text(`TOTAL TTC:`, 130, yTotaux + 17);
  docFacture.text(`${montantTTC.toFixed(2)} CHF`, 170, yTotaux + 17);
  
  // Conditions de paiement (Suisse)
  docFacture.setFontSize(8);
  docFacture.setFont(undefined, 'normal');
  docFacture.setTextColor(100);
  docFacture.text('Conditions de paiement: 30 jours net', 20, finalY + 35);
  
  if (facture.notes) {
    docFacture.text(`Notes: ${facture.notes}`, 20, finalY + 45);
  }
  
  // Aggiungi footer a tutte le pagine
  const totalPagesFacture = docFacture.internal.getNumberOfPages();
  for (let i = 1; i <= totalPagesFacture; i++) {
    docFacture.setPage(i);
    drawFooter(docFacture);
  }
  
  // Aggiungi numerazione pagine
  addPageNumbers(docFacture);
  
  // Aggiungi footer e numerazione anche al documento métrées
  const totalPagesMetrees = docMetrees.internal.getNumberOfPages();
  for (let i = 1; i <= totalPagesMetrees; i++) {
    docMetrees.setPage(i);
    drawFooter(docMetrees);
  }
  addPageNumbers(docMetrees);
  
  // Salva i due documenti
  const docType = resocontoDoc ? 'Resoconto_Percentuale' : 'Metrees_Detaillees';
  const alertType = resocontoDoc ? 'Resoconto percentuale' : 'Métrées détaillées';
  
  docMetrees.save(`${docType}_${facture.numero}.pdf`);
  docFacture.save(`Facture_${facture.numero}.pdf`);
  
  alert(`Deux documents générés:\n1. ${alertType} (pour technicien)\n2. Facture (pour comptabilité)`);
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.modal {
  z-index: 1050;
}

.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>