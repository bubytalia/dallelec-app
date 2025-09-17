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
        <div>
          <router-link to="/admin/facture-manuelle" class="btn btn-sm btn-success me-2">
            📝 Facture Manuelle
          </router-link>
          <button @click="pulirVecchiResoconti" class="btn btn-sm btn-warning">
            🧹 Nettoyer anciens tests
          </button>
        </div>
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
                <td>{{ getChantierNameWithNumber(metrage.chantier_id) }}</td>
                <td>{{ getClientName(metrage.chantier_id) }}</td>
                <td>{{ formatDate(metrage.created_at) }}</td>
                <td>{{ formatPeriodeMetrage(metrage) }}</td>
                <td>{{ metrage.zones?.join(', ') || 'Toutes' }} - {{ (metrage.total_ml || 0).toFixed(2) }} ML</td>
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
                <td>{{ getChantierName(facture.chantier_id || facture.chantierId) }}</td>
                <td>{{ facture.client_nom || facture.clientNom || getClientName(facture.chantier_id || facture.chantierId) }}</td>
                <td>{{ formatDate(facture.date_facture || facture.dateFacture) }}</td>
                <td>{{ formatCurrency(facture.montant_ttc || facture.montantTTC) }}</td>
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
            <h5>Détail Métrage - {{ getChantierName(detailMetrage.chantier_id) }}</h5>
            <button @click="showDetailMetrage = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Informations Générales</h6>
                <p><strong>Chantier:</strong> {{ getChantierName(detailMetrage.chantier_id) }}</p>
                <p><strong>Client:</strong> {{ getClientName(detailMetrage.chantier_id) }}</p>
                <p><strong>Date:</strong> {{ formatDate(detailMetrage.created_at) }}</p>
                <p><strong>Chef:</strong> {{ detailMetrage.chef_id }}</p>
              </div>
              <div class="col-md-6">
                <h6>Métrages</h6>
                <p><strong>Total ML:</strong> {{ (detailMetrage.total_ml || 0).toFixed(2) }} ML</p>
                <p><strong>Produits:</strong> {{ detailMetrage.total_produits || 0 }}</p>
                <p><strong>Zones:</strong> {{ detailMetrage.zones?.join(', ') || 'N/A' }}</p>
                <p><strong>Montant Estimé:</strong> {{ formatCurrency(calculateMontantEstime(detailMetrage)) }}</p>
              </div>
            </div>
            <div class="mt-3">
              <div class="mb-3">
                <h6>Détail des items:</h6>
                <div v-if="detailMetrage.items && detailMetrage.items.length > 0">
                  <div v-for="item in detailMetrage.items" :key="item.article" class="border p-2 mb-2">
                    <strong>{{ item.article }} - {{ item.nom }}</strong><br>
                    Zone: {{ item.zone }} | Taille: {{ item.taille }}<br>
                    ML Posé: {{ item.mlPosee }} | Total ML: {{ item.totalML }}<br>
                    <div v-if="item.supplements && item.supplements.length > 0">
                      <small>Suppléments: 
                        <span v-for="supp in item.supplements" :key="supp.supplement">
                          {{ supp.supplement }} ({{ supp.qtePosee }})
                        </span>
                      </small>
                    </div>
                  </div>
                </div>
                <div v-else class="text-muted">Aucun détail disponible</div>
              </div>
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
import { supabase } from '../supabase.js';
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
    (m.total_ml || m.totalML) > 0 // A du contenu
  );
});

// Factures des 30 derniers jours
const facturesRecentes = computed(() => {
  return factures.value
    .sort((a, b) => new Date(b.dateFacture) - new Date(a.dateFacture))
    .slice(0, 20); // Mostra tutte le fatture, ordinate per data
});

// Statistiques
const facturationMois = computed(() => {
  const thisMonth = new Date();
  return factures.value
    .filter(f => {
      const factureDate = new Date(f.date_facture || f.dateFacture);
      return factureDate.getMonth() === thisMonth.getMonth() && 
             factureDate.getFullYear() === thisMonth.getFullYear();
    })
    .reduce((sum, f) => sum + (f.montant_ttc || f.montantTTC || 0), 0);
});

const facturesPayees = computed(() => {
  return factures.value
    .filter(f => f.statut === 'payee')
    .reduce((sum, f) => sum + (f.montant_ttc || f.montantTTC || 0), 0);
});

const facturesEnRetard = computed(() => {
  return factures.value
    .filter(f => f.statut === 'en_retard')
    .reduce((sum, f) => sum + (f.montant_ttc || f.montantTTC || 0), 0);
});

