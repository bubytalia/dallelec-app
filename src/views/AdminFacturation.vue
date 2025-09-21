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
          <button @click="pulirVecchiResoconti" class="btn btn-sm btn-warning me-2">
            🧹 Nettoyer anciens tests
          </button>
          <button @click="loadData" class="btn btn-sm btn-info me-2">
            🔄 Recharger données
          </button>
          <button @click="forceReload" class="btn btn-sm btn-warning">
            ⚡ Force Reload
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
                <td>{{ getChantierNameWithNumber(resoconto.chantier_id || resoconto.chantierId) }}</td>
                <td>{{ getClientName(resoconto.chantier_id || resoconto.chantierId) }}</td>
                <td>{{ formatDate(resoconto.created_at) }}</td>
                <td>{{ resoconto.periode_month || resoconto.periodeMonth }}</td>
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
                <td>
                  <span v-if="(facture.acconti_precedenti || 0) > 0" class="text-success">
                    {{ formatCurrency(calculateSoldeFinale(facture)) }}
                  </span>
                  <span v-else>
                    {{ formatCurrency(facture.montant_ttc || facture.montantTTC || 0) }}
                  </span>
                </td>
                <td>
                  <select 
                    :value="facture.statut" 
                    @change="updateStatutDirect(facture, $event.target.value)"
                    class="form-select form-select-sm"
                    :class="getStatutSelectClass(facture.statut)"
                  >
                    <option value="emise">Émise</option>
                    <option value="envoyee">Envoyée</option>
                    <option value="payee">Payée</option>
                    <option value="en_retard">En retard</option>
                  </select>
                </td>
                <td>
                  <button @click="modifierFacture(facture)" class="btn btn-sm btn-primary me-2">
                    ✏️ Modifier
                  </button>

                  <button @click="genererPDF(facture)" class="btn btn-sm btn-info me-2">
                    📄 PDF
                  </button>
                  <button v-if="(facture.montant_ttc || facture.montantTTC || 0) === 0" @click="corrigerFacture(facture)" class="btn btn-sm btn-warning me-2" title="Corriger montant">
                    🔧
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
            <h5>Détail Resoconto - {{ getChantierName(detailResoconto.chantier_id) }}</h5>
            <button @click="showDetailResoconto = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Informations Générales</h6>
                <p><strong>Chantier:</strong> {{ getChantierName(detailResoconto.chantier_id || detailResoconto.chantierId) }}</p>
                <p><strong>Période:</strong> {{ detailResoconto.periode_month }}</p>
                <p><strong>Description:</strong> {{ detailResoconto.descrizione || '-' }}</p>
                <p><strong>Date soumission:</strong> {{ formatDate(detailResoconto.created_at) }}</p>
              </div>
              <div class="col-md-6">
                <h6>Avancement par zone</h6>
                <div v-for="(percentage, zone) in detailResoconto.avancementi" :key="zone">
                  <p><strong>{{ zone }}:</strong> +{{ percentage }}%</p>
                </div>
              </div>
            </div>
            <div class="row mt-3" v-if="detailResoconto.regies && detailResoconto.regies.length > 0">
              <div class="col-md-12">
                <h6>Régies (Heures supplémentaires)</h6>
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Heures</th>
                      <th>Prix/h</th>
                      <th>Total</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="regie in detailResoconto.regies" :key="regie.zone + regie.description">
                      <td>{{ regie.zone }}</td>
                      <td>{{ regie.heures }}h</td>
                      <td>{{ (regie.prixHeure || getPrixRegieChantier()).toFixed(2) }} CHF</td>
                      <td><strong>{{ (regie.heures * (regie.prixHeure || getPrixRegieChantier())).toFixed(2) }} CHF</strong></td>
                      <td>{{ regie.description }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="table-warning">
                      <td colspan="3"><strong>Total Régies:</strong></td>
                      <td><strong>{{ detailResoconto.regies.reduce((sum, r) => sum + (r.heures * (r.prixHeure || getPrixRegieChantier())), 0).toFixed(2) }} CHF</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <!-- ANTEPRIMA FATTURA -->
            <div class="row mt-4">
              <div class="col-md-12">
                <div class="card bg-light">
                  <div class="card-header bg-primary text-white">
                    <h6 class="mb-0">💰 ANTEPRIMA FATTURA</h6>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-8">
                        <h6>Travaux réalisés:</h6>
                        <table class="table table-sm table-bordered">
                          <thead class="table-secondary">
                            <tr>
                              <th>Zone</th>
                              <th>Avancement</th>
                              <th>Montant HT</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(percentage, zone) in detailResoconto.avancementi" :key="zone">
                              <td><strong>{{ zone }}</strong></td>
                              <td>{{ percentage }}%</td>
                              <td><strong>{{ calculateZoneMontant(zone, percentage).toFixed(2) }} CHF</strong></td>
                            </tr>
                          </tbody>
                          <tfoot class="table-warning">
                            <tr>
                              <td colspan="2"><strong>Sous-total Travaux:</strong></td>
                              <td><strong>{{ calculateTotalTravaux().toFixed(2) }} CHF</strong></td>
                            </tr>
                          </tfoot>
                        </table>
                        
                        <div v-if="detailResoconto.regies && detailResoconto.regies.length > 0">
                          <h6>Régies:</h6>
                          <table class="table table-sm table-bordered">
                            <tbody>
                              <tr v-for="regie in detailResoconto.regies" :key="regie.zone + regie.description">
                                <td>{{ regie.zone }} - {{ regie.description }}</td>
                                <td>{{ regie.heures }}h × {{ (regie.prixHeure || getPrixRegieChantier()).toFixed(2) }} CHF</td>
                                <td><strong>{{ (regie.heures * (regie.prixHeure || getPrixRegieChantier())).toFixed(2) }} CHF</strong></td>
                              </tr>
                            </tbody>
                            <tfoot class="table-warning">
                              <tr>
                                <td colspan="2"><strong>Sous-total Régies:</strong></td>
                                <td><strong>{{ calculateTotalRegies().toFixed(2) }} CHF</strong></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                      
                      <div class="col-md-4">
                        <div class="card border-success">
                          <div class="card-header bg-success text-white text-center">
                            <h6 class="mb-0">TOTAUX FACTURE</h6>
                          </div>
                          <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                              <span>Total HT:</span>
                              <strong>{{ calculateTotalHT().toFixed(2) }} CHF</strong>
                            </div>
                            <div v-if="accontiPrecedentiResoconto > 0" class="d-flex justify-content-between mb-2 text-danger">
                              <span>Acconti HT:</span>
                              <strong>-{{ accontiPrecedentiResoconto.toFixed(2) }} CHF</strong>
                            </div>
                            <div v-if="accontiPrecedentiResoconto > 0" class="d-flex justify-content-between mb-2">
                              <span>Imponibile residuo:</span>
                              <strong>{{ (calculateTotalHT() - accontiPrecedentiResoconto).toFixed(2) }} CHF</strong>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                              <span>TVA (8.1%):</span>
                              <strong>{{ calculateTVAWithAcconti().toFixed(2) }} CHF</strong>
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between">
                              <span class="h6">{{ accontiPrecedentiResoconto > 0 ? 'SOLDE À PAYER:' : 'TOTAL TTC:' }}</span>
                              <strong class="h5 text-success">{{ calculateTotalTTCWithAcconti().toFixed(2) }} CHF</strong>
                            </div>
                          </div>
                        </div>
                        
                        <div class="mt-3">
                          <div class="mb-3">
                            <label class="form-label"><strong>Acconti già fatturati (CHF HT):</strong></label>
                            <input 
                              v-model.number="accontiPrecedentiResoconto" 
                              type="number" 
                              step="0.01" 
                              class="form-control" 
                              placeholder="0.00"
                            >
                            <small class="text-muted">Importo HT da sottrarre (es: 9250 per 2 acconti da 4625 HT + TVA)</small>
                          </div>
                          
                          <div class="text-center">
                            <small class="text-muted">
                              💡 Ceci est l'aperçu de la facture qui sera générée
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
              
              <!-- Régies pour métrages -->
              <div class="mb-3" v-if="detailMetrage.regies && detailMetrage.regies.length > 0">
                <h6>Régies (Heures supplémentaires):</h6>
                <table class="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Heures</th>
                      <th>Prix/h</th>
                      <th>Total</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="regie in detailMetrage.regies" :key="regie.zone + regie.description">
                      <td>{{ regie.zone }}</td>
                      <td>{{ regie.heures }}h</td>
                      <td>{{ (regie.prixHeure || getPrixRegieMetrage()).toFixed(2) }} CHF</td>
                      <td><strong>{{ (regie.heures * (regie.prixHeure || getPrixRegieMetrage())).toFixed(2) }} CHF</strong></td>
                      <td>{{ regie.description }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="table-warning">
                      <td colspan="3"><strong>Total Régies:</strong></td>
                      <td><strong>{{ detailMetrage.regies.reduce((sum, r) => sum + (r.heures * (r.prixHeure || getPrixRegieMetrage())), 0).toFixed(2) }} CHF</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div class="mb-3">
                <label class="form-label">Acconti già fatturati (CHF TTC):</label>
                <input 
                  v-model.number="accontiPrecedenti" 
                  type="number" 
                  step="0.01" 
                  class="form-control" 
                  placeholder="0.00"
                >
                <small class="text-muted">Importo da sottrarre nel PDF (solo visualizzazione)</small>
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
const clients = ref([]);

const showDetailMetrage = ref(false);
const detailMetrage = ref({});
const accontiPrecedenti = ref(0);
const accontiPrecedentiResoconto = ref(0);
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
  return factures.value.some(f => (f.resocontoId || f.resoconto_id) === resoconto.id);
};

// Métrages complétés mais non encore facturés
const metragesEnAttente = computed(() => {
  return metrages.value.filter(m => 
    !m.draft && // Métrage sauvegardé (non brouillon)
    (m.status === 'en_attente' || !m.status) && // En attente d'approbation ou ancien
    !m.facture && // Pas encore facturé
    ((m.total_ml || m.totalML) > 0 || (m.regies && m.regies.length > 0)) // A du contenu (ML ou regias)
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

const forceReload = async () => {
  // Svuota completamente gli array
  devis.value = [];
  chantiers.value = [];
  factures.value = [];
  metrages.value = [];
  resocontiPercentuali.value = [];
  
  console.log('⚡ FORCE RELOAD - Svuotamento cache completato');
  
  // Ricarica tutto
  await loadData();
  
  alert('Cache svuotata e dati ricaricati!');
};

const loadClients = async () => {
  try {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) throw error;
    clients.value = data || [];
  } catch (error) {
    console.error('Erreur chargement clients:', error);
  }
};

const loadData = async () => {
  try {
    // Clients per PDF
    await loadClients();
    
    // Métrages (se esiste la tabella)
    try {
      const { data: metragesData, error: metragesError } = await supabase
        .from('metrages')
        .select('*');
      if (metragesError && metragesError.code === 'PGRST205') {
        console.log('⚠️ Tabella metrages non esiste ancora');
        metrages.value = [];
      } else if (metragesError) {
        throw metragesError;
      } else {
        metrages.value = metragesData || [];
      }
    } catch (err) {
      console.log('⚠️ Errore caricamento metrages:', err.message);
      metrages.value = [];
    }

    // Resoconti percentuali (se esiste la tabella)
    try {
      const { data: resocontiData, error: resocontiError } = await supabase
        .from('resoconti_percentuali')
        .select('*');
      if (resocontiError && resocontiError.code === 'PGRST205') {
        console.log('⚠️ Tabella resoconti_percentuali non esiste ancora');
        resocontiPercentuali.value = [];
      } else if (resocontiError) {
        throw resocontiError;
      } else {
        resocontiPercentuali.value = resocontiData || [];
      }
    } catch (err) {
      console.log('⚠️ Errore caricamento resoconti:', err.message);
      resocontiPercentuali.value = [];
    }

    // Factures
    try {
      const { data: facturesData, error: facturesError } = await supabase
        .from('factures')
        .select('*');
      if (facturesError && facturesError.code === 'PGRST205') {
        console.log('⚠️ Tabella factures non esiste ancora');
        factures.value = [];
      } else if (facturesError) {
        throw facturesError;
      } else {
        factures.value = facturesData || [];
      }
    } catch (err) {
      console.log('⚠️ Errore caricamento factures:', err.message);
      factures.value = [];
    }

    // Chantiers
    const { data: chantiersData, error: chantiersError } = await supabase
      .from('chantiers')
      .select('*');
    if (chantiersError) throw chantiersError;
    chantiers.value = chantiersData || [];

    // Devis - con timestamp per evitare cache
    const { data: devisData, error: devisError } = await supabase
      .from('devis')
      .select('*')
      .gte('id', 0); // Forza ricaricamento
    if (devisError) throw devisError;
    devis.value = devisData || [];
    console.log('🔄 Devis ricaricati:', devis.value.length);
    
    // Debug devis ID 11
    const devis11 = devis.value.find(d => d.id === 11);
    if (devis11) {
      console.log('🎯 Devis 11 trovato:', {
        total: devis11.total,
        prodotti: devis11.produits?.length || 0,
        primiTreProdotti: devis11.produits?.slice(0, 3).map(p => ({ zone: p.zone, total: p.total }))
      });
    } else {
      console.log('❌ Devis 11 NON trovato!');
    }
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
    
    const numeroFacture = await generateNumeroFacture();
    
    // Crée la facture
    const { error } = await supabase
      .from('factures')
      .insert([{
        numero: numeroFacture,
        chantier_id: metrage.chantier_id,
        metrage_id: metrage.id,
        date_facture: new Date().toISOString().split('T')[0],
        montant_ht: montantHT,
        taux_tva: 8.1,
        montant_ttc: montantHT * 1.081,
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
  accontiPrecedenti.value = 0; // Reset acconti
  showDetailMetrage.value = true;
};

const voirDetailResoconto = (resoconto) => {
  detailResoconto.value = resoconto;
  accontiPrecedentiResoconto.value = 0; // Reset acconti
  showDetailResoconto.value = true;
  
  // Debug per verificare i dati
  const chantier = chantiers.value.find(c => c.id == (resoconto.chantier_id || resoconto.chantierId));
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  
  console.log('🔍 RESOCONTO:', resoconto);
  console.log('🏗️ CHANTIER:', chantier);
  console.log('📋 DEVIS ID:', chantier?.devis_id);
  console.log('📄 DEVIS TROVATO:', chantierDevis);
  console.log('💰 TOTALE DEVIS:', chantierDevis?.total);
  console.log('📦 PRODOTTI:', chantierDevis?.produits?.length || 0);
  
  // DEBUG DETTAGLIATO PRODOTTI
  if (chantierDevis?.produits) {
    console.log('🔍 PRIMI 3 PRODOTTI DAL DEVIS:');
    chantierDevis.produits.slice(0, 3).forEach((p, i) => {
      console.log(`  ${i+1}. ${p.zone}: ${p.total} CHF (${p.article})`);
    });
    
    // Calcola totali per zona dal devis caricato
    const totaliZone = {};
    chantierDevis.produits.forEach(p => {
      if (!totaliZone[p.zone]) totaliZone[p.zone] = 0;
      totaliZone[p.zone] += Number(p.total || 0);
    });
    console.log('💰 TOTALI REALI PER ZONA:', totaliZone);
  }
  
  // Rimosso debug duplicato
};

// Funzioni per calcolo anteprima fattura
const calculateZoneMontant = (zone, percentage) => {
  const chantier = chantiers.value.find(c => c.id == (detailResoconto.value.chantier_id || detailResoconto.value.chantierId));
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  
  if (!chantierDevis || !chantierDevis.produits) {
    console.log(`❌ Devis non trovato per zona ${zone}`);
    return 0;
  }
  
  // USA I TOTALI GIÀ CALCOLATI NEL DEVIS
  const totaleZona = chantierDevis.produits
    .filter(p => p.zone === zone)
    .reduce((sum, p) => sum + Number(p.total || 0), 0);
  
  const result = totaleZona * percentage / 100;
  console.log(`🎯 ${zone}: ${totaleZona.toFixed(2)} CHF × ${percentage}% = ${result.toFixed(2)} CHF`);
  return result;
};

const calculateTotalTravaux = () => {
  if (!detailResoconto.value.avancementi) return 0;
  return Object.entries(detailResoconto.value.avancementi).reduce((sum, [zone, percentage]) => {
    return sum + calculateZoneMontant(zone, percentage);
  }, 0);
};

const getPrixRegieChantier = () => {
  const chantier = chantiers.value.find(c => c.id == (detailResoconto.value.chantier_id || detailResoconto.value.chantierId));
  return chantier?.prix_regie || 75;
};

const getPrixRegieMetrage = () => {
  const chantier = chantiers.value.find(c => c.id == detailMetrage.value.chantier_id);
  return chantier?.prix_regie || 75;
};

const calculateTotalRegies = () => {
  if (!detailResoconto.value.regies) return 0;
  const prixRegie = getPrixRegieChantier();
  return detailResoconto.value.regies.reduce((sum, r) => sum + (r.heures * (r.prixHeure || prixRegie)), 0);
};

const calculateTotalHT = () => {
  return calculateTotalTravaux() + calculateTotalRegies();
};

const calculateTVA = () => {
  return calculateTotalHT() * 0.081;
};

const calculateTotalTTC = () => {
  return calculateTotalHT() + calculateTVA();
};

const calculateTVAWithAcconti = () => {
  const totalHT = calculateTotalHT();
  const acconti = Number(accontiPrecedentiResoconto.value || 0);
  const imponibileResiduo = totalHT - acconti;
  return imponibileResiduo * 0.081;
};

const calculateTotalTTCWithAcconti = () => {
  const totalHT = calculateTotalHT();
  const acconti = Number(accontiPrecedentiResoconto.value || 0);
  const imponibileResiduo = totalHT - acconti;
  const tva = imponibileResiduo * 0.081;
  return imponibileResiduo + tva;
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
    const chantier = chantiers.value.find(c => c.id === (resoconto.chantier_id || resoconto.chantierId));
    const chantierDevis = devis.value.find(d => d.id === chantier?.devis_id);
    
    // USA LA STESSA LOGICA DEL PDF
    detailResoconto.value = resoconto;
    const montantHT = calculateTotalHT();
    
    const numeroFacture = await generateNumeroFacture();
    const accontiInseriti = Number(accontiPrecedentiResoconto.value || 0);
    
    const { error } = await supabase
      .from('factures')
      .insert([{
        numero: numeroFacture,
        chantier_id: resoconto.chantier_id || resoconto.chantierId,
        resoconto_id: resoconto.id,
        date_facture: new Date().toISOString().split('T')[0],
        montant_ht: montantHT,
        taux_tva: 8.1,
        montant_ttc: montantHT * 1.081,
        acconti_precedenti: accontiInseriti,
        statut: 'emise',
        client_nom: chantier?.client || 'Client',
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `Facture générée depuis resoconto percentuel ${resoconto.periode_month || resoconto.periodeMonth}`,
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
    const chantier = chantiers.value.find(c => c.id === (resoconto.chantier_id || resoconto.chantierId));
    const chantierDevis = devis.value.find(d => d.id === chantier?.devis_id);
    
    const totalPercentuali = Object.values(resoconto.avancementi || {}).reduce((sum, pct) => sum + pct, 0);
    const montantTravauxHT = chantierDevis?.total ? (chantierDevis.total * totalPercentuali / 100) : 1000;
    
    // Calcola montant regie
    const prixRegieChantier = chantier?.prix_regie || 75;
    const montantRegiesHT = (resoconto.regies || []).reduce((sum, r) => sum + (r.heures * (r.prixHeure || prixRegieChantier)), 0);
    const montantHT = montantTravauxHT + montantRegiesHT;
    
    const numeroFacture = await generateNumeroFacture();
    
    const { error } = await supabase
      .from('factures')
      .insert([{
        numero: numeroFacture,
        chantier_id: resoconto.chantier_id || resoconto.chantierId,
        resoconto_id: resoconto.id,
        date_facture: new Date().toISOString().split('T')[0],
        montant_ht: montantHT,
        taux_tva: 8.1,
        montant_ttc: montantHT * 1.081,
        statut: 'emise',
        client_nom: chantier?.client || 'Client',
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `Facture générée depuis resoconto percentuel ${resoconto.periode_month || resoconto.periodeMonth}`,
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

const corrigerFacture = async (facture) => {
  if (!confirm(`Recalculer le montant de la facture ${facture.numero} ?`)) return;
  
  try {
    // Trova il métrage associato
    const metrage = metrages.value.find(m => m.id === (facture.metrage_id || facture.metrageId));
    if (!metrage) {
      alert('Métrage associé non trouvé');
      return;
    }
    
    console.log('Debug métrage pour correction:', metrage);
    
    // Recalcule le montant
    let montantHT = 0;
    
    // Trova il devis associato per i prezzi prodotti
    const chantier = chantiers.value.find(c => c.id === (facture.chantier_id || facture.chantierId));
    const chantierDevis = devis.value.find(d => d.id === chantier?.devis_id);
    
    // Calcola montant produits
    if (metrage.items && metrage.items.length > 0) {
      metrage.items.forEach(item => {
        const prodottoDevis = chantierDevis?.produits?.find(p => p.article === item.article);
        const prezzoUnit = Number(prodottoDevis?.prix || 50);
        const quantite = Number(item.mlPosee || 0);
        
        let totalSuppl = 0;
        if (item.supplements && Array.isArray(item.supplements)) {
          totalSuppl = item.supplements.reduce((sum, supp) => {
            const qte = Number(supp.qte || supp.qtePosee || 0);
            const valeur = Number(supp.valeur || 0);
            return sum + (qte * valeur);
          }, 0);
        }
        
        const total = quantite + totalSuppl;
        montantHT += total * prezzoUnit;
      });
    }
    
    // Calcola montant regie
    if (metrage.regies && metrage.regies.length > 0) {
      const montantRegies = metrage.regies.reduce((sum, r) => sum + (r.heures * r.prixHeure), 0);
      montantHT += montantRegies;
    }
    
    console.log('Montant total calculé:', montantHT);
    
    const montantTTC = montantHT * 1.081; // TVA 8.1%
    
    // Met à jour la facture
    const { error } = await supabase
      .from('factures')
      .update({
        montant_ht: montantHT,
        montant_ttc: montantTTC
      })
      .eq('id', facture.id);
    
    if (error) throw error;
    
    alert(`Facture corrigée: ${montantTTC.toFixed(2)} CHF`);
    loadData();
  } catch (error) {
    console.error('Erreur correction facture:', error);
    alert('Erreur: ' + error.message);
  }
};

const supprimerFacture = async (facture) => {
  if (!confirm(`Supprimer la facture ${facture.numero} ?\n\nATTENTION: L'élément associé sera remis en attente de facturation.`)) return;
  
  try {
    // Supprime la facture
    const { error } = await supabase
      .from('factures')
      .delete()
      .eq('id', facture.id);
    
    if (error) throw error;
    
    // Remet le métrage en attente si il existe
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
    
    // Remet le resoconto en attente si il existe
    if (facture.resoconto_id || facture.resocontoId) {
      try {
        await supabase
          .from('resoconti_percentuali')
          .update({
            status: 'en_attente'
          })
          .eq('id', facture.resoconto_id || facture.resocontoId);
      } catch (err) {
        console.log('Tabella resoconti_percentuali non esiste, skip update');
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

const getStatutSelectClass = (statut) => {
  const classes = {
    emise: 'text-secondary',
    envoyee: 'text-info',
    payee: 'text-success',
    en_retard: 'text-danger'
  };
  return classes[statut] || 'text-secondary';
};

const updateStatutDirect = async (facture, nouveauStatut) => {
  try {
    const { error } = await supabase
      .from('factures')
      .update({
        statut: nouveauStatut,
        statut_updated_at: new Date().toISOString()
      })
      .eq('id', facture.id);
    
    if (error) throw error;
    
    // Aggiorna localmente
    facture.statut = nouveauStatut;
    
    // Ricarica i dati per aggiornare le statistiche
    loadData();
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    alert('Erreur: ' + error.message);
  }
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return date.toDate ? date.toDate().toLocaleDateString('fr-FR') : new Date(date).toLocaleDateString('fr-FR');
};

const generateNumeroFacture = async () => {
  try {
    const { data: config } = await supabase
      .from('configurazione_fatture')
      .select('*')
      .single();
    
    const ultimoNumero = config?.ultimo_numero || 0;
    const anno = config?.anno || new Date().getFullYear();
    const prefisso = config?.prefisso || 'F';
    
    const fattureAnno = factures.value.filter(f => {
      const dataFattura = new Date(f.date_facture || f.dateFacture);
      return dataFattura.getFullYear() === anno;
    }).length;
    
    const prossimoNumero = ultimoNumero + fattureAnno + 1;
    return `${prefisso}${anno}-${String(prossimoNumero).padStart(3, '0')}`;
  } catch (error) {
    return `F${new Date().getFullYear()}-${String(factures.value.length + 1).padStart(3, '0')}`;
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF'
  }).format(amount);
};

const calculateSoldeFinale = (facture) => {
  const montantHT = Number(facture.montant_ht || 0);
  const acconti = Number(facture.acconti_precedenti || 0);
  const montantNetHT = montantHT - acconti;
  const tva = montantNetHT * 0.081;
  return montantNetHT + tva;
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
      const totalHT = Number(facture.montant_ht || facture.montantHT || 0);
      const tva = totalHT * 0.081; // TVA Suisse 8.1%
      const ttc = totalHT + tva;
      
      doc.text(`Total HT: ${totalHT.toFixed(2)} CHF`, 140, finalY);
      doc.text(`TVA (8.1%): ${tva.toFixed(2)} CHF`, 140, finalY + 7);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL TTC: ${ttc.toFixed(2)} CHF`, 140, finalY + 17);
      
      doc.save(`Facture_${facture.numero}.pdf`);
      alert('Facture générée avec succès!');
      return;
    }

    // Determina il tipo di fattura
    const chantierId = facture.chantier_id || facture.chantierId;
    const metrageId = facture.metrage_id || facture.metrageId;
    const resocontoId = facture.resoconto_id || facture.resocontoId;
    const chantier = chantiers.value.find(c => c.id === chantierId);
    console.log('🔍 PDF - Chantier devis_id:', chantier?.devis_id, typeof chantier?.devis_id);
    console.log('🔍 PDF - Tutti i devis IDs:', devis.value.map(d => ({id: d.id, type: typeof d.id})));
    const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id); // Usa == invece di ===
    
    // Fattura da métrage détaillé
    const metrageDoc = metrageId ? metrages.value.find(m => m.id === metrageId) : null;
    
    // Fattura da resoconto percentuale
    const resocontoDoc = resocontoId ? resocontiPercentuali.value.find(r => r.id === resocontoId) : null;
    
    const nomeCliente = facture.client_nom || chantier?.client || 'Client';
    const numeroChantier = chantier?.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '';
    const nomeChantier = chantier?.nom || 'N/A';
    
    // Periodo di riferimento
    let periodoRef = '';
    if (metrageDoc) {
      // Fattura da métrage
      if (metrageDoc.periode_debut && metrageDoc.periode_fin) {
        periodoRef = `Période: ${metrageDoc.periode_debut} - ${metrageDoc.periode_fin}`;
      } else if (metrageDoc.created_at) {
        const date = new Date(metrageDoc.created_at);
        const mese = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        periodoRef = `Période: ${mese}`;
      }
    } else if (resocontoDoc) {
      // Fattura da resoconto percentuale
      if (resocontoDoc.periode_month) {
        const [year, month] = resocontoDoc.periode_month.split('-');
        const date = new Date(year, month - 1);
        const mese = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        periodoRef = `Période: ${mese}`;
      }
    }

    // Funzione helper per header
    const drawHeader = (doc, title) => {
      if (logo) doc.addImage(logo, 'JPEG', 10, 10, 55, 10);
      
      // Dati azienda
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('DALLELEC Sarl - CHE-280.028.822', 200, 12, { align: 'right' });
      doc.text('Rue de Bourgogne 25', 200, 17, { align: 'right' });
      doc.text('1203 Genève', 200, 22, { align: 'right' });
      
      // Titolo
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 10, 35);
      
      // Linea separatrice
      doc.setLineWidth(0.5);
      doc.line(10, 40, 200, 40);
      
      // Informazioni documento - layout ottimizzato
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      let yInfo = 46;
      
      // Prima colonna (sinistra)
      doc.text(`Date: ${formatDate(facture.date_facture)}`, 10, yInfo);
      if (periodoRef) {
        yInfo += 5;
        doc.text(periodoRef, 10, yInfo);
      }
      
      yInfo += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURÉ À:', 10, yInfo);
      yInfo += 4;
      doc.setFont('helvetica', 'normal');
      
      // Trova i dati completi del cliente
      const clientData = clients.value.find(c => c.nom === nomeCliente);
      doc.setFontSize(9);
      doc.text(nomeCliente, 10, yInfo);
      if (clientData?.adresse) {
        yInfo += 3.5;
        doc.setFontSize(8);
        doc.text(clientData.adresse, 10, yInfo);
      }
      if (clientData?.ville) {
        yInfo += 3.5;
        doc.text(clientData.ville, 10, yInfo);
      }
      
      // Seconda colonna (destra) - Informazioni cantiere
      let yInfoRight = 48;
      doc.setFont('helvetica', 'bold');
      doc.text(`CHANTIER N° ${chantier?.numero_cantiere || 'N/A'}`, 110, yInfoRight);
      yInfoRight += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`${nomeChantier}`, 110, yInfoRight);
      
      // Aggiunge nome technicien sotto il numero cantiere
      if (chantier?.technicien) {
        yInfoRight += 5;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text(`Technicien: ${chantier.technicien}`, 110, yInfoRight);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
      }
      
      return Math.max(yInfo, yInfoRight) + 8; // Ritorna la posizione Y per il contenuto
    };

    // FATTURA DA RESOCONTO PERCENTUALE
    if (resocontoDoc) {
      // Imposta detailResoconto per far funzionare calculateZoneMontant
      detailResoconto.value = resocontoDoc;
      
      // USA L'ACCONTO SALVATO NELLA FATTURA O QUELLO DEL MODAL
      const accontiModalValue = Number(facture.acconti_precedenti || accontiPrecedentiResoconto.value || 0);
      console.log('🔍 PDF - Acconti (salvati/modal):', facture.acconti_precedenti, '/', accontiPrecedentiResoconto.value, '= finale:', accontiModalValue);
      
      // DEBUG DEVIS NEL PDF
      console.log('🔍 PDF - Chantier:', chantier);
      console.log('🔍 PDF - ChantierDevis:', chantierDevis);
      console.log('🔍 PDF - Produits devis:', chantierDevis?.produits?.length || 0);
      if (chantierDevis?.produits) {
        console.log('🔍 PDF - Prime 3 prodotti:', chantierDevis.produits.slice(0, 3));
      }
      
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      let yPos = drawHeader(doc, `FACTURE N. ${facture.numero}`);
      
      // Descrizione lavori - ottimizzata
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('TRAVAUX RÉALISÉS', 10, yPos);
      yPos += 6;
      
      if (resocontoDoc.descrizione) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(resocontoDoc.descrizione, 10, yPos);
        yPos += 6;
      }
      
      // USA LE STESSE FUNZIONI DELL'ANTEPRIMA CHE FUNZIONANO
      const avancementData = Object.entries(resocontoDoc.avancementi || {}).map(([zona, percentuale]) => {
        // CALCOLA IL TOTALE ZONA CORRETTAMENTE (come nell'anteprima)
        let totaleZona = 0;
        if (chantierDevis?.produits) {
          totaleZona = chantierDevis.produits
            .filter(p => p.zone === zona)
            .reduce((sum, p) => sum + Number(p.total || 0), 0);
        }
        
        const montantZona = totaleZona * percentuale / 100;
        
        console.log(`📊 PDF - ${zona}: devis=${totaleZona.toFixed(2)} CHF × ${percentuale}% = fattura=${montantZona.toFixed(2)} CHF`);
        
        return [
          zona,
          `${percentuale}%`,
          totaleZona > 0 ? `${totaleZona.toFixed(2)} CHF` : 'N/A', // TOTALE DEVIS PER ZONA
          `${montantZona.toFixed(2)} CHF`  // MONTANT DA FATTURARE
        ];
      });
      
      if (avancementData.length > 0) {
        autoTable(doc, {
          head: [['Zone', 'Avancement', 'Montant Devis', 'Montant HT']],
          body: avancementData,
          startY: yPos,
          theme: 'striped',
          headStyles: { 
            fillColor: [70, 130, 180], 
            textColor: 255,
            fontSize: 10
          },
          bodyStyles: { 
            fontSize: 9
          }
        });
        yPos = doc.lastAutoTable.finalY + 3;
        
        // Sous-total travaux (usa calculateTotalTravaux)
        const totalTravauxHT = calculateTotalTravaux();
        doc.setFillColor(250, 250, 250);
        doc.rect(120, yPos - 2, 80, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Sous-total Travaux: ${totalTravauxHT.toFixed(2)} CHF`, 125, yPos + 2);
        doc.setFont('helvetica', 'normal');
        yPos += 10;
      }
      
      // Régies se presenti
      let totalRegiesHT = 0;
      if (resocontoDoc.regies?.length > 0) {
        // Verifica spazio per sezione régies
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RÉGIES', 10, yPos);
        yPos += 5;
        
        const prixRegieChantier = getPrixRegieChantier();
        const regieData = resocontoDoc.regies.map(regie => [
          regie.zone || '',
          regie.description || '',
          `${regie.heures}h`,
          `${(regie.prixHeure || prixRegieChantier).toFixed(2)} CHF`,
          `${(regie.heures * (regie.prixHeure || prixRegieChantier)).toFixed(2)} CHF`
        ]);
        
        autoTable(doc, {
          head: [['Zone', 'Description', 'Heures', 'Prix/h', 'Total']],
          body: regieData,
          startY: yPos,
          theme: 'grid',
          headStyles: { fillColor: [70, 130, 180], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8, fillColor: [240, 248, 255] }
        });
        
        yPos = doc.lastAutoTable.finalY + 3;
        
        // Sous-total régies (usa calculateTotalRegies)
        totalRegiesHT = calculateTotalRegies();
        doc.setFillColor(250, 250, 250);
        doc.rect(120, yPos - 2, 80, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Sous-total Régies: ${totalRegiesHT.toFixed(2)} CHF`, 125, yPos + 2);
        doc.setFont('helvetica', 'normal');
        yPos += 10;
      }
      
      // Sezione Acconti se presenti
      if (accontiModalValue > 0) {
        // Verifica spazio per sezione acconti
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ACOMPTES PRÉCÉDENTS', 10, yPos);
        yPos += 5;
        
        autoTable(doc, {
          head: [['Description', 'Montant HT']],
          body: [[
            'Acomptes déjà facturés',
            `-${accontiModalValue.toFixed(2)} CHF`
          ]],
          startY: yPos,
          theme: 'grid',
          headStyles: { fillColor: [70, 130, 180], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9, fillColor: [255, 240, 240] }
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
      }
      
      // TOTALI FINALI - USA LE STESSE FUNZIONI DELL'ANTEPRIMA
      const totalHT = calculateTotalHT();
      const tvaRate = 8.1;
      
      // Box per i totali (dimensione ottimale)
      const boxHeight = accontiModalValue > 0 ? 42 : 26;
      doc.setFillColor(245, 245, 245);
      doc.rect(120, yPos - 3, 80, boxHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(120, yPos - 3, 80, boxHeight);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      let currentY = yPos + 3;
      doc.text('Total HT:', 125, currentY);
      doc.text(`${totalHT.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
      currentY += 6;
      
      // Acconti se presenti - LOGICA CORRETTA
      if (accontiModalValue > 0) {
        doc.setTextColor(200, 0, 0);
        doc.text('Acomptes HT:', 125, currentY);
        doc.text(`-${accontiModalValue.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        currentY += 6;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Montant net HT:', 125, currentY);
        doc.text(`${(totalHT - accontiModalValue).toFixed(2)} CHF`, 190, currentY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        currentY += 6;
        
        const tvaResiduo = (totalHT - accontiModalValue) * (tvaRate / 100);
        doc.text(`TVA (${tvaRate}%):`, 125, currentY);
        doc.text(`${tvaResiduo.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
        currentY += 8;
        
        // Linea separatrice
        doc.setLineWidth(0.5);
        doc.line(125, currentY - 2, 195, currentY - 2);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SOLDE À PAYER:', 125, currentY + 4);
        doc.text(`${((totalHT - accontiModalValue) + tvaResiduo).toFixed(2)} CHF`, 190, currentY + 4, { align: 'right' });
      } else {
        const tva = totalHT * (tvaRate / 100);
        doc.text(`TVA (${tvaRate}%):`, 125, currentY);
        doc.text(`${tva.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
        currentY += 8;
        
        // Linea separatrice
        doc.setLineWidth(0.5);
        doc.line(125, currentY - 2, 195, currentY - 2);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL TTC:', 125, currentY + 4);
        doc.text(`${(totalHT + tva).toFixed(2)} CHF`, 190, currentY + 4, { align: 'right' });
      }
      
      // Verifica spazio per footer
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Conditions de paiement
      yPos += 35;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Conditions de paiement: 30 jours net', 10, yPos);
      doc.text('Merci de votre confiance', 10, yPos + 6);
      
      // Numerazione pagine
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} sur ${totalPages}`, 190, 290, { align: 'right' });
      }
      
      doc.save(`Facture_Percentuelle_${facture.numero}.pdf`);
      alert('Facture percentuelle générée avec succès!');
      return;
    }

    // FATTURA DA MÉTRAGE DÉTAILLÉ
    if (!metrageDoc) {
      alert('Erreur: Données métrage non trouvées pour cette facture');
      return;
    }
    
    // 1. PDF MÉTRÉES (sans prix)
    const docMetrees = new jsPDF({ unit: 'mm', format: 'a4' });
    let yPos = drawHeader(docMetrees, `MÉTRÉES DÉTAILLÉES - ${facture.numero}`);
    
    if (metrageDoc?.items) {
      const itemsByZone = {};
      metrageDoc.items.forEach(item => {
        if (!itemsByZone[item.zone]) itemsByZone[item.zone] = [];
        itemsByZone[item.zone].push(item);
      });
      
      Object.entries(itemsByZone).forEach(([zoneName, items]) => {
        // Verifica spazio disponibile
        if (yPos > 250) {
          docMetrees.addPage();
          yPos = 20;
        }
        
        docMetrees.setFontSize(11);
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.setFillColor(240, 240, 240);
        docMetrees.rect(10, yPos - 3, 190, 8, 'F');
        docMetrees.text(`Zone: ${zoneName}`, 12, yPos + 2);
        
        const tableData = items.map(item => {
          const quantite = Number(item.mlPosee || 0);
          let totalSuppl = 0;
          
          if (item.supplements && Array.isArray(item.supplements)) {
            totalSuppl = item.supplements.reduce((sum, supp) => {
              const qte = Number(supp.qte || supp.qtePosee || 0);
              const valeur = Number(supp.valeur || 0);
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
          startY: yPos + 8,
          theme: 'striped',
          headStyles: { 
            fillColor: [70, 130, 180], 
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: { 
            fontSize: 8,
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 50 },
            2: { cellWidth: 20 },
            3: { cellWidth: 15 },
            4: { cellWidth: 20 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 }
          },
          margin: { left: 10, right: 10 }
        });
        
        yPos = docMetrees.lastAutoTable.finalY + 10;
      });
      
      // Détail des suppléments par zone
      yPos += 10;
      docMetrees.setFontSize(14);
      docMetrees.setFont('helvetica', 'bold');
      docMetrees.text('DÉTAIL DES SUPPLÉMENTS PAR ZONE', 10, yPos);
      yPos += 10;
      
      Object.entries(itemsByZone).forEach(([zoneName, items]) => {
        // Verifica spazio disponibile
        if (yPos > 250) {
          docMetrees.addPage();
          yPos = 20;
        }
        
        docMetrees.setFontSize(11);
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.setFillColor(240, 240, 240);
        docMetrees.rect(10, yPos - 3, 190, 8, 'F');
        docMetrees.text(`Zone: ${zoneName}`, 12, yPos + 2);
        yPos += 8;
        
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
        
        if (Object.keys(suppByProduct).length > 0) {
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
              theme: 'striped',
              headStyles: {
                fillColor: [70, 130, 180],
                textColor: 255,
                fontSize: 8
              },
              bodyStyles: {
                fontSize: 8,
                cellPadding: 2
              },
              columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 40 },
                2: { cellWidth: 15 },
                3: { cellWidth: 40 },
                4: { cellWidth: 15 },
                5: { cellWidth: 20 },
                6: { cellWidth: 20 }
              },
              margin: { left: 10, right: 10 }
            });
            
            yPos = docMetrees.lastAutoTable.finalY + 5;
          });
        } else {
          docMetrees.setFontSize(9);
          docMetrees.setFont('helvetica', 'italic');
          docMetrees.text('Aucun supplément pour cette zone', 15, yPos + 5);
          yPos += 10;
        }
        
        yPos += 10;
      });
    }
    
    // 2. PDF FACTURE (avec prix)
    const docFacture = new jsPDF({ unit: 'mm', format: 'a4' });
    yPos = drawHeader(docFacture, `FACTURE N. ${facture.numero}`);
    let totalFactureHT = 0;
    
    if (metrageDoc?.items) {
      const itemsByZone = {};
      metrageDoc.items.forEach(item => {
        if (!itemsByZone[item.zone]) itemsByZone[item.zone] = [];
        itemsByZone[item.zone].push(item);
      });
      
      Object.entries(itemsByZone).forEach(([zoneName, items]) => {
        // Verifica spazio disponibile
        if (yPos > 220) {
          docFacture.addPage();
          yPos = 20;
        }
        
        docFacture.setFontSize(11);
        docFacture.setFont('helvetica', 'bold');
        docFacture.setFillColor(240, 240, 240);
        docFacture.rect(10, yPos - 3, 190, 8, 'F');
        docFacture.text(`Zone: ${zoneName}`, 12, yPos + 2);
        
        let zoneTotal = 0;
        const tableData = items.map(item => {
          const prodottoDevis = chantierDevis?.produits?.find(p => p.article === item.article);
          const prezzoUnit = Number(prodottoDevis?.prix || 50);
          const quantite = Number(item.mlPosee || 0);
          
          let totalSuppl = 0;
          if (item.supplements && Array.isArray(item.supplements)) {
            totalSuppl = item.supplements.reduce((sum, supp) => {
              const qte = Number(supp.qte || supp.qtePosee || 0);
              const valeur = Number(supp.valeur || 0);
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
            `${prezzoUnit.toFixed(2)}`,
            `${totalItem.toFixed(2)}`
          ];
        });
        
        autoTable(docFacture, {
          head: [['Code', 'Produit', 'Taille', 'U', 'Qté', 'Suppl.', 'Total', 'Prix/U', 'Total CHF']],
          body: tableData,
          startY: yPos + 8,
          theme: 'striped',
          headStyles: { 
            fillColor: [70, 130, 180], 
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: { 
            fontSize: 8,
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 40 },
            2: { cellWidth: 15 },
            3: { cellWidth: 10 },
            4: { cellWidth: 15 },
            5: { cellWidth: 18 },
            6: { cellWidth: 18 },
            7: { cellWidth: 20, halign: 'right' },
            8: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: 10, right: 10 }
        });
        
        yPos = docFacture.lastAutoTable.finalY + 5;
        
        // Sous-total zona con sfondo
        docFacture.setFillColor(250, 250, 250);
        docFacture.rect(130, yPos - 2, 70, 6, 'F');
        docFacture.setFont('helvetica', 'bold');
        docFacture.setFontSize(9);
        docFacture.text(`Sous-total: ${zoneTotal.toFixed(2)} CHF`, 135, yPos + 2);
        yPos += 12;
      });
    }
    
    // Régies se presenti
    if (metrageDoc.regies?.length > 0) {
      docFacture.setFontSize(12);
      docFacture.setFont('helvetica', 'bold');
      docFacture.text('RÉGIES', 10, yPos);
      
      const prixRegieChantier = chantier?.prix_regie || 75;
      const regieData = metrageDoc.regies.map(regie => {
        const heures = Number(regie.heures || 0);
        const prixHeure = Number(regie.prixHeure || prixRegieChantier);
        const total = heures * prixHeure;
        totalFactureHT += total;
        return [
          regie.zone || '',
          regie.description || '',
          `${heures}h`,
          `${prixHeure.toFixed(2)} CHF`,
          `${total.toFixed(2)} CHF`
        ];
      });
      
      autoTable(docFacture, {
        head: [['Zone', 'Description', 'Heures', 'Prix/h', 'Total']],
        body: regieData,
        startY: yPos + 5,
        theme: 'grid',
        headStyles: { fillColor: [70, 130, 180], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8, fillColor: [240, 248, 255] }
      });
      
      yPos = docFacture.lastAutoTable.finalY + 10;
    }
    
    // Totali finali con box
    const realMontantHT = Number(facture.montant_ht || totalFactureHT);
    const realTauxTVA = Number(facture.taux_tva || 8.1);
    const realMontantTVA = realMontantHT * (realTauxTVA / 100);
    const montantBrutTTC = realMontantHT + realMontantTVA;
    
    // Sottrai acconti dall'imponibile HT PRIMA del calcolo TVA
    const accontiHT = resocontoDoc ? Number(accontiPrecedentiResoconto.value || 0) : Number(accontiPrecedenti.value || 0);
    const imponibileResiduoHT = realMontantHT - accontiHT;
    const tvaResiduoHT = imponibileResiduoHT * (realTauxTVA / 100);
    const realMontantTTC = imponibileResiduoHT + tvaResiduoHT;
    
    console.log('Debug fattura PDF:', {
      montantHT: realMontantHT,
      tauxTVA: realTauxTVA,
      montantTVA: realMontantTVA,
      montantTTC: realMontantTTC,
      accontiHT: accontiHT,
      factureOriginal: facture
    });
    
    yPos += 10;
    
    // Box per i totali (più alto per includere acconti)
    const boxHeight = accontiHT > 0 ? 45 : 25;
    docFacture.setFillColor(245, 245, 245);
    docFacture.rect(120, yPos - 5, 80, boxHeight, 'F');
    docFacture.setDrawColor(200, 200, 200);
    docFacture.rect(120, yPos - 5, 80, boxHeight);
    
    docFacture.setFontSize(10);
    docFacture.setFont('helvetica', 'normal');
    // Se non ci sono acconti, mostra il calcolo normale
    if (accontiHT === 0) {
      docFacture.text('Total HT:', 125, yPos + 2);
      docFacture.text(`${realMontantHT.toFixed(2)} CHF`, 190, yPos + 2, { align: 'right' });
      
      docFacture.text(`TVA (${realTauxTVA}%):`, 125, yPos + 8);
      docFacture.text(`${realMontantTVA.toFixed(2)} CHF`, 190, yPos + 8, { align: 'right' });
      
      currentY = yPos + 14;
    }
    
    let currentY = yPos + 14;
    
    // Se ci sono acconti precedenti, mostrali
    if (accontiHT > 0) {
      docFacture.text('Total HT:', 125, currentY);
      docFacture.text(`${realMontantHT.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
      currentY += 6;
      
      docFacture.setTextColor(200, 0, 0); // Rosso per sottrazione
      docFacture.text('Acconti HT:', 125, currentY);
      docFacture.text(`-${accontiHT.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
      docFacture.setTextColor(0, 0, 0); // Torna nero
      currentY += 6;
      
      docFacture.setFont('helvetica', 'bold');
      docFacture.text('Imponibile residuo:', 125, currentY);
      docFacture.text(`${imponibileResiduoHT.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
      docFacture.setFont('helvetica', 'normal');
      currentY += 6;
      
      docFacture.text(`TVA (${realTauxTVA}%):`, 125, currentY);
      docFacture.text(`${tvaResiduoHT.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
      currentY += 6;
    }
    
    // Linea separatrice
    docFacture.setLineWidth(0.5);
    docFacture.line(125, currentY - 2, 195, currentY - 2);
    
    docFacture.setFont('helvetica', 'bold');
    docFacture.setFontSize(12);
    const labelFinal = accontiHT > 0 ? 'SOLDE À PAYER:' : 'TOTAL TTC:';
    docFacture.text(labelFinal, 125, currentY + 4);
    docFacture.text(`${realMontantTTC.toFixed(2)} CHF`, 190, currentY + 4, { align: 'right' });
    
    // Conditions de paiement
    yPos += 35;
    docFacture.setFont('helvetica', 'normal');
    docFacture.setFontSize(9);
    docFacture.setTextColor(100, 100, 100);
    docFacture.text('Conditions de paiement: 30 jours net', 10, yPos);
    if (periodoRef) {
      docFacture.text(`Facture établie sur la base des métrées ${periodoRef.toLowerCase()}`, 10, yPos + 6);
    }
    
    // Footer
    docFacture.setFontSize(8);
    docFacture.setTextColor(150, 150, 150);
    docFacture.text('DALLELEC Sarl - CHE-123.456.789 TVA - Rue de Bourgogne 25, 1203 Genève', 105, 280, { align: 'center' });
    
    // Salva documenti
    docMetrees.save(`Metrees_Detaillees_${facture.numero}.pdf`);
    docFacture.save(`Facture_${facture.numero}.pdf`);
    
    alert('Deux documents générés:\n1. Métrées détaillées (pour technicien)\n2. Facture (pour comptabilité)');
    
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    alert('Erreur génération PDF: ' + error.message);
  }
};


const getTechnicienName = (chantierId) => {
  const chantier = chantiers.value.find(c => c.id == chantierId);
  return chantier?.technicien || 'N/A';
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

.form-select-sm {
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
  min-width: 100px;
}

.text-secondary {
  color: #6c757d !important;
}

.text-info {
  color: #0dcaf0 !important;
}

.text-success {
  color: #198754 !important;
}

.text-danger {
  color: #dc3545 !important;
}

.form-select-sm:focus {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
</style>