const loadData = async () => {
  try {
    // Métrages (se esiste la tabella)
    try {
      const { data: metragesData, error: metragesError } = await supabase
        .from('metrages')
        .select('*');
      metrages.value = metragesData || [];
    } catch (err) {
      console.log('Tabella metrages non esiste ancora');
      metrages.value = [];
    }

    // Resoconti percentuali (se esiste la tabella)
    try {
      const { data: resocontiData, error: resocontiError } = await supabase
        .from('resoconti_percentuali')
        .select('*');
      resocontiPercentuali.value = resocontiData || [];
    } catch (err) {
      console.log('Tabella resoconti_percentuali non esiste ancora');
      resocontiPercentuali.value = [];
    }

    // Factures
    const { data: facturesData, error: facturesError } = await supabase
      .from('factures')
      .select('*');
    if (facturesError) throw facturesError;
    factures.value = facturesData || [];

    // Chantiers
    const { data: chantiersData, error: chantiersError } = await supabase
      .from('chantiers')
      .select('*');
    if (chantiersError) throw chantiersError;
    chantiers.value = chantiersData || [];

    // Devis
    const { data: devisData, error: devisError } = await supabase
      .from('devis')
      .select('*');
    if (devisError) throw devisError;
    devis.value = devisData || [];
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
    await supabase
      .from('metrages')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'admin'
      })
      .eq('id', metrage.id);
    
    const chantier = chantiers.value.find(c => c.id === metrage.chantier_id);
    const chantierDevis = devis.value.find(d => d.id === chantier?.devis_id);
    
    const montantTravauxHT = calculateMontantEstime(metrage);
    
    // Calcola montant regie
    const montantRegiesHT = (metrage.regies || []).reduce((sum, r) => sum + (r.heures * r.prixHeure), 0);
    const montantHT = montantTravauxHT + montantRegiesHT;
    
    const numeroFacture = generateNumeroFacture();
    
    // Crée la facture
    const { error } = await supabase
      .from('factures')
      .insert([{
        numero: numeroFacture,
        chantier_id: metrage.chantier_id,
        metrage_id: metrage.id,
        date_facture: new Date().toISOString().split('T')[0],
        montant_ht: montantHT,
        taux_tva: 20,
        montant_ttc: montantHT * 1.2,
        statut: 'emise',
        client_nom: chantier?.client || 'Client',
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `Facture générée automatiquement depuis métrage du ${formatDate(metrage.createdAt)}`,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    // Marque le métrage comme facturé
    await supabase
      .from('metrages')
      .update({
        facture: true,
        facture_numero: numeroFacture,
        facture_date: new Date().toISOString()
      })
      .eq('id', metrage.id);
    
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
    // Approva il resoconto (solo se tabella esiste)
    try {
      const { error } = await supabase
        .from('resoconti_percentuali')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'admin'
        })
        .eq('id', resoconto.id);
      
      if (error) throw error;
    } catch (err) {
      console.log('Tabella resoconti_percentuali non esiste, skip update');
    }
    
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
    
    const { error } = await supabase
      .from('factures')
      .insert([{
        numero: numeroFacture,
        chantier_id: resoconto.chantierId,
        resoconto_id: resoconto.id,
        date_facture: new Date().toISOString().split('T')[0],
        montant_ht: montantHT,
        taux_tva: 20,
        montant_ttc: montantHT * 1.2,
        statut: 'emise',
        client_nom: chantierDevis?.nom || 'Client',
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `Facture générée depuis resoconto percentuel ${resoconto.periodeMonth}`,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    alert(`Resoconto approuvé et facture ${numeroFacture} créée!`);
    loadData();
  } catch (error) {
    console.error('Erreur approbation resoconto:', error);
    alert('Erreur: ' + error.message);
  }
};

const refuserResoconto = async (resoconto) => {
  const motif = prompt('Motif du refus (optionnel):');
  if (motif === null) return;
  
  try {
    const { error } = await supabase
      .from('resoconti_percentuali')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: 'admin',
        rejection_reason: motif
      })
      .eq('id', resoconto.id);
    
    if (error) throw error;
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
    const { error } = await supabase
      .from('resoconti_percentuali')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: 'admin',
        rejection_reason: 'Eliminato dall\'admin'
      })
      .eq('id', resoconto.id);
    
    if (error) throw error;
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
    
    const { error } = await supabase
      .from('factures')
      .insert([{
        numero: numeroFacture,
        chantier_id: resoconto.chantierId,
        resoconto_id: resoconto.id,
        date_facture: new Date().toISOString().split('T')[0],
        montant_ht: montantHT,
        taux_tva: 20,
        montant_ttc: montantHT * 1.2,
        statut: 'emise',
        client_nom: chantierDevis?.nom || 'Client',
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `Facture générée depuis resoconto percentuel ${resoconto.periodeMonth}`,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
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
    const { error } = await supabase
      .from('metrages')
      .delete()
      .eq('id', metrage.id);
    
    if (error) throw error;
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
      return !chantier;
    });
    
    for (const resoconto of resocontiOrfani) {
      const { error } = await supabase
        .from('resoconti_percentuali')
        .delete()
        .eq('id', resoconto.id);
      
      if (error) console.error('Errore eliminazione resoconto:', error);
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
    const { error } = await supabase
      .from('factures')
      .update({
        statut: nouveauStatut.value,
        statut_notes: notesStatut.value,
        statut_updated_at: new Date().toISOString()
      })
      .eq('id', factureEnCours.value.id);
    
    if (error) throw error;
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
    const { error } = await supabase
      .from('factures')
      .update({
        date_facture: nouvelleDate.value,
        date_echeance: nouvelleDateEcheance.value,
        notes: nouvellesNotes.value,
        updated_at: new Date().toISOString()
      })
      .eq('id', factureEnCours.value.id);
    
    if (error) throw error;
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
    const { error } = await supabase
      .from('factures')
      .delete()
      .eq('id', facture.id);
    
    if (error) throw error;
    
    // Remet le métrage en attente si il existe (solo se tabella esiste)
    if (facture.metrage_id || facture.metrageId) {
      try {
        await supabase
          .from('metrages')
          .update({
            facture: false,
            facture_numero: null,
            facture_date: null
          })
          .eq('id', facture.metrage_id || facture.metrageId);
      } catch (err) {
        console.log('Tabella metrages non esiste, skip update');
      }
    }
    
    alert('Facture supprimée avec succès');
    loadData();
  } catch (error) {
    console.error('Erreur suppression facture:', error);
    alert('Erreur: ' + error.message);
  }
};

const getChantierName = (id) => {
  const chantier = chantiers.value.find(c => c.id == id);
  return chantier ? chantier.nom : 'N/A';
};

const getChantierNameWithNumber = (id) => {
  const chantier = chantiers.value.find(c => c.id == id);
  if (!chantier) return 'N/A';
  const numero = chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '';
  return `${numero}${chantier.nom}`;
};

const getClientName = (chantierId) => {
  const chantier = chantiers.value.find(c => c.id == chantierId);
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

const generateNumeroFacture = () => {
  return `F${new Date().getFullYear()}-${String(factures.value.length + 1).padStart(3, '0')}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const formatPeriodeMetrage = (metrage) => {
  if (metrage.periode_debut && metrage.periode_fin) {
    return `${metrage.periode_debut} - ${metrage.periode_fin}`;
  }
  if (metrage.periode_debut) {
    return `Du ${metrage.periode_debut}`;
  }
  if (metrage.periode_fin) {
    return `Jusqu'au ${metrage.periode_fin}`;
  }
  return '-';
};



const genererPDF = async (facture) => {
  try {
    // Import logo
    let logo;
    try {
      const logoModule = await import('@/assets/logo.jpg');
      logo = logoModule.default;
    } catch (e) {
      console.warn('Logo non trovato');
    }

    // Fatture manuali: PDF semplice
    if (facture.type === 'manuelle') {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      
      if (logo) doc.addImage(logo, 'JPEG', 10, 10, 55, 10);
      doc.setFontSize(8);
      doc.text('DALLELEC Sarl\nRue de Bourgogne 25\n1203 Genève', 200, 12, { align: 'right' });
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`FACTURE N. ${facture.numero}`, 10, 40);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${formatDate(facture.date_facture)}`, 10, 50);
      doc.text(`Client: ${facture.client_nom}`, 10, 60);
      
      const tableData = facture.lignes.map(ligne => [
        ligne.description,
        ligne.quantite.toString(),
        `${ligne.prixUnitaire.toFixed(2)} CHF`,
        `${(ligne.quantite * ligne.prixUnitaire).toFixed(2)} CHF`
      ]);
      
      autoTable(doc, {
        head: [['Description', 'Quantité', 'Prix unitaire', 'Total HT']],
        body: tableData,
        startY: 70,
        theme: 'grid'
      });
      
      const finalY = doc.lastAutoTable.finalY + 10;
      const totalHT = facture.montant_ht || facture.montantHT;
      const tva = totalHT * 0.077;
      const ttc = totalHT + tva;
      
      doc.text(`Total HT: ${totalHT.toFixed(2)} CHF`, 140, finalY);
      doc.text(`TVA: ${tva.toFixed(2)} CHF`, 140, finalY + 7);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL TTC: ${ttc.toFixed(2)} CHF`, 140, finalY + 17);
      
      doc.save(`Facture_${facture.numero}.pdf`);
      alert('Facture générée avec succès!');
      return;
    }

    // Dati base
    const chantierId = facture.chantier_id || facture.chantierId;
    const metrageId = facture.metrage_id || facture.metrageId;
    const chantier = chantiers.value.find(c => c.id === chantierId);
    const chantierDevis = devis.value.find(d => d.id === chantier?.devis_id);
    const metrageDoc = metrages.value.find(m => m.id === metrageId);
    // Dati cliente completi con mode de paiement
    const nomeCliente = facture.client_nom || chantier?.client || 'Client';
    let clienteCompleto = null;
    let modePaiement = '30 jours net';
    
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('*, paiements(nom)')
        .eq('nom', nomeCliente)
        .single();
      
      if (clients) {
        clienteCompleto = clients;
        if (clients.paiements?.nom) {
          modePaiement = clients.paiements.nom;
        }
      }
    } catch (error) {
      console.log('Errore caricamento cliente:', error);
    }
    
    const numeroChantier = chantier?.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '';
    const nomeChantier = chantier?.nom || 'N/A';
    
    // Periodo di riferimento
    let periodoRef = '';
    if (metrageDoc?.periode_debut && metrageDoc?.periode_fin) {
      periodoRef = `Période: ${metrageDoc.periode_debut} - ${metrageDoc.periode_fin}`;
    } else if (metrageDoc?.created_at) {
      const date = new Date(metrageDoc.created_at);
      const mese = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      periodoRef = `Période: ${mese}`;
    }

    // Funzioni helper
    const drawHeader = (doc, title) => {
      if (logo) doc.addImage(logo, 'JPEG', 10, 10, 55, 10);
      doc.setFontSize(8);
      doc.text('DALLELEC Sarl\nRue de Bourgogne 25\n1203 Genève', 200, 12, { align: 'right' });
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 10, 40);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${formatDate(facture.date_facture)}`, 10, 50);
      if (periodoRef) doc.text(periodoRef, 10, 57);
      doc.text(`Client: ${nomeCliente}`, 10, periodoRef ? 64 : 57);
      doc.text(`Chantier: ${numeroChantier}${nomeChantier}`, 10, periodoRef ? 71 : 64);
    };

    // 1. PDF MÉTRÉES (sans prix)
    const docMetrees = new jsPDF({ unit: 'mm', format: 'a4' });
    drawHeader(docMetrees, `MÉTRÉES DÉTAILLÉES - ${facture.numero}`);
    
    let yPos = periodoRef ? 85 : 80;
    
    if (metrageDoc?.items) {
      // Raggruppa per zone
      const itemsByZone = {};
      metrageDoc.items.forEach(item => {
        if (!itemsByZone[item.zone]) itemsByZone[item.zone] = [];
        itemsByZone[item.zone].push(item);
      });
      
      // Per ogni zona
      Object.entries(itemsByZone).forEach(([zoneName, items]) => {
        docMetrees.setFontSize(12);
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.text(`Zone: ${zoneName}`, 10, yPos);
        
        // Calcola totale supplementi per ogni item
        const tableData = items.map(item => {
          const quantite = Number(item.mlPosee) || 0;
          let totalSuppl = 0;
          
          // Calcola totale supplementi da supplements array
          if (item.supplements && Array.isArray(item.supplements)) {
            totalSuppl = item.supplements.reduce((sum, supp) => {
              const qte = Number(supp.qte || supp.qtePosee) || 0;
              const valeur = Number(supp.valeur) || 0;
              return sum + (qte * valeur);
            }, 0);
          }
          
          const total = quantite + totalSuppl;
          
          return [
            item.article || '',
            item.nom || '',
            item.taille || '',
            'm',
            quantite.toFixed(2),
            totalSuppl.toFixed(2),
            total.toFixed(2)
          ];
        });
        
        autoTable(docMetrees, {
          head: [['Code Article', 'Produit', 'Taille', 'Unité', 'Quantité', 'Total Suppl.', 'Total']],
          body: tableData,
          startY: yPos + 5,
          theme: 'grid',
          headStyles: { fillColor: [230, 230, 230], fontSize: 8 },
          bodyStyles: { fontSize: 8 }
        });
        
        yPos = docMetrees.lastAutoTable.finalY + 5;
        
        // Sous-total zone
        const zoneTotal = tableData.reduce((sum, row) => sum + Number(row[6]), 0);
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.text(`Sous-total: ${zoneTotal.toFixed(2)} ML`, 150, yPos);
        yPos += 15;
      });
      
      // Détail suppléments par zone
      yPos += 10;
      docMetrees.setFontSize(14);
      docMetrees.setFont('helvetica', 'bold');
      docMetrees.text('Détail des Suppléments par Zone', 10, yPos);
      yPos += 10;
      
      Object.entries(itemsByZone).forEach(([zoneName, items]) => {
        docMetrees.setFontSize(12);
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.text(`Zone: ${zoneName}`, 10, yPos);
        yPos += 5;
        
        // Raggruppa supplementi per prodotto
        const suppByProduct = {};
        items.forEach(item => {
          if (item.supplements?.length > 0) {
            const key = `${item.article}-${item.nom}-${item.taille}`;
            if (!suppByProduct[key]) {
              suppByProduct[key] = {
                article: item.article,
                nom: item.nom,
                taille: item.taille,
                supplements: []
              };
            }
            suppByProduct[key].supplements.push(...item.supplements);
          }
        });
        
        Object.values(suppByProduct).forEach(product => {
          const suppData = product.supplements.map(supp => [
            product.article,
            product.nom,
            product.taille,
            supp.supplement || supp.nom || '',
            (Number(supp.qte || supp.qtePosee) || 0).toString(),
            (Number(supp.valeur) || 0).toFixed(1),
            ((Number(supp.qte || supp.qtePosee) || 0) * (Number(supp.valeur) || 0)).toFixed(2) + ' ML'
          ]);
          
          const totalSupp = product.supplements.reduce((sum, s) => 
            sum + ((Number(s.qte || s.qtePosee) || 0) * (Number(s.valeur) || 0)), 0
          );
          
          suppData.push([
            '', '', '', 
            { content: `Total Suppléments (${product.nom}):`, colSpan: 3, styles: { fontStyle: 'bold' } },
            { content: `${totalSupp.toFixed(2)} ML`, styles: { fontStyle: 'bold' } }
          ]);
          
          autoTable(docMetrees, {
            head: [['Code Article', 'Produit', 'Taille', 'Supplément', 'Qté', 'Valeur', 'Total ML']],
            body: suppData,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [230, 230, 230], fontSize: 8 },
            bodyStyles: { fontSize: 8 }
          });
          
          yPos = docMetrees.lastAutoTable.finalY + 5;
        });
        
        yPos += 10;
      });
    }
    
    // 2. PDF FACTURE (avec prix)
    const docFacture = new jsPDF({ unit: 'mm', format: 'a4' });
    drawHeader(docFacture, `FACTURE N. ${facture.numero}`);
    
    yPos = 80;
    let totalFactureHT = 0;
    
    if (metrageDoc?.items) {
      // Raggruppa per zone
      const itemsByZone = {};
      metrageDoc.items.forEach(item => {
        if (!itemsByZone[item.zone]) itemsByZone[item.zone] = [];
        itemsByZone[item.zone].push(item);
      });
      
      // Per ogni zona con prezzi
      Object.entries(itemsByZone).forEach(([zoneName, items]) => {
        docFacture.setFontSize(12);
        docFacture.setFont('helvetica', 'bold');
        docFacture.text(`Zone: ${zoneName}`, 10, yPos);
        
        let zoneTotal = 0;
        const tableData = items.map(item => {
          const prodottoDevis = chantierDevis?.produits?.find(p => p.article === item.article);
          const prezzoUnit = Number(prodottoDevis?.prix || 50);
          const quantite = Number(item.mlPosee) || 0;
          
          // Calcola totale supplementi
          let totalSuppl = 0;
          if (item.supplements && Array.isArray(item.supplements)) {
            totalSuppl = item.supplements.reduce((sum, supp) => {
              const qte = Number(supp.qte || supp.qtePosee) || 0;
              const valeur = Number(supp.valeur) || 0;
              return sum + (qte * valeur);
            }, 0);
          }
          
          const total = quantite + totalSuppl;
          const totalItem = total * prezzoUnit;
          zoneTotal += totalItem;
          totalFactureHT += totalItem;
          
          return [
            item.article || '',
            item.nom || '',
            item.taille || '',
            'm',
            quantite.toFixed(2),
            totalSuppl.toFixed(2),
            total.toFixed(2),
            `${prezzoUnit.toFixed(2)} CHF`,
            `${totalItem.toFixed(2)} CHF`
          ];
        });
        
        autoTable(docFacture, {
          head: [['Code Article', 'Produit', 'Taille', 'Unité', 'Quantité', 'Total Suppl.', 'Total', 'Prix Unit.', 'Total']],
          body: tableData,
          startY: yPos + 5,
          theme: 'grid',
          headStyles: { fillColor: [230, 230, 230], fontSize: 8 },
          bodyStyles: { fontSize: 8 }
        });
        
        yPos = docFacture.lastAutoTable.finalY + 5;
        
        // Sous-total zone
        docFacture.setFont('helvetica', 'bold');
        docFacture.text(`Sous-total: ${zoneTotal.toFixed(2)} CHF`, 150, yPos);
        yPos += 15;
      });
    }
    
    // Régies se presenti
    if (metrageDoc?.regies?.length > 0) {
      docFacture.setFontSize(12);
      docFacture.setFont('helvetica', 'bold');
      docFacture.text('RÉGIES', 10, yPos);
      
      const regieData = metrageDoc.regies.map(regie => {
        const total = (Number(regie.heures) || 0) * (Number(regie.prixHeure) || 0);
        totalFactureHT += total;
        return [
          regie.zone || '',
          regie.description || '',
          `${regie.heures || 0}h`,
          `${(Number(regie.prixHeure) || 0).toFixed(2)} CHF`,
          `${total.toFixed(2)} CHF`
        ];
      });
      
      autoTable(docFacture, {
        head: [['Zone', 'Description', 'Heures', 'Prix/h', 'Total']],
        body: regieData,
        startY: yPos + 5,
        theme: 'grid',
        headStyles: { fillColor: [230, 230, 230], fontSize: 9 },
        bodyStyles: { fontSize: 8 }
      });
      
      yPos = docFacture.lastAutoTable.finalY + 10;
    }
    
    // Totali finali
    const realMontantHT = totalFactureHT;
    const realTauxTVA = 8.1; // TVA svizzera 8.1%
    const realMontantTVA = realMontantHT * (realTauxTVA / 100);
    const realMontantTTC = realMontantHT + realMontantTVA;
    
    docFacture.setFontSize(10);
    docFacture.text(`Total HT: ${realMontantHT.toFixed(2)} CHF`, 140, yPos);
    docFacture.text(`TVA (${realTauxTVA}%): ${realMontantTVA.toFixed(2)} CHF`, 140, yPos + 7);
    docFacture.setFont('helvetica', 'bold');
    docFacture.text(`TOTAL TTC: ${realMontantTTC.toFixed(2)} CHF`, 140, yPos + 17);
    
    // Conditions de paiement et référence
    docFacture.setFont('helvetica', 'normal');
    docFacture.setFontSize(9);
    
    docFacture.text(`Conditions de paiement: ${modePaiement}`, 10, yPos + 35);
    if (periodoRef) {
      docFacture.text(`Facture établie sur la base des métrées ${periodoRef.toLowerCase()}`, 10, yPos + 42);
    }
    
    // Salva documenti
    docMetrees.save(`Metrees_Detaillees_${facture.numero}.pdf`);
    docFacture.save(`Facture_${facture.numero}.pdf`);
    
    alert('Deux documents générés:\n1. Métrées détaillées (pour technicien)\n2. Facture (pour comptabilité)');
    
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    alert('Erreur génération PDF: ' + error.message);
  }
  try {
    // Import logo
    let logo;
    try {
      const logoModule = await import('@/assets/logo.jpg');
      logo = logoModule.default;
    } catch (e) {
      console.warn('Logo non trovato');
    }

    // Fatture manuali: PDF semplice
    if (facture.type === 'manuelle') {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      
      // Header
      if (logo) {
        doc.addImage(logo, 'JPEG', 10, 10, 55, 10);
      }
      
      doc.setFontSize(8);
      doc.text('DALLELEC Sarl\nRue de Bourgogne 25\n1203 Genève', 200, 12, { align: 'right' });
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`FACTURE N. ${facture.numero}`, 10, 40);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${formatDate(facture.date_facture)}`, 10, 50);
      doc.text(`Client: ${facture.client_nom}`, 10, 60);
      
      // Tabella
      const tableData = facture.lignes.map(ligne => [
        ligne.description,
        ligne.quantite.toString(),
        `${ligne.prixUnitaire.toFixed(2)} CHF`,
        `${(ligne.quantite * ligne.prixUnitaire).toFixed(2)} CHF`
      ]);
      
      autoTable(doc, {
        head: [['Description', 'Quantité', 'Prix unitaire', 'Total HT']],
        body: tableData,
        startY: 70,
        theme: 'grid'
      });
      
      // Totali
      const finalY = doc.lastAutoTable.finalY + 10;
      const totalHT = facture.montant_ht || facture.montantHT;
      const tva = totalHT * 0.077;
      const ttc = totalHT + tva;
      
      doc.text(`Total HT: ${totalHT.toFixed(2)} CHF`, 140, finalY);
      doc.text(`TVA: ${tva.toFixed(2)} CHF`, 140, finalY + 7);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL TTC: ${ttc.toFixed(2)} CHF`, 140, finalY + 17);
      
      doc.save(`Facture_${facture.numero}.pdf`);
      alert('Facture générée avec succès!');
      return;
    }
    
    // Fatture automatiche da métrages
    const chantierId = facture.chantier_id || facture.chantierId;
    const metrageId = facture.metrage_id || facture.metrageId;
    
    const chantier = chantiers.value.find(c => c.id === chantierId);
    const chantierDevis = devis.value.find(d => d.id === chantier?.devis_id);
    const metrageDoc = metrages.value.find(m => m.id === metrageId);
    
    // Dati cliente
    const nomeCliente = chantier?.client || 'Client';
    let clienteCompleto = null;
    try {
      const { data: clients } = await supabase.from('clients').select('*');
      if (clients) {
        clienteCompleto = clients.find(c => c.nom === nomeCliente);
      }
    } catch (error) {
      console.log('Errore caricamento clienti:', error);
    }
    
    // Funzioni helper per PDF
    const drawHeader = (doc, title) => {
      if (logo) {
        doc.addImage(logo, 'JPEG', 10, 10, 55, 10);
      }
      doc.setFontSize(8);
      doc.text('DALLELEC Sarl\nRue de Bourgogne 25\n1203 Genève', 200, 12, { align: 'right' });
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 10, 40);
    };
    
    const drawFooter = (doc) => {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('DALLELEC Sarl - CHE-123.456.789 TVA - 1203 Genève', 105, 280, { align: 'center' });
    };
    
    // 1. DOCUMENTO MÉTRÉES (resoconto tecnico senza prezzi)
    const docMetrees = new jsPDF({ unit: 'mm', format: 'a4' });
    drawHeader(docMetrees, `MÉTRÉES DÉTAILLÉES - ${facture.numero}`);
    
    // Informazioni métrées
    docMetrees.setFontSize(9);
    docMetrees.setFont('helvetica', 'normal');
    docMetrees.text(`Date: ${formatDate(facture.date_facture)}`, 10, 50);
    docMetrees.text(`Client: ${nomeCliente}`, 10, 57);
    
    const numeroChantier = chantier?.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '';
    docMetrees.text(`Chantier: ${numeroChantier}${chantier?.nom || 'N/A'}`, 10, 64);
    
    let tableStartY = 80;
    
    // Tabella métrées (senza prezzi)
    if (metrageDoc && metrageDoc.items) {
      const grouped = {};
      metrageDoc.items.forEach(item => {
        if (!grouped[item.zone]) grouped[item.zone] = [];
        grouped[item.zone].push(item);
      });
      
      Object.entries(grouped).forEach(([zoneName, items]) => {
        docMetrees.setFontSize(12);
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.text(`Zone: ${zoneName}`, 10, tableStartY);
        
        const tableData = items.map(item => [
          item.article || '',
          item.nom || '',
          item.taille || '',
          (Number(item.mlPosee) || 0).toFixed(2),
          (Number(item.totalML) || 0).toFixed(2)
        ]);
        
        autoTable(docMetrees, {
          head: [['Code', 'Produit', 'Taille', 'ML Posé', 'ML Total']],
          body: tableData,
          startY: tableStartY + 4,
          theme: 'grid',
          headStyles: { fillColor: [230, 230, 230], fontSize: 8 },
          bodyStyles: { fontSize: 8 }
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
            const qteValue = Number(s.qte || 0);
            const valeurValue = Number(s.valeur || 0);
            const totalML = s.totalML || (qteValue && valeurValue ? qteValue * valeurValue : 0);
            body.push([
              s.article || '',
              s.nom || '',
              s.taille || '',
              s.supplement || '',
              s.qte != null ? String(qteValue) : '',
              valeurValue.toFixed(2),
              Number(totalML || 0).toFixed(2)
            ]);
          });
          
          // Aggiungiamo la riga totale per il gruppo
          const groupTotal = group.entries.reduce((sum, e) => {
            const qteValue = Number(e.qte || 0);
            const valeurValue = Number(e.valeur || 0);
            const totalML = e.totalML || (qteValue && valeurValue ? qteValue * valeurValue : 0);
            return sum + Number(totalML || 0);
          }, 0);
          
          body.push([
            '',
            '',
            '',
            `Total Suppléments:`,
            '',
            '',
            `${Number(groupTotal || 0).toFixed(2)} ML`
          ]);
        });
      }
      

      
      autoTable(docMetrees, {
        head: head,
        body: body,
        startY: tableStartY + 4,
        theme: 'grid',
        headStyles: {
          fillColor: [230, 230, 230],
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 40 },
          2: { cellWidth: 15 },
          3: { cellWidth: 40 },
          4: { cellWidth: 15 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 }
        }
      });
      
      // Aggiorniamo la posizione per la prossima zona
      tableStartY = docMetrees.lastAutoTable.finalY + 10;
    });
  }
    
    // 2. DOCUMENTO FACTURE (con prezzi)
    const docFacture = new jsPDF({ unit: 'mm', format: 'a4' });
    drawHeader(docFacture, `FACTURE N. ${facture.numero}`);
    
    // Informazioni fattura
    docFacture.setFontSize(9);
    docFacture.text(`Date: ${formatDate(facture.date_facture)}`, 10, 50);
    docFacture.text(`Client: ${nomeCliente}`, 10, 57);
    docFacture.text(`Chantier: ${numeroChantier}${chantier?.nom || 'N/A'}`, 10, 64);
    
    // Tabella con prezzi
    let totalHT = 0;
    const factureTableData = [];
    
    if (metrageDoc?.items) {
      metrageDoc.items.forEach(item => {
        const prodottoDevis = chantierDevis?.produits?.find(p => p.article === item.article);
        const prezzoML = Number(prodottoDevis?.prix || 50);
        const mlPosato = Number(item.totalML || 0);
        const totaleItem = mlPosato * prezzoML;
        
        totalHT += totaleItem;
        
        factureTableData.push([
          item.article || '',
          item.nom || '',
          item.zone || '',
          mlPosato.toFixed(2),
          `${prezzoML.toFixed(2)} CHF`,
          `${totaleItem.toFixed(2)} CHF`
        ]);
      });
    }
    
    autoTable(docFacture, {
      head: [['Code', 'Description', 'Zone', 'ML Posé', 'Prix/ML', 'Total HT']],
      body: factureTableData,
      startY: 75,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], fontSize: 9 },
      bodyStyles: { fontSize: 8 }
    });
    
    // Totali usando dati reali della fattura
    const finalY = docFacture.lastAutoTable.finalY + 10;
    const realMontantHT = Number(facture.montant_ht || totalHT);
    const realTauxTVA = Number(facture.taux_tva || 7.7);
    const realMontantTTC = Number(facture.montant_ttc || realMontantHT * (1 + realTauxTVA/100));
    const realMontantTVA = realMontantTTC - realMontantHT;
    
    docFacture.setFontSize(10);
    docFacture.text(`Total HT: ${realMontantHT.toFixed(2)} CHF`, 140, finalY);
    docFacture.text(`TVA (${realTauxTVA}%): ${realMontantTVA.toFixed(2)} CHF`, 140, finalY + 7);
    docFacture.setFont('helvetica', 'bold');
    docFacture.text(`TOTAL TTC: ${realMontantTTC.toFixed(2)} CHF`, 140, finalY + 17);
    
    // Footer
    drawFooter(docFacture);
    
    // Salva entrambi i documenti
    docMetrees.save(`Metrees_Detaillees_${facture.numero}.pdf`);
    docFacture.save(`Facture_${facture.numero}.pdf`);
    
    alert('Deux documents générés:\n1. Métrées détaillées (pour technicien)\n2. Facture (pour comptabilité)');
    
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    alert('Erreur génération PDF: ' + error.message);
  }
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