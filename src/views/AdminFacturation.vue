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
          <router-link to="/admin/facture-manuelle" class="btn btn-sm btn-success">
            📝 Facture Manuelle
          </router-link>
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
        <div class="row align-items-center">
          <div class="col-md-4">
            <h5>Factures récentes</h5>
          </div>
          <div class="col-md-8">
            <div class="row">
              <div class="col-md-4">
                <select v-model="filtreClient" class="form-select form-select-sm">
                  <option value="">Tous les clients</option>
                  <option v-for="client in clientsUniques" :key="client" :value="client">{{ client }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <select v-model="filtreStatut" class="form-select form-select-sm">
                  <option value="">Tous les statuts</option>
                  <option value="emise">Émise</option>
                  <option value="envoyee">Envoyée</option>
                  <option value="payee">Payée</option>
                  <option value="en_retard">En retard</option>
                </select>
              </div>
              <div class="col-md-4">
                <button @click="resetFiltres" class="btn btn-outline-secondary btn-sm">
                  🔄 Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div v-if="facturesFiltrees.length === 0" class="text-center text-muted py-4">
          {{ factures.length === 0 ? 'Aucune facture récente' : 'Aucune facture correspondant aux filtres' }}
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
              <tr v-for="facture in facturesFiltrees" :key="facture.id">
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
                    v-model="facture.statut" 
                    @change="updateStatut(facture)"
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
                  <button @click="voirAnteprimaFacture(facture)" class="btn btn-sm btn-success me-1" title="Anteprima rapida">
                    👁️
                  </button>
                  <button @click="modifierFacture(facture)" class="btn btn-sm btn-primary me-1">
                    ✏️
                  </button>
                  <button @click="genererPDF(facture)" class="btn btn-sm btn-info me-1">
                    📄 PDF
                  </button>
                  <button v-if="facture.resoconto_id" @click="riaprireResoconto(facture)" class="btn btn-sm btn-warning me-1" title="Riapri per correzione">
                    🔄
                  </button>
                  <button v-if="(facture.montant_ttc || facture.montantTTC || 0) === 0" @click="corrigerFacture(facture)" class="btn btn-sm btn-warning me-1" title="Corriger montant">
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
    <div class="row justify-content-center">
      <div class="col-md-9">
        <div class="row">
          <div class="col">
            <div class="card bg-warning text-white text-center">
              <div class="card-body py-2">
                <h6 class="mb-1">En Attente</h6>
                <h5 class="mb-1">{{ metragesEnAttente.length }}</h5>
                <small>Métrages</small>
              </div>
            </div>
          </div>
          <div class="col">
            <div class="card bg-info text-white text-center">
              <div class="card-body py-2">
                <h6 class="mb-1">Ce Mois</h6>
                <h6 class="mb-1">{{ formatCurrency(facturationMois) }}</h6>
                <small>Facturé</small>
              </div>
            </div>
          </div>
          <div class="col">
            <div class="card bg-primary text-white text-center">
              <div class="card-body py-2">
                <h6 class="mb-1">Cette Année</h6>
                <h6 class="mb-1">{{ formatCurrency(facturationAnnee) }}</h6>
                <small>Total</small>
              </div>
            </div>
          </div>
          <div class="col">
            <div class="card bg-success text-white text-center">
              <div class="card-body py-2">
                <h6 class="mb-1">Payées</h6>
                <h6 class="mb-1">{{ formatCurrency(facturesPayees) }}</h6>
                <small>Encaissé</small>
              </div>
            </div>
          </div>
          <div class="col">
            <div class="card bg-danger text-white text-center">
              <div class="card-body py-2">
                <h6 class="mb-1">Impayées</h6>
                <h6 class="mb-1">{{ formatCurrency(facturesImpayes) }}</h6>
                <small>À encaisser</small>
              </div>
            </div>
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
                        <!-- RESOCONTO FINALE: Mostra calcolo dettagliato -->
                        <div v-if="detailResoconto.type === 'resoconto_finale'">
                          <table class="table table-sm table-bordered">
                            <thead class="table-info">
                              <tr>
                                <th colspan="3" class="text-center">
                                  <strong>📊 RESOCONTO FINALE - CALCOLO AUTOMATICO</strong>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(percentage, zone) in detailResoconto.avancementi" :key="zone">
                                <td colspan="3">
                                  <div class="mb-2"><strong>Zone: {{ zone }}</strong></div>
                                  <div class="row">
                                    <div class="col-md-6">
                                      <small class="text-muted">1. Valeur réelle des quantités posées:</small><br>
                                      <strong class="text-success">{{ getValoreRealeZona(zone).toFixed(2) }} CHF</strong>
                                    </div>
                                    <div class="col-md-6">
                                      <label class="form-label small"><strong>Acompte déjà versé (CHF HT):</strong></label>
                                      <input 
                                        v-model.number="accontiPerZona[zone]" 
                                        type="number" 
                                        step="0.01" 
                                        class="form-control form-control-sm" 
                                        placeholder="0.00"
                                        @input="updateTotalAcconti"
                                      >
                                    </div>
                                  </div>
                                  <div class="row mt-2" v-if="accontiPerZona[zone] > 0">
                                    <div class="col-md-12">
                                      <small class="text-muted">2. Acompte à soustraire:</small><br>
                                      <strong class="text-danger">-{{ Number(accontiPerZona[zone] || 0).toFixed(2) }} CHF</strong>
                                    </div>
                                  </div>
                                  <hr>
                                  <div class="row">
                                    <div class="col-md-12">
                                      <strong>3. À FACTURER:</strong><br>
                                      <h5 class="text-primary">{{ (getValoreRealeZona(zone) - Number(accontiPerZona[zone] || 0)).toFixed(2) }} CHF</h5>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <!-- RESOCONTO PERCENTUALE: Layout con dettaglio sconto -->
                        <table v-else class="table table-sm table-bordered">
                          <thead class="table-secondary">
                            <tr>
                              <th>Zone</th>
                              <th>Avancement</th>
                              <th>Montant Devis</th>
                              <th>Remise</th>
                              <th>Montant HT</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(percentage, zone) in detailResoconto.avancementi" :key="zone">
                              <td><strong>{{ zone }}</strong></td>
                              <td>{{ percentage }}%</td>
                              <td>{{ calculateZoneMontantSenzaRemise(zone, percentage).toFixed(2) }} CHF</td>
                              <td class="text-danger">{{ getRemiseDevis() }}%</td>
                              <td><strong>{{ calculateZoneMontant(zone, percentage).toFixed(2) }} CHF</strong></td>
                            </tr>
                          </tbody>
                          <tfoot class="table-warning">
                            <tr>
                              <td colspan="4"><strong>Sous-total Travaux:</strong></td>
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
                            <div class="d-flex justify-content-between mb-2">
                              <span>TVA (8.1%):</span>
                              <strong>{{ calculateTVA().toFixed(2) }} CHF</strong>
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between">
                              <span class="h6">TOTAL TTC:</span>
                              <strong class="h5 text-success">{{ calculateTotalTTC().toFixed(2) }} CHF</strong>
                            </div>
                          </div>
                        </div>
                        
                        <div class="mt-3 text-center">
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
                <p><strong>Montant Estimé:</strong> {{ formatCurrency(calculateMontantEstimeDettagliato()) }}</p>
              </div>
            </div>
            <div class="mt-3">
              <div class="mb-3">
                <h6>Détail des items:</h6>
                <div v-if="detailMetrage.items && detailMetrage.items.length > 0">
                  <table class="table table-sm table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th>Article</th>
                        <th>Zone</th>
                        <th>ML Posé</th>
                        <th>Total ML</th>
                        <th>Prix/ML</th>
                        <th>Total CHF</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in detailMetrage.items" :key="item.article">
                        <td>
                          <strong>{{ item.article }}</strong><br>
                          <small>{{ item.nom }} - {{ item.taille }}</small>
                        </td>
                        <td>{{ item.zone }}</td>
                        <td>{{ item.mlPosee }}</td>
                        <td>{{ calculateTotalMLItem(item) }}</td>
                        <td>{{ getPrixUnitaireItem(item).toFixed(2) }} CHF</td>
                        <td><strong>{{ calculateTotalItemCHF(item).toFixed(2) }} CHF</strong></td>
                      </tr>
                    </tbody>
                    <tfoot class="table-warning">
                      <tr>
                        <td colspan="5"><strong>Sous-total Produits:</strong></td>
                        <td><strong>{{ calculateTotalProduitsCHF().toFixed(2) }} CHF</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                  
                  <!-- Détail suppléments -->
                  <div class="mt-3">
                    <h6>Détail suppléments:</h6>
                    <div v-for="item in detailMetrage.items" :key="'supp-' + item.article">
                      <div v-if="item.supplements && item.supplements.length > 0" class="mb-2">
                        <strong>{{ item.article }}:</strong>
                        <span v-for="supp in item.supplements" :key="supp.supplement" class="badge bg-secondary me-1">
                          {{ supp.supplement }} ({{ supp.qtePosee }})
                        </span>
                      </div>
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
              <label>Modalité de paiement:</label>
              <select v-model="nouvelleModalitePaiement" class="form-control">
                <option value="">Sélectionner...</option>
                <option v-for="paiement in paiements" :key="paiement.id" :value="paiement.nom">
                  {{ paiement.nom }}
                </option>
              </select>
              <small class="text-info">Debug: {{ paiements.length }} modalités chargées</small>
              <small class="text-muted">La date d'échéance sera recalculée automatiquement</small>
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

    <!-- Modal Anteprima Facture -->
    <div v-if="showAnteprimaFacture" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5>📄 Aperçu Facture {{ factureAnteprima.numero }}</h5>
            <button @click="showAnteprimaFacture = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Informations Générales</h6>
                <p><strong>N° Facture:</strong> {{ factureAnteprima.numero }}</p>
                <p><strong>Date:</strong> {{ formatDate(factureAnteprima.date_facture) }}</p>
                <p><strong>Échéance:</strong> {{ formatDate(factureAnteprima.date_echeance) }}</p>
                <p><strong>Chantier:</strong> {{ getChantierNameWithNumber(factureAnteprima.chantier_id) }}</p>
                <p><strong>Client:</strong> {{ factureAnteprima.client_nom }}</p>
                <p><strong>Statut:</strong> <span :class="getStatutClass(factureAnteprima.statut)">{{ getStatutLabel(factureAnteprima.statut) }}</span></p>
              </div>
              <div class="col-md-6">
                <h6>Montants</h6>
                <p><strong>Total HT:</strong> {{ formatCurrency(factureAnteprima.montant_ht || 0) }}</p>
                <p v-if="(factureAnteprima.acconti_precedenti || 0) > 0" class="text-danger">
                  <strong>Acomptes HT:</strong> -{{ formatCurrency(factureAnteprima.acconti_precedenti) }}
                </p>
                <p><strong>TVA ({{ factureAnteprima.taux_tva || 8.1 }}%):</strong> {{ formatCurrency(calculateTVAFacture(factureAnteprima)) }}</p>
                <hr>
                <p class="h5"><strong>{{ (factureAnteprima.acconti_precedenti || 0) > 0 ? 'Solde à payer:' : 'Total TTC:' }}</strong> 
                  <span class="text-success">{{ formatCurrency(calculateTotalFacture(factureAnteprima)) }}</span>
                </p>
              </div>
            </div>
            
            <!-- CONTENU DÉTAILLÉ FACTURE -->
            <div class="mt-4">
              <h6>📋 Contenu Facture</h6>
              
              <!-- Fattura da Resoconto Percentuale -->
              <div v-if="factureAnteprima.resoconto_id" class="card bg-light">
                <div class="card-header bg-info text-white">
                  <strong>📊 Fattura Percentuale</strong>
                </div>
                <div class="card-body">
                  <div v-if="getResocontoDetails(factureAnteprima.resoconto_id)">
                    <p><strong>Periodo:</strong> {{ getResocontoDetails(factureAnteprima.resoconto_id).periode_month }}</p>
                    <div class="row">
                      <div class="col-md-8">
                        <h6>Zones travaillées:</h6>
                        <table class="table table-sm table-bordered">
                          <thead>
                            <tr><th>Zone</th><th>Avancement</th><th>Montant Devis</th><th>Remise</th><th>Montant HT</th></tr>
                          </thead>
                          <tbody>
                            <tr v-for="(percentage, zone) in getResocontoDetails(factureAnteprima.resoconto_id).avancementi" :key="zone">
                              <td>{{ zone }}</td>
                              <td>{{ percentage }}%</td>
                              <td>{{ formatCurrency(calculateZoneMontantSenzaRemiseAnteprima(zone, percentage, factureAnteprima.chantier_id)) }}</td>
                              <td class="text-danger">{{ getRemiseDevisAnteprima(factureAnteprima.chantier_id) }}%</td>
                              <td><strong>{{ formatCurrency(calculateZoneMontantAnteprima(zone, percentage, factureAnteprima.chantier_id)) }}</strong></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div class="col-md-4" v-if="getResocontoDetails(factureAnteprima.resoconto_id).regies?.length > 0">
                        <h6>Régies:</h6>
                        <div v-for="regie in getResocontoDetails(factureAnteprima.resoconto_id).regies" :key="regie.zone + regie.description" class="mb-2">
                          <small><strong>{{ regie.zone }}:</strong> {{ regie.heures }}h × {{ regie.prixHeure || 75 }} CHF = {{ formatCurrency(regie.heures * (regie.prixHeure || 75)) }}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Fattura da Métrage -->
              <div v-else-if="factureAnteprima.metrage_id" class="card bg-light">
                <div class="card-header bg-secondary text-white">
                  <strong>📏 Fattura Métrage</strong>
                </div>
                <div class="card-body">
                  <div v-if="getMetrageDetails(factureAnteprima.metrage_id)">
                    <p><strong>Total ML:</strong> {{ (getMetrageDetails(factureAnteprima.metrage_id).total_ml || 0).toFixed(2) }} ML</p>
                    <p><strong>Zone:</strong> {{ getMetrageDetails(factureAnteprima.metrage_id).zones?.join(', ') || 'N/A' }}</p>
                    <div v-if="getMetrageDetails(factureAnteprima.metrage_id).regies?.length > 0">
                      <h6>Régies incluse:</h6>
                      <div v-for="regie in getMetrageDetails(factureAnteprima.metrage_id).regies" :key="regie.zone + regie.description" class="mb-1">
                        <small>{{ regie.zone }}: {{ regie.heures }}h - {{ regie.description }}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Fattura Manuale -->
              <div v-else-if="factureAnteprima.type === 'manuelle'" class="card bg-light">
                <div class="card-header bg-success text-white">
                  <strong>📝 Fattura Manuale</strong>
                </div>
                <div class="card-body">
                  <div v-if="factureAnteprima.lignes?.length > 0">
                    <table class="table table-sm">
                      <thead>
                        <tr><th>Descrizione</th><th>Qté</th><th>Prezzo</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        <tr v-for="ligne in factureAnteprima.lignes" :key="ligne.description">
                          <td>{{ ligne.description }}</td>
                          <td>{{ ligne.quantite }}</td>
                          <td>{{ formatCurrency(ligne.prixUnitaire) }}</td>
                          <td>{{ formatCurrency(ligne.quantite * ligne.prixUnitaire) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <!-- Fattura tipo sconosciuto -->
              <div v-else class="alert alert-warning">
                <strong>⚠️ Tipo fattura non riconosciuto</strong><br>
                Questa fattura potrebbe essere stata creata con una versione precedente del sistema.
              </div>
            </div>
            
            <div v-if="factureAnteprima.notes" class="mt-3">
              <h6>Notes</h6>
              <p class="text-muted">{{ factureAnteprima.notes }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="genererPDF(factureAnteprima)" class="btn btn-info me-2">
              📄 Générer PDF
            </button>
            <button @click="showAnteprimaFacture = false" class="btn btn-secondary">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Riapertura Resoconto -->
    <div v-if="showRiaperturaResoconto" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5>🔄 Rouvrir Rapport pour Correction</h5>
            <button @click="showRiaperturaResoconto = false" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <strong>⚠️ Attenzione:</strong><br>
              • La facture {{ factureRiapertura.numero }} sera supprimée<br>
              • Le rapport redeviendra modifiable pour le chef<br>
              • La nouvelle facture gardera le même numéro
            </div>
            <div class="mb-3">
              <label><strong>Motif de la correction:</strong></label>
              <textarea v-model="motivoCorrezione" class="form-control" rows="3" placeholder="Décrivez le problème trouvé par le client..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="confermaRiapertura" class="btn btn-warning">🔄 Rouvrir Rapport</button>
            <button @click="showRiaperturaResoconto = false" class="btn btn-secondary">Annulla</button>
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

    <!-- Modal Date Personnalisée -->
    <div v-if="showDatePersonnalisee" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5>📅 Choisir Date Facture</h5>
            <button @click="annullaDataPersonnalisee" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>ℹ️ Information:</strong><br>
              • La date par défaut est aujourd'hui<br>
              • Vous pouvez choisir une date antérieure (ex: 30.09)<br>
              • La date ne peut pas être antérieure à la dernière facture émise
            </div>
            <div class="mb-3">
              <label class="form-label"><strong>Date de la facture:</strong></label>
              <input 
                v-model="dateFacturePersonnalisee" 
                type="date" 
                class="form-control"
                :max="new Date().toISOString().split('T')[0]"
              >
              <small class="text-muted">La date d'échéance sera automatiquement calculée (+30 jours)</small>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="confermaDataPersonnalisee" class="btn btn-primary">✅ Confirmer</button>
            <button @click="annullaDataPersonnalisee" class="btn btn-secondary">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase.js';
import RetourButton from '@/components/RetourButton.vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const router = useRouter();
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
const accontiPerZona = ref({});
const showDetailResoconto = ref(false);
const detailResoconto = ref({});
const showChangeStatut = ref(false);
const showModifierFacture = ref(false);
const showAnteprimaFacture = ref(false);
const showRiaperturaResoconto = ref(false);
const factureEnCours = ref({});
const factureAnteprima = ref({});
const factureRiapertura = ref({});
const motivoCorrezione = ref('');
const nouveauStatut = ref('');
const notesStatut = ref('');
const nouvelleDate = ref('');
const nouvelleDateEcheance = ref('');
const nouvelleModalitePaiement = ref('');
const nouvellesNotes = ref('');
const filtreClient = ref('');
const filtreStatut = ref('');
const dateFacturePersonnalisee = ref('');
const showDatePersonnalisee = ref(false);

// Resoconti percentuali en attente d'approbation
const resocontiEnAttente = computed(() => {
  console.log('🔍 Tutti i resoconti:', resocontiPercentuali.value.length);
  console.log('🔍 Resoconti finali:', resocontiPercentuali.value.filter(r => r.type === 'resoconto_finale'));
  
  return resocontiPercentuali.value.filter(r => 
    !r.draft && // Resoconto sauvegardé (non brouillon)
    ((r.status === 'en_attente' || r.status === 'pending_approval' || !r.status) || // En attente, pending o senza status
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
    .sort((a, b) => new Date(b.date_facture || b.dateFacture) - new Date(a.date_facture || a.dateFacture))
    .slice(0, 50); // Mostra più fatture per i filtri
});

// Clients uniques pour filtro
const clientsUniques = computed(() => {
  const clients = new Set();
  factures.value.forEach(f => {
    if (f.client_nom || f.clientNom) {
      clients.add(f.client_nom || f.clientNom);
    }
  });
  return Array.from(clients).sort();
});

// Factures filtrées
const facturesFiltrees = computed(() => {
  let filtered = facturesRecentes.value;
  
  if (filtreClient.value) {
    filtered = filtered.filter(f => 
      (f.client_nom || f.clientNom) === filtreClient.value
    );
  }
  
  if (filtreStatut.value) {
    filtered = filtered.filter(f => f.statut === filtreStatut.value);
  }
  
  return filtered;
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
    .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const facturationAnnee = computed(() => {
  const thisYear = new Date().getFullYear();
  return factures.value
    .filter(f => {
      const factureDate = new Date(f.date_facture || f.dateFacture);
      return factureDate.getFullYear() === thisYear;
    })
    .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const facturesPayees = computed(() => {
  return factures.value
    .filter(f => f.statut === 'payee')
    .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const facturesImpayes = computed(() => {
  return factures.value
    .filter(f => f.statut === 'emise' || f.statut === 'envoyee' || f.statut === 'en_retard')
    .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const totalAccontiZone = computed(() => {
  return Object.values(accontiPerZona.value).reduce((sum, val) => sum + Number(val || 0), 0);
});

const updateTotalAcconti = () => {
  // Forza aggiornamento computed
};

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
    
    // Metodi di pagamento
    await loadPaiements();
    
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

// Funzioni per calcolo prezzi nel modal métrage
const getPrixUnitaireItem = (item) => {
  const chantier = chantiers.value.find(c => c.id === detailMetrage.value.chantier_id);
  const chantierDevis = devis.value.find(d => d.id === chantier?.devis_id);
  const prodottoDevis = chantierDevis?.produits?.find(p => p.article === item.article);
  return Number(prodottoDevis?.prix || 50);
};

const calculateTotalMLItem = (item) => {
  const quantite = Number(item.mlPosee || 0);
  let totalSuppl = 0;
  
  if (item.supplements && Array.isArray(item.supplements)) {
    totalSuppl = item.supplements.reduce((sum, supp) => {
      const qte = Number(supp.qte || supp.qtePosee || 0);
      const valeur = Number(supp.valeur || 0);
      return sum + (qte * valeur);
    }, 0);
  }
  
  return quantite + totalSuppl;
};

const calculateTotalItemCHF = (item) => {
  const totalML = calculateTotalMLItem(item);
  const prezzoUnit = getPrixUnitaireItem(item);
  return totalML * prezzoUnit;
};

const calculateTotalProduitsCHF = () => {
  if (!detailMetrage.value.items) return 0;
  return detailMetrage.value.items.reduce((sum, item) => sum + calculateTotalItemCHF(item), 0);
};

const calculateMontantEstimeDettagliato = () => {
  const totalProduits = calculateTotalProduitsCHF();
  const totalRegies = (detailMetrage.value.regies || []).reduce((sum, r) => sum + (r.heures * (r.prixHeure || 75)), 0);
  return totalProduits + totalRegies;
};

const autoriserFacturation = async (metrage) => {
  // Mostra dialog per scegliere la data
  showDatePersonnalisee.value = true;
  dateFacturePersonnalisee.value = new Date().toISOString().split('T')[0];
  
  // Aspetta la conferma dell'utente
  const confirmed = await new Promise((resolve) => {
    const originalConfirm = window.confirm;
    window.confirm = (message) => {
      showDatePersonnalisee.value = false;
      window.confirm = originalConfirm;
      return resolve(true);
    };
    
    // Simula dialog personalizzato
    setTimeout(() => {
      if (confirm('Approuver ce métrage et autoriser la facturation ?')) {
        resolve(true);
      } else {
        resolve(false);
      }
      showDatePersonnalisee.value = false;
    }, 100);
  });
  
  if (!confirmed) return;
  
  try {
    // Valida la data
    const dataScelta = dateFacturePersonnalisee.value;
    const ultimaDataFactura = await getUltimaDataFactura();
    
    if (ultimaDataFactura && new Date(dataScelta) < new Date(ultimaDataFactura)) {
      alert(`Erreur: La date ne peut pas être antérieure à la dernière facture (${formatDate(ultimaDataFactura)})`);
      return;
    }
    
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
    
    const numeroFacture = await generateNumeroFacture(dataScelta);
    
    // Calcola data scadenza usando metodo di pagamento
    const dataScadenza = calculateDateEcheance(dataScelta, '30 jours net');
    
    // Crée la facture con data personalizzata
    const { error } = await supabase
      .from('factures')
      .insert([{
        numero: numeroFacture,
        chantier_id: metrage.chantier_id,
        metrage_id: metrage.id,
        date_facture: dataScelta,
        montant_ht: montantHT,
        taux_tva: 8.1,
        montant_ttc: montantHT * 1.081,
        statut: 'emise',
        client_nom: chantier?.client || 'Client',
        date_echeance: dataScadenza,
        notes: `Facture générée depuis métrage du ${formatDate(metrage.created_at)}`,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    // Marque le métrage comme facturé
    await supabase
      .from('metrages')
      .update({
        facture: true,
        facture_numero: numeroFacture,
        facture_date: dataScelta
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
  accontiPrecedentiResoconto.value = 0;
  
  // Inizializza acconti per zona
  accontiPerZona.value = {};
  Object.keys(resoconto.avancementi || {}).forEach(zona => {
    // Carica acconti salvati o inizializza a 0
    accontiPerZona.value[zona] = resoconto.acconti_per_zona?.[zona] || 0;
  });
  
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
const calculateZoneMontantSenzaRemise = (zone, percentage) => {
  const chantier = chantiers.value.find(c => c.id == (detailResoconto.value.chantier_id || detailResoconto.value.chantierId));
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  
  if (!chantierDevis) return 0;
  
  if (chantierDevis.modalita_prezzi === 'aCorps') {
    const montantCorps = Number(chantierDevis.montant_corps || 0);
    const numeroZone = chantierDevis.zones?.length || 1;
    const montantPerZona = montantCorps / numeroZone;
    return montantPerZona * percentage / 100;
  }
  
  if (!chantierDevis.produits) return 0;
  
  const totaleZona = chantierDevis.produits
    .filter(p => p.zone === zone)
    .reduce((sum, p) => sum + Number(p.total || 0), 0);
  
  return totaleZona * percentage / 100;
};

const getRemiseDevis = () => {
  const chantier = chantiers.value.find(c => c.id == (detailResoconto.value.chantier_id || detailResoconto.value.chantierId));
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  return chantierDevis?.remises || 0;
};

const calculateZoneMontant = (zone, percentage) => {
  // Se è un resoconto finale, calcola il valore delle quantità reali
  if (detailResoconto.value.type === 'resoconto_finale') {
    return calculateResocontoFinaleValue(zone);
  }
  
  // Logica originale per resoconti percentuali
  const chantier = chantiers.value.find(c => c.id == (detailResoconto.value.chantier_id || detailResoconto.value.chantierId));
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  
  // DEBUG: Verifica remise supplémentaire
  console.log('🔍 DEBUG REMISE - Devis:', chantierDevis?.numero, 'Remise:', chantierDevis?.remises);
  
  if (!chantierDevis) return 0;
  
  if (chantierDevis.modalita_prezzi === 'aCorps') {
    const montantCorps = Number(chantierDevis.montant_corps || 0);
    const numeroZone = chantierDevis.zones?.length || 1;
    let montantPerZona = montantCorps / numeroZone;
    
    // Applica remise supplémentaire se presente
    if (chantierDevis.remises && chantierDevis.remises > 0) {
      montantPerZona = montantPerZona * (1 - chantierDevis.remises / 100);
    }
    
    return montantPerZona * percentage / 100;
  }
  
  if (!chantierDevis.produits) return 0;
  
  let totaleZona = chantierDevis.produits
    .filter(p => p.zone === zone)
    .reduce((sum, p) => sum + Number(p.total || 0), 0);
  
  // Applica remise supplémentaire se presente
  if (chantierDevis.remises && chantierDevis.remises > 0) {
    totaleZona = totaleZona * (1 - chantierDevis.remises / 100);
  }
  
  return totaleZona * percentage / 100;
};

const getValoreRealeZona = (zone) => {
  const chantier = chantiers.value.find(c => c.id == (detailResoconto.value.chantier_id || detailResoconto.value.chantierId));
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  
  if (!chantierDevis?.produits || !detailResoconto.value.prodotti_reali) return 0;
  
  return detailResoconto.value.prodotti_reali
    .filter(prodottoReale => prodottoReale.zone === zone)
    .reduce((sum, prodottoReale) => {
      const prodottoDevis = chantierDevis.produits.find(p => 
        p.article === prodottoReale.article && p.zone === zone
      );
      
      if (prodottoDevis) {
        const prezzoUnitario = Number(prodottoDevis.prix || 0);
        const quantitaReale = Number(prodottoReale.mlReali || prodottoReale.totalML || 0);
        
        // Calcola supplementi
        let totalSuppl = 0;
        if (prodottoReale.supplements && Array.isArray(prodottoReale.supplements)) {
          totalSuppl = prodottoReale.supplements.reduce((sumSupp, supp) => {
            const qte = Number(supp.qte || supp.qtePosee || 0);
            const valeur = Number(supp.valeur || 0);
            return sumSupp + (qte * valeur);
          }, 0);
        }
        
        const totalQuantita = quantitaReale + totalSuppl;
        return sum + (totalQuantita * prezzoUnitario);
      }
      return sum;
    }, 0);
};

const getGiaFatturatoZona = (zone) => {
  const chantier = chantiers.value.find(c => c.id == (detailResoconto.value.chantier_id || detailResoconto.value.chantierId));
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  
  if (!chantierDevis?.produits) return 0;
  
  const totaleDevisZona = chantierDevis.produits
    .filter(p => p.zone === zone)
    .reduce((sum, p) => sum + Number(p.total || 0), 0);
  
  const percentualeGiaFatturata = resocontiPercentuali.value
    .filter(r => 
      r.status === 'approved' && 
      (r.chantier_id || r.chantierId) === (detailResoconto.value.chantier_id || detailResoconto.value.chantierId) &&
      r.id !== detailResoconto.value.id
    )
    .reduce((sum, r) => sum + (r.avancementi?.[zone] || 0), 0);
  
  return totaleDevisZona * percentualeGiaFatturata / 100;
};

const calculateResocontoFinaleValue = (zone) => {
  const chantier = chantiers.value.find(c => c.id == (detailResoconto.value.chantier_id || detailResoconto.value.chantierId));
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  
  if (!chantierDevis?.produits || !detailResoconto.value.prodotti_reali) return 0;
  
  let totaleReale = 0;
  
  // 1. MONETIZZA il resoconto: calcola valore delle quantità reali posate
  detailResoconto.value.prodotti_reali
    .filter(prodottoReale => prodottoReale.zone === zone)
    .forEach(prodottoReale => {
      const prodottoDevis = chantierDevis.produits.find(p => 
        p.article === prodottoReale.article && p.zone === zone
      );
      
      if (prodottoDevis) {
        const prezzoUnitario = Number(prodottoDevis.prix || 0);
        const quantitaReale = Number(prodottoReale.totalML || prodottoReale.mlReali || 0);
        const valoreItem = quantitaReale * prezzoUnitario;
        totaleReale += valoreItem;
        
        console.log(`  ${prodottoReale.article}: ${quantitaReale} ML × ${prezzoUnitario} CHF = ${valoreItem.toFixed(2)} CHF`);
      }
    });
  
  // 2. CALCOLA il totale del devis per QUESTA ZONA
  const totaleDevisZona = chantierDevis.produits
    .filter(p => p.zone === zone)
    .reduce((sum, p) => sum + Number(p.total || 0), 0);
  
  // 3. TROVA il 40% già fatturato per QUESTA ZONA
  const percentualeGiaFatturata = resocontiPercentuali.value
    .filter(r => 
      r.status === 'approved' && 
      (r.chantier_id || r.chantierId) === (detailResoconto.value.chantier_id || detailResoconto.value.chantierId) &&
      r.id !== detailResoconto.value.id
    )
    .reduce((sum, r) => sum + (r.avancementi?.[zone] || 0), 0);
  
  // 4. CALCOLA l'importo già fatturato (40% di QUESTA ZONA)
  const importoGiaFatturato = totaleDevisZona * percentualeGiaFatturata / 100;
  
  // 5. CALCOLA la differenza da fatturare
  const differenza = totaleReale - importoGiaFatturato;
  
  console.log(`💰 RESOCONTO FINALE - ${zone}:`);
  console.log(`  Valore reale totale: ${totaleReale.toFixed(2)} CHF`);
  console.log(`  Già fatturato: ${importoGiaFatturato.toFixed(2)} CHF`);
  console.log(`  Da fatturare: ${differenza.toFixed(2)} CHF`);
  
  return differenza;
};

const calculateTotalTravaux = () => {
  if (!detailResoconto.value.avancementi) return 0;
  
  // Per resoconto finale, calcola tutte le zone
  if (detailResoconto.value.type === 'resoconto_finale') {
    return Object.keys(detailResoconto.value.avancementi).reduce((sum, zona) => {
      const valoreReale = getValoreRealeZona(zona);
      const acconto = Number(accontiPerZona.value[zona] || 0);
      return sum + (valoreReale - acconto);
    }, 0);
  }
  
  // Logica originale per resoconti percentuali
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
  const acconti = Number(totalAccontiZone.value || 0);
  const imponibileResiduo = totalHT - acconti;
  return imponibileResiduo * 0.081;
};

const calculateTotalTTCWithAcconti = () => {
  const totalHT = calculateTotalHT();
  const acconti = Number(totalAccontiZone.value || 0);
  const imponibileResiduo = totalHT - acconti;
  const tva = imponibileResiduo * 0.081;
  return imponibileResiduo + tva;
};

const approuverResoconto = async (resoconto) => {
  // Mostra dialog per scegliere la data
  showDatePersonnalisee.value = true;
  dateFacturePersonnalisee.value = new Date().toISOString().split('T')[0];
  
  // Aspetta la conferma dell'utente
  const confirmed = await new Promise((resolve) => {
    const originalConfirm = window.confirm;
    window.confirm = (message) => {
      showDatePersonnalisee.value = false;
      window.confirm = originalConfirm;
      return resolve(true);
    };
    
    // Simula dialog personalizzato
    setTimeout(() => {
      if (confirm('Approuver ce resoconto percentuel et générer la facture ?')) {
        resolve(true);
      } else {
        resolve(false);
      }
      showDatePersonnalisee.value = false;
    }, 100);
  });
  
  if (!confirmed) return;
  
  try {
    // Valida la data
    const dataScelta = dateFacturePersonnalisee.value;
    const ultimaDataFactura = await getUltimaDataFactura();
    
    if (ultimaDataFactura && new Date(dataScelta) < new Date(ultimaDataFactura)) {
      alert(`Erreur: La date ne peut pas être antérieure à la dernière facture (${formatDate(ultimaDataFactura)})`);
      return;
    }
    
    // Approva il resoconto
    const { error: updateError } = await supabase
      .from('resoconti_percentuali')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'admin',
        acconti_per_zona: accontiPerZona.value  // SALVA GLI ACCONTI PER ZONA
      })
      .eq('id', resoconto.id);
    
    if (updateError) {
      console.error('Errore aggiornamento resoconto:', updateError);
      throw new Error(`Impossibile aggiornare il resoconto: ${updateError.message}`);
    }
    
    // Genera la fattura
    const chantier = chantiers.value.find(c => c.id === (resoconto.chantier_id || resoconto.chantierId));
    const chantierDevis = devis.value.find(d => d.id === chantier?.devis_id);
    
    // USA LA STESSA LOGICA DEL PDF
    detailResoconto.value = resoconto;
    const montantHT = calculateTotalHT();
    
    // USA NUMERO RISERVATO SE ESISTE (per correzioni)
    const numeroFacture = resoconto.numero_fattura_riservato || await generateNumeroFacture(dataScelta);
    
    // NON salvare acconti nel database per resoconti finali (già sottratti nel calcolo)
    const accontiDaSalvare = resoconto.type === 'resoconto_finale' ? 0 : Number(totalAccontiZone.value || 0);
    
    // Calcola data scadenza (30 giorni dalla data fattura)
    const dataScadenza = new Date(dataScelta);
    dataScadenza.setDate(dataScadenza.getDate() + 30);
    
    const { error } = await supabase
      .from('factures')
      .insert([{
        numero: numeroFacture,
        chantier_id: resoconto.chantier_id || resoconto.chantierId,
        resoconto_id: resoconto.id,
        date_facture: dataScelta,
        montant_ht: montantHT,
        taux_tva: 8.1,
        montant_ttc: montantHT * 1.081,
        acconti_precedenti: accontiDaSalvare,
        statut: 'emise',
        client_nom: chantier?.client || 'Client',
        date_echeance: dataScadenza.toISOString().split('T')[0],
        notes: `Facture générée depuis resoconto percentuel ${resoconto.periode_month || resoconto.periodeMonth}`,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    // Pulisci il numero riservato dopo l'uso
    if (resoconto.numero_fattura_riservato) {
      await supabase
        .from('resoconti_percentuali')
        .update({ numero_fattura_riservato: null })
        .eq('id', resoconto.id);
    }
    
    alert(`Resoconto approuvé et facture ${numeroFacture} créée!`);
    showDetailResoconto.value = false;  // Chiudi il modal
    // Piccolo delay per permettere al DB di aggiornarsi
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadData();  // Aspetta il caricamento
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
  // Mostra dialog per scegliere la data
  showDatePersonnalisee.value = true;
  dateFacturePersonnalisee.value = new Date().toISOString().split('T')[0];
  
  // Aspetta la conferma dell'utente
  const confirmed = await new Promise((resolve) => {
    const originalConfirm = window.confirm;
    window.confirm = (message) => {
      showDatePersonnalisee.value = false;
      window.confirm = originalConfirm;
      return resolve(true);
    };
    
    // Simula dialog personalizzato
    setTimeout(() => {
      if (confirm('Générer la facture pour ce resoconto approuvé ?')) {
        resolve(true);
      } else {
        resolve(false);
      }
      showDatePersonnalisee.value = false;
    }, 100);
  });
  
  if (!confirmed) return;
  
  try {
    // Valida la data
    const dataScelta = dateFacturePersonnalisee.value;
    const ultimaDataFactura = await getUltimaDataFactura();
    
    if (ultimaDataFactura && new Date(dataScelta) < new Date(ultimaDataFactura)) {
      alert(`Erreur: La date ne peut pas être antérieure à la dernière facture (${formatDate(ultimaDataFactura)})`);
      return;
    }
    
    const chantier = chantiers.value.find(c => c.id === (resoconto.chantier_id || resoconto.chantierId));
    const chantierDevis = devis.value.find(d => d.id === chantier?.devis_id);
    
    const totalPercentuali = Object.values(resoconto.avancementi || {}).reduce((sum, pct) => sum + pct, 0);
    const montantTravauxHT = chantierDevis?.total ? (chantierDevis.total * totalPercentuali / 100) : 1000;
    
    // Calcola montant regie
    const prixRegieChantier = chantier?.prix_regie || 75;
    const montantRegiesHT = (resoconto.regies || []).reduce((sum, r) => sum + (r.heures * (r.prixHeure || prixRegieChantier)), 0);
    const montantHT = montantTravauxHT + montantRegiesHT;
    
    // USA NUMERO RISERVATO SE ESISTE (per correzioni)
    const numeroFacture = resoconto.numero_fattura_riservato || await generateNumeroFacture(dataScelta);
    
    // Calcola data scadenza (30 giorni dalla data fattura)
    const dataScadenza = new Date(dataScelta);
    dataScadenza.setDate(dataScadenza.getDate() + 30);
    
    const { error } = await supabase
      .from('factures')
      .insert([{
        numero: numeroFacture,
        chantier_id: resoconto.chantier_id || resoconto.chantierId,
        resoconto_id: resoconto.id,
        date_facture: dataScelta,
        montant_ht: montantHT,
        taux_tva: 8.1,
        montant_ttc: montantHT * 1.081,
        statut: 'emise',
        client_nom: chantier?.client || 'Client',
        date_echeance: dataScadenza.toISOString().split('T')[0],
        notes: `Facture générée depuis resoconto percentuel ${resoconto.periode_month || resoconto.periodeMonth}`,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    // Pulisci il numero riservato dopo l'uso
    if (resoconto.numero_fattura_riservato) {
      await supabase
        .from('resoconti_percentuali')
        .update({ numero_fattura_riservato: null })
        .eq('id', resoconto.id);
    }
    
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
        statut: nouveauStatut.value
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
  // Per fatture manuali, reindirizza alla pagina di modifica
  if (facture.type === 'manuelle') {
    // Naviga alla pagina di modifica con l'ID della fattura usando Vue Router
    router.push(`/admin/facture-manuelle?edit=${facture.id}`);
    return;
  }
  
  // Debug: verifica paiements caricati
  console.log('🔍 Paiements disponibili:', paiements.value);
  
  // Per altre fatture, mostra il modal normale
  factureEnCours.value = facture;
  nouvelleDate.value = facture.date_facture || facture.dateFacture;
  nouvelleDateEcheance.value = facture.date_echeance || facture.dateEcheance || '';
  // Estrai modalità pagamento dalle notes
  const modalitaMatch = facture.notes?.match(/Conditions:\s*([^\n]+)/);
  nouvelleModalitePaiement.value = modalitaMatch ? modalitaMatch[1].trim() : '';
  console.log('🔍 Modalità estratta:', nouvelleModalitePaiement.value);
  nouvellesNotes.value = facture.notes || '';
  showModifierFacture.value = true;
};

const confirmerModificationFacture = async () => {
  try {
    // Valida la data - permetti modifica della stessa fattura
    const ultimaDataFactura = await getUltimaDataFactura();
    
    // Controlla solo se non è la stessa fattura che stiamo modificando
    if (ultimaDataFactura && new Date(nouvelleDate.value) < new Date(ultimaDataFactura)) {
      // Verifica se la data dell'ultima fattura è diversa da quella attuale
      const dataAttuale = factureEnCours.value.date_facture || factureEnCours.value.dateFacture;
      if (ultimaDataFactura !== dataAttuale) {
        alert(`Erreur: La date ne peut pas être antérieure à la dernière facture (${formatDate(ultimaDataFactura)})`);
        return;
      }
    }
    
    // Recalcola data scadenza se modalità pagamento è cambiata
    let dataEcheanceFinale = nouvelleDateEcheance.value;
    if (nouvelleModalitePaiement.value) {
      dataEcheanceFinale = calculateDateEcheance(nouvelleDate.value, nouvelleModalitePaiement.value);
    }
    
    // Aggiorna notes con modalità di pagamento
    let notesAggiornate = nouvellesNotes.value || '';
    if (nouvelleModalitePaiement.value) {
      // Rimuovi vecchia modalità se presente
      notesAggiornate = notesAggiornate.replace(/Modalité:\s*[^\n]+\n?/g, '');
      // Aggiungi nuova modalità
      notesAggiornate = (notesAggiornate.trim() + '\nModalité: ' + nouvelleModalitePaiement.value).trim();
    }
    
    const { error } = await supabase
      .from('factures')
      .update({
        date_facture: nouvelleDate.value,
        date_echeance: dataEcheanceFinale,
        notes: notesAggiornate
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

const updateStatut = async (facture) => {
  try {
    const { error } = await supabase
      .from('factures')
      .update({ statut: facture.statut })
      .eq('id', facture.id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur: ' + error.message);
  }
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return date.toDate ? date.toDate().toLocaleDateString('fr-FR') : new Date(date).toLocaleDateString('fr-FR');
};

const paiements = ref([]);

// Carica metodi di pagamento da database
const loadPaiements = async () => {
  const { data } = await supabase.from('paiements').select('*');
  paiements.value = data || [];
};

// Calcola data scadenza da metodo di pagamento
const calculateDateEcheance = (dateFacture, methodePaiement = '30 jours net') => {
  const date = new Date(dateFacture);
  const metodo = paiements.value.find(p => p.nom === methodePaiement);
  const jours = metodo?.giorni_calcolo || 30;
  date.setDate(date.getDate() + jours);
  return date.toISOString().split('T')[0];
};

const generateNumeroFacture = async (dataFactura = null) => {
  try {
    // Usa l'anno della data fattura se fornita, altrimenti anno corrente
    const anno = dataFactura ? new Date(dataFactura).getFullYear() : new Date().getFullYear();
    
    // Carica tutte le fatture dell'anno
    const { data: fattureAnno, error: fattureError } = await supabase
      .from('factures')
      .select('numero')
      .like('numero', `F${anno}-%`)
      .order('numero', { ascending: false });
    
    if (fattureError) throw fattureError;
    
    // Trova il numero più alto
    let ultimoNumero = 0;
    if (fattureAnno && fattureAnno.length > 0) {
      fattureAnno.forEach(f => {
        const match = f.numero.match(/F\d{4}-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > ultimoNumero) ultimoNumero = num;
        }
      });
    }
    
    const prossimoNumero = ultimoNumero + 1;
    return `F${anno}-${String(prossimoNumero).padStart(3, '0')}`;
  } catch (error) {
    console.error('Errore generazione numero:', error);
    const anno = dataFactura ? new Date(dataFactura).getFullYear() : new Date().getFullYear();
    return `F${anno}-${String(Date.now()).slice(-3)}`;
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF'
  }).format(amount);
};

const calculateSoldeFinale = (facture) => {
  const acconti = Number(facture.acconti_precedenti || 0);
  
  // Se non ci sono acconti, usa direttamente montant_ttc
  if (acconti === 0) {
    return Number(facture.montant_ttc || facture.montantTTC || 0);
  }
  
  // Se ci sono acconti, calcola il solde
  const montantHT = Number(facture.montant_ht || 0);
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
    // Definisci variabili comuni
    const chantierId = facture.chantier_id || facture.chantierId;
    const chantier = chantiers.value.find(c => c.id === chantierId);
    
    // DICHIARATA GLOBALMENTE PER EVITARE ERRORI DI SCOPE
    let totalImporto = 0;
    
    // Import logo
    let logo;
    try {
      const logoModule = await import('@/assets/logo.jpg');
      logo = logoModule.default;
    } catch (e) {
      console.warn('Logo non trovato');
    }

    // Fatture manuali: PDF con layout professionale
    if (facture.type === 'manuelle') {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      
      // Usa la stessa funzione drawHeader delle altre fatture
      const drawHeader = (doc, title) => {
        // Logo più grande e più in basso
        if (logo) doc.addImage(logo, 'JPEG', 15, 20, 70, 15);
        
        // Dati azienda più grandi
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('DALLELEC Sarl - CHE-280.028.822', 195, 22, { align: 'right' });
        doc.text('Rue de Bourgogne 25', 195, 28, { align: 'right' });
        doc.text('1203 Genève', 195, 34, { align: 'right' });
        doc.text('IBAN: CH09 0027 9279 3507 4901 H', 195, 40, { align: 'right' });
        doc.text('IBAN: CH09 0027 9279 3507 4901 H', 195, 40, { align: 'right' });
        
        // Titolo più in basso
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 15, 50);
        
        // Linea separatrice
        doc.setLineWidth(0.5);
        doc.line(15, 55, 195, 55);
        
        // Informazioni documento con più spazio
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let yInfo = 65;
        
        // Prima colonna (sinistra) - più spaziosa
        doc.text(`Date: ${formatDate(facture.date_facture)}`, 15, yInfo);
        
        yInfo += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('FACTURÉ À:', 15, yInfo);
        yInfo += 6;
        doc.setFont('helvetica', 'normal');
        
        // Dati cliente più grandi con text wrapping
        const clientData = clients.value.find(c => c.nom === facture.client_nom);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        
        // Gestisce il wrapping del nome cliente
        const maxWidth = 90; // Larghezza massima per evitare sovrapposizione
        const clientLines = doc.splitTextToSize(facture.client_nom, maxWidth);
        clientLines.forEach((line, index) => {
          doc.text(line, 15, yInfo + (index * 5));
        });
        yInfo += clientLines.length * 5;
        
        doc.setFont('helvetica', 'normal');
        
        if (clientData?.adresse) {
          doc.setFontSize(10);
          doc.text(clientData.adresse, 15, yInfo);
          yInfo += 5;
        }
        if (clientData?.ville) {
          doc.text(clientData.ville, 15, yInfo);
          yInfo += 5;
        }
        
        // Seconda colonna (destra) - Informazioni cantiere
        let yInfoRight = 67;
        if (chantier) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(`CHANTIER N° ${chantier.numero_cantiere || chantier.numeroCantiere || 'N/A'}`, 115, yInfoRight);
          yInfoRight += 6;
          doc.setFont('helvetica', 'normal');
          doc.text(`${chantier.nom}`, 115, yInfoRight);
          
          if (chantier.adresse) {
            yInfoRight += 5;
            doc.setFontSize(9);
            doc.text(`${chantier.adresse}`, 115, yInfoRight);
            if (chantier.ville) {
              yInfoRight += 4;
              doc.text(`${chantier.ville}`, 115, yInfoRight);
            }
            doc.setFontSize(10);
          }
          
          if (chantier.technicien) {
            yInfoRight += 6;
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.text(`Technicien: ${chantier.technicien}`, 115, yInfoRight);
            doc.setFont('helvetica', 'normal');
          }
        }
        
        return Math.max(yInfo, yInfoRight) + 20; // Ancora più spazio dopo l'header
      };
      
      let startY = drawHeader(doc, `FACTURE N. ${facture.numero}`);
      
      // Aggiungi spazio dopo l'header
      startY += 20;
      
      const tableData = facture.lignes.map(ligne => [
        ligne.description,
        ligne.unite || 'pcs',
        ligne.quantite.toString(),
        `${ligne.prixUnitaire.toFixed(2)} CHF`,
        `${(ligne.quantite * ligne.prixUnitaire).toFixed(2)} CHF`
      ]);
      
      autoTable(doc, {
        head: [['Description', 'Unité', 'Quantité', 'Prix unitaire', 'Total HT']],
        body: tableData,
        startY: startY,
        theme: 'striped',
        headStyles: { 
          fillColor: [70, 130, 180], 
          textColor: 255,
          fontSize: 10
        },
        bodyStyles: { 
          fontSize: 9,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' }
        },
        margin: { bottom: 80 },
        showFoot: 'everyPage'
      });
      
      let finalY = doc.lastAutoTable.finalY + 10;
      
      // Verifica spazio per totali (serve almeno 60mm)
      if (finalY > 230) {
        doc.addPage();
        finalY = 20;
      }
      
      finalY += 30;
      const totalHT = Number(facture.montant_ht || facture.montantHT || 0);
      const tva = totalHT * 0.081;
      const ttc = totalHT + tva;
      
      // Box per i totali più elegante
      doc.setFillColor(248, 249, 250);
      doc.rect(115, finalY - 5, 85, 30, 'F');
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.rect(115, finalY - 5, 85, 30);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Total HT:', 120, finalY + 2);
      doc.text(`${totalHT.toFixed(2)} CHF`, 195, finalY + 2, { align: 'right' });
      doc.text(`TVA (8.1%):`, 120, finalY + 9);
      doc.text(`${tva.toFixed(2)} CHF`, 195, finalY + 9, { align: 'right' });
      
      // Linea separatrice più elegante
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      doc.line(120, finalY + 13, 195, finalY + 13);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('TOTAL TTC:', 120, finalY + 20);
      doc.text(`${ttc.toFixed(2)} CHF`, 195, finalY + 20, { align: 'right' });
      
      // Conditions de paiement dalle notes
      const modalitaMatch = facture.notes?.match(/Conditions:\s*([^\n]+)/);
      const modalitaPagamento = modalitaMatch ? modalitaMatch[1].trim() : '30 jours net';
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      // Conditions de paiement in fondo alla pagina
      let yFooter = finalY + 35;
      
      doc.text(`Conditions de paiement: ${modalitaPagamento}`, 15, yFooter);
      doc.setFontSize(9);
      doc.text('Merci de votre confiance', 15, yFooter + 10);
      
      // Note se presenti
      const notes = facture.notes?.split('Conditions:')[0]?.trim();
      if (notes) {
        yFooter += 25;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('Notes:', 15, yFooter);
        yFooter += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const noteLines = doc.splitTextToSize(notes, 180);
        noteLines.forEach((line, index) => {
          doc.text(line, 15, yFooter + (index * 4));
        });
      }
      
      // Nome PDF: NumeroFacture_DataFacture_Cliente_Cantiere
      const clientName = (facture.client_nom || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
      let chantierName = 'Travaux';
      if (chantier) {
        const numero = chantier.numero_cantiere ? `N${chantier.numero_cantiere}_` : '';
        chantierName = `${numero}${chantier.nom}`.replace(/[^a-zA-Z0-9]/g, '_');
      }
      const numeroFacture = facture.numero || 'F000';
      const dataFacture = facture.date_facture?.replace(/-/g, '') || new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      doc.save(`${numeroFacture}_${dataFacture}_${clientName}_${chantierName}.pdf`);
      alert('Facture générée avec succès!');
      return;
    }

    // Determina il tipo di fattura
    const metrageId = facture.metrage_id || facture.metrageId;
    const resocontoId = facture.resoconto_id || facture.resocontoId;
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
      // Logo più grande e più in basso
      if (logo) doc.addImage(logo, 'JPEG', 15, 20, 70, 15);
      
      // Dati azienda più grandi
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('DALLELEC Sarl - CHE-280.028.822', 195, 22, { align: 'right' });
      doc.text('Rue de Bourgogne 25', 195, 28, { align: 'right' });
      doc.text('1203 Genève', 195, 34, { align: 'right' });
      doc.text('IBAN: CH09 0027 9279 3507 4901 H', 195, 40, { align: 'right' });
      doc.text('IBAN: CH09 0027 9279 3507 4901 H', 195, 40, { align: 'right' });
      
      // Titolo più in basso
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 15, 50);
      
      // Linea separatrice
      doc.setLineWidth(0.5);
      doc.line(15, 55, 195, 55);
      
      // Informazioni documento con più spazio
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let yInfo = 65;
      
      // Prima colonna (sinistra) - più spaziosa
      doc.text(`Date: ${formatDate(facture.date_facture)}`, 15, yInfo);
      if (periodoRef) {
        yInfo += 6;
        doc.text(periodoRef, 15, yInfo);
      }
      
      yInfo += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURÉ À:', 15, yInfo);
      yInfo += 6;
      doc.setFont('helvetica', 'normal');
      
      // Dati cliente più grandi con text wrapping
      const clientData = clients.value.find(c => c.nom === nomeCliente);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      // Gestisce il wrapping del nome cliente
      const maxWidth = 90;
      const clientLines = doc.splitTextToSize(nomeCliente, maxWidth);
      clientLines.forEach((line, index) => {
        doc.text(line, 15, yInfo + (index * 5));
      });
      yInfo += clientLines.length * 5;
      
      doc.setFont('helvetica', 'normal');
      
      if (clientData?.adresse) {
        doc.setFontSize(10);
        doc.text(clientData.adresse, 15, yInfo);
        yInfo += 5;
      }
      if (clientData?.ville) {
        doc.text(clientData.ville, 15, yInfo);
        yInfo += 5;
      }
      
      // Seconda colonna (destra) - Informazioni cantiere
      let yInfoRight = 67;
      if (chantier) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`CHANTIER N° ${chantier.numero_cantiere || chantier.numeroCantiere || 'N/A'}`, 115, yInfoRight);
        yInfoRight += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`${chantier.nom}`, 115, yInfoRight);
        
        // Aggiungi indirizzo cantiere se disponibile
        if (chantier.adresse) {
          yInfoRight += 5;
          doc.setFontSize(9);
          doc.text(`${chantier.adresse}`, 115, yInfoRight);
          if (chantier.ville) {
            yInfoRight += 4;
            doc.text(`${chantier.ville}`, 115, yInfoRight);
          }
          doc.setFontSize(10);
        }
        
        // Aggiungi technicien se disponibile
        if (chantier.technicien) {
          yInfoRight += 6;
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.text(`Technicien: ${chantier.technicien}`, 115, yInfoRight);
          doc.setFont('helvetica', 'normal');
        }
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('TRAVAUX GÉNÉRAUX', 115, yInfoRight);
        yInfoRight += 6;
      }
      
      return Math.max(yInfo, yInfoRight) + 20;
    };

    // FATTURA DA RESOCONTO FINALE - COPIA ESATTA LOGICA MÉTRAGES
    if (resocontoDoc && resocontoDoc.type === 'resoconto_finale') {
      // 1. PDF MÉTRÉES (senza prezzi) - COPIA ESATTA
      const docMetrees = new jsPDF({ unit: 'mm', format: 'a4' });
      let yPos = drawHeader(docMetrees, `MÉTRÉES DÉTAILLÉES - ${facture.numero}`);
      
      // Aggiungi intestazione RAPPORT FINAL
      docMetrees.setFontSize(11);
      docMetrees.setFont('helvetica', 'bold');
      docMetrees.setFillColor(255, 250, 205);
      docMetrees.rect(10, yPos - 3, 190, 8, 'F');
      docMetrees.text('🎯 RAPPORT FINAL DE ZONE - QUANTITÉS RÉELLES POSÉES', 15, yPos + 2);
      yPos += 12;
      
      let totalMetreesHT = 0;
      
      if (resocontoDoc?.prodotti_reali) {
        const itemsByZone = {};
        resocontoDoc.prodotti_reali.forEach(item => {
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
          
          let zoneTotal = 0;
          const tableData = items.map(item => {
            const quantite = Number(item.mlReali || item.totalML || 0);
            let totalSuppl = 0;
            
            if (item.supplements && Array.isArray(item.supplements)) {
              totalSuppl = item.supplements.reduce((sum, supp) => {
                const qte = Number(supp.qte || supp.qtePosee || 0);
                const valeur = Number(supp.valeur || 0);
                return sum + (qte * valeur);
              }, 0);
            }
            
            const total = quantite + totalSuppl;
            
            // Aggiungi prezzi anche nel PDF métrées
            const prodottoDevis = chantierDevis?.produits?.find(p => p.article === item.article);
            const prezzoUnit = Number(prodottoDevis?.prix || 50);
            const totalItem = total * prezzoUnit;
            zoneTotal += totalItem;
            totalMetreesHT += totalItem;
            
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
          
          autoTable(docMetrees, {
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
              8: { cellWidth: 24, halign: 'right' }
            },
            margin: { left: 10, right: 10 }
          });
          
          yPos = docMetrees.lastAutoTable.finalY + 5;
          
          // Sous-total zona nel PDF métrées
          docMetrees.setFillColor(250, 250, 250);
          docMetrees.rect(130, yPos - 2, 70, 6, 'F');
          docMetrees.setFont('helvetica', 'bold');
          docMetrees.setFontSize(9);
          docMetrees.text(`Sous-total: ${zoneTotal.toFixed(2)} CHF`, 135, yPos + 2);
          yPos += 12;
        });
        
        // Détail des suppléments par zone - COPIA ESATTA
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
      
      // Régies nel PDF métrées (per technicien)
      if (resocontoDoc.regies?.length > 0) {
        // Verifica spazio per sezione régies
        if (yPos > 220) {
          docMetrees.addPage();
          yPos = 20;
        }
        
        docMetrees.setFontSize(14);
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.text('RÉGIES (HEURES SUPPLÉMENTAIRES)', 10, yPos);
        yPos += 10;
        
        const prixRegieChantier = chantier?.prix_regie || 75;
        const regieData = resocontoDoc.regies.map(regie => {
          const heures = Number(regie.heures || 0);
          const prixHeure = Number(regie.prixHeure || prixRegieChantier);
          const total = heures * prixHeure;
          return [
            regie.zone || '',
            regie.description || '',
            `${heures}h`,
            `${prixHeure.toFixed(2)} CHF`,
            `${total.toFixed(2)} CHF`
          ];
        });
        
        const totalRegiesMetrees = resocontoDoc.regies.reduce((sum, r) => sum + (r.heures * (r.prixHeure || prixRegieChantier)), 0);
        totalMetreesHT += totalRegiesMetrees;
        
        autoTable(docMetrees, {
          head: [['Zone', 'Description', 'Heures', 'Prix/h', 'Total']],
          body: regieData,
          startY: yPos,
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
            1: { cellWidth: 60 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' }
          }
        });
        
        yPos = docMetrees.lastAutoTable.finalY + 5;
        
        // Sous-total régies nel PDF métrées
        docMetrees.setFillColor(250, 250, 250);
        docMetrees.rect(130, yPos - 2, 70, 6, 'F');
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.setFontSize(9);
        docMetrees.text(`Sous-total Régies: ${totalRegiesMetrees.toFixed(2)} CHF`, 135, yPos + 2);
        yPos += 15;
        
        // Total général nel PDF métrées
        docMetrees.setFillColor(245, 245, 245);
        docMetrees.rect(115, yPos - 5, 85, 15, 'F');
        docMetrees.setDrawColor(200, 200, 200);
        docMetrees.rect(115, yPos - 5, 85, 15);
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.setFontSize(12);
        docMetrees.text('TOTAL HT:', 120, yPos + 2);
        docMetrees.text(`${totalMetreesHT.toFixed(2)} CHF`, 195, yPos + 2, { align: 'right' });
        yPos += 20;
      }
      
      // 2. PDF FACTURE (avec prix) - COPIA ESATTA
      const docFacture = new jsPDF({ unit: 'mm', format: 'a4' });
      yPos = drawHeader(docFacture, `FACTURE N. ${facture.numero}`);
      
      // Aggiungi intestazione RAPPORT FINAL
      docFacture.setFontSize(11);
      docFacture.setFont('helvetica', 'bold');
      docFacture.setFillColor(255, 250, 205);
      docFacture.rect(10, yPos - 3, 190, 8, 'F');
      docFacture.text('🎯 RAPPORT FINAL DE ZONE - DÉCOMPTE FINAL', 15, yPos + 2);
      yPos += 12;
      
      let totalFactureHT = 0;
      
      if (resocontoDoc?.prodotti_reali) {
        const itemsByZone = {};
        resocontoDoc.prodotti_reali.forEach(item => {
          if (!itemsByZone[item.zone]) itemsByZone[item.zone] = [];
          itemsByZone[item.zone].push(item);
        });
        
        Object.entries(itemsByZone).forEach(([zoneName, items]) => {
          // Verifica spazio disponibile per zona
          if (yPos > 180) {
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
            const quantite = Number(item.mlReali || item.totalML || 0);
            
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
          
          // Calcola imponibile devis zona
          const imponibileZona = chantierDevis?.produits
            ?.filter(p => p.zone === zoneName)
            .reduce((sum, p) => sum + Number(p.total || 0), 0) || 0;
          
          // Calcola già fatturato zona (usa accontiPerZona già calcolato)
          const giaFatturatoZona = Number(accontiPerZona.value[zoneName] || 0);
          
          // Calcola totale da fatturare
          const daFatturarezZona = zoneTotal - giaFatturatoZona;
          
          // Box riepilogo zona
          docFacture.setFillColor(250, 250, 250);
          docFacture.rect(130, yPos - 2, 70, 24, 'F');
          docFacture.setFont('helvetica', 'normal');
          docFacture.setFontSize(8);
          docFacture.text(`Imponibile:`, 135, yPos + 2);
          docFacture.text(`${imponibileZona.toFixed(2)} CHF`, 195, yPos + 2, { align: 'right' });
          
          docFacture.setTextColor(200, 0, 0);
          docFacture.text(`Già fatturato:`, 135, yPos + 8);
          docFacture.text(`-${giaFatturatoZona.toFixed(2)} CHF`, 195, yPos + 8, { align: 'right' });
          docFacture.setTextColor(0, 0, 0);
          
          docFacture.setFont('helvetica', 'bold');
          docFacture.setFontSize(9);
          docFacture.text(`Totale da fatturare:`, 135, yPos + 14);
          docFacture.text(`${daFatturarezZona.toFixed(2)} CHF`, 195, yPos + 14, { align: 'right' });
          
          yPos += 28;
        });
      }
      
      // Régies se presenti
      if (resocontoDoc.regies?.length > 0) {
        // Verifica spazio per régies
        if (yPos > 200) {
          docFacture.addPage();
          yPos = 20;
        }
        
        docFacture.setFontSize(12);
        docFacture.setFont('helvetica', 'bold');
        docFacture.text('RÉGIES', 10, yPos);
        
        const prixRegieChantier = chantier?.prix_regie || 75;
        const regieData = resocontoDoc.regies.map(regie => {
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
            1: { cellWidth: 60 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' }
          }
        });
        
        yPos = docFacture.lastAutoTable.finalY + 10;
      }
      
      // Calcola acconti per resoconti finali
      const accontiHT = Object.keys(resocontoDoc.avancementi || {}).reduce((sum, zone) => {
        return sum + getGiaFatturatoZona(zone);
      }, 0);
      
      console.log('🔍 PDF - Acconti calcolati:', accontiHT);
      console.log('🔍 PDF - Zone resoconto:', Object.keys(resocontoDoc.avancementi || {}));
      
      // FORZA visualizzazione acconti per resoconti finali
      if (resocontoDoc.type === 'resoconto_finale') {
        if (yPos > 220) {
          docFacture.addPage();
          yPos = 20;
        }
        
        docFacture.setFontSize(12);
        docFacture.setFont('helvetica', 'bold');
        docFacture.text('ACOMPTES PRÉCÉDENTS PAR ZONE', 10, yPos);
        yPos += 5;
        
        // Crea righe dettagliate per ogni zona con acconti
        const accontiRows = [];
        let totalAccontiPDF = 0;
        
        Object.keys(resocontoDoc.avancementi || {}).forEach(nomeZona => {
          const accontoZona = Number(accontiPerZona.value[nomeZona] || 0);
          if (accontoZona > 0) {
            totalAccontiPDF += accontoZona;
            accontiRows.push([
              `Acomptes Zone: ${nomeZona}`,
              `-${accontoZona.toFixed(2)} CHF`
            ]);
          }
        });
        
        // Se ci sono acconti, mostra la tabella
        if (accontiRows.length > 0) {
          accontiRows.push([
            { content: 'TOTAL ACOMPTES:', styles: { fontStyle: 'bold' } },
            { content: `-${totalAccontiPDF.toFixed(2)} CHF`, styles: { fontStyle: 'bold' } }
          ]);
          
          autoTable(docFacture, {
            head: [['Description', 'Montant HT']],
            body: accontiRows,
            startY: yPos,
            theme: 'striped',
            headStyles: { 
              fillColor: [70, 130, 180], 
              textColor: 255, 
              fontSize: 10 
            },
            bodyStyles: { 
              fontSize: 10, 
              fontStyle: 'bold'
            }
          });
          
          yPos = docFacture.lastAutoTable.finalY + 10;
        }
      }
      
      // Verifica spazio per totali finali
      if (yPos > 200) {
        docFacture.addPage();
        yPos = 20;
      }
      
      // Totali finali con acconti - USA TOTALE CORRETTO
      const realMontantHT = totalFactureHT; // USA IL TOTALE CALCOLATO
      const realTauxTVA = Number(facture.taux_tva || 8.1);
      const realMontantTVA = realMontantHT * (realTauxTVA / 100);
      
      // Calcola acconti totali per resoconti finali
      let accontiFinali = 0;
      if (resocontoDoc.type === 'resoconto_finale') {
        Object.keys(resocontoDoc.avancementi || {}).forEach(zona => {
          accontiFinali += Number(accontiPerZona.value[zona] || 0);
        });
      }
      
      const imponibileResiduoHT = realMontantHT - accontiFinali;
      const tvaResiduoHT = imponibileResiduoHT * (realTauxTVA / 100);
      const realMontantTTC = imponibileResiduoHT + tvaResiduoHT;
      
      yPos += 10;
      
      // Box per i totali ottimizzato
      const boxHeight = accontiHT > 0 ? 50 : 30;
      docFacture.setFillColor(245, 245, 245);
      docFacture.rect(115, yPos - 5, 85, boxHeight, 'F');
      docFacture.setDrawColor(200, 200, 200);
      docFacture.rect(115, yPos - 5, 85, boxHeight);
      
      docFacture.setFontSize(10);
      docFacture.setFont('helvetica', 'normal');
      
      let currentY = yPos + 2;
      
      // SEMPRE mostra acconti per resoconti finali
      if (resocontoDoc.type === 'resoconto_finale' && accontiFinali > 0) {
        docFacture.text('Total HT:', 120, currentY);
        docFacture.text(`${realMontantHT.toFixed(2)} CHF`, 195, currentY, { align: 'right' });
        currentY += 6;
        
        docFacture.setFont('helvetica', 'bold');
        docFacture.text('Acomptes HT:', 120, currentY);
        docFacture.text(`-${accontiFinali.toFixed(2)} CHF`, 195, currentY, { align: 'right' });
        docFacture.setFont('helvetica', 'normal');
        currentY += 6;
        
        docFacture.setFont('helvetica', 'bold');
        docFacture.text('Montant net HT:', 120, currentY);
        docFacture.text(`${imponibileResiduoHT.toFixed(2)} CHF`, 195, currentY, { align: 'right' });
        docFacture.setFont('helvetica', 'normal');
        currentY += 6;
        
        docFacture.text(`TVA (${realTauxTVA}%):`, 120, currentY);
        docFacture.text(`${tvaResiduoHT.toFixed(2)} CHF`, 195, currentY, { align: 'right' });
        currentY += 8;
      } else {
        docFacture.text('Total HT:', 125, currentY);
        docFacture.text(`${realMontantHT.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
        currentY += 6;
        
        docFacture.text(`TVA (${realTauxTVA}%):`, 125, currentY);
        docFacture.text(`${realMontantTVA.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
        currentY += 8;
      }
      
      // Linea separatrice
      docFacture.setLineWidth(0.5);
      docFacture.line(120, currentY - 2, 195, currentY - 2);
      
      docFacture.setFont('helvetica', 'bold');
      docFacture.setFontSize(12);
      const labelFinal = (resocontoDoc.type === 'resoconto_finale' && accontiFinali > 0) ? 'SOLDE À PAYER:' : 'TOTAL TTC:';
      docFacture.text(labelFinal, 120, currentY + 4);
      docFacture.text(`${realMontantTTC.toFixed(2)} CHF`, 195, currentY + 4, { align: 'right' });
      
      // Conditions de paiement dinamiche
      let footerY = currentY + 20;
      
      // Se siamo troppo in basso, vai a nuova pagina
      if (footerY > 270) {
        docFacture.addPage();
        footerY = 20;
      }
      
      docFacture.setFont('helvetica', 'normal');
      docFacture.setFontSize(9);
      docFacture.setTextColor(100, 100, 100);
      
      // Estrai modalità di pagamento dalle notes
      const modalitaMatch = facture.notes?.match(/Conditions:\s*([^\n]+)/);
      const modalitaPagamento = modalitaMatch ? modalitaMatch[1].trim() : '30 jours net';
      
      docFacture.text(`Conditions de paiement: ${modalitaPagamento}`, 10, footerY);
      docFacture.text('Merci de votre confiance', 10, footerY + 10);
      
      // Salva documenti con nomi personalizzati
      const clientName = (facture.client_nom || chantier?.client || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
      const chantierName = (chantier?.nom || 'Chantier').replace(/[^a-zA-Z0-9]/g, '_');
      const numeroFacture = facture.numero || 'F000';
      const dataFacture = facture.date_facture?.replace(/-/g, '') || new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      docMetrees.save(`${numeroFacture}_${dataFacture}_${clientName}_${chantierName}_Metrees.pdf`);
      docFacture.save(`${numeroFacture}_${dataFacture}_${clientName}_${chantierName}.pdf`);
      
      alert('Deux documents générés:\n1. Métrées détaillées (pour technicien)\n2. Facture avec acomptes visibles (pour comptabilité)');
      return;
    }
    
    // FATTURA DA RESOCONTO PERCENTUALE
    if (resocontoDoc) {
      // Imposta detailResoconto per far funzionare calculateZoneMontant
      detailResoconto.value = resocontoDoc;
      
      // Per resoconti finali, calcola automaticamente gli acconti
      let accontiModalValue;
      if (resocontoDoc.type === 'resoconto_finale') {
        // Calcola automaticamente gli acconti per ogni zona
        accontiModalValue = Object.keys(resocontoDoc.avancementi || {}).reduce((sum, zone) => {
          return sum + getGiaFatturatoZona(zone);
        }, 0);
      } else {
        // Per resoconti percentuali usa il valore salvato
        accontiModalValue = Number(facture.acconti_precedenti || accontiPrecedentiResoconto.value || 0);
      }
      console.log('🔍 PDF - Acconti calcolati:', accontiModalValue);
      
      // DEBUG DEVIS NEL PDF
      console.log('🔍 PDF - Chantier:', chantier);
      console.log('🔍 PDF - ChantierDevis:', chantierDevis);
      console.log('🔍 PDF - Produits devis:', chantierDevis?.produits?.length || 0);
      if (chantierDevis?.produits) {
        console.log('🔍 PDF - Prime 3 prodotti:', chantierDevis.produits.slice(0, 3));
      }
      
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      
      // Header migliorato per fatture percentuali
      if (logo) doc.addImage(logo, 'JPEG', 15, 20, 70, 15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('DALLELEC Sarl - CHE-280.028.822', 195, 22, { align: 'right' });
      doc.text('Rue de Bourgogne 25', 195, 28, { align: 'right' });
      doc.text('1203 Genève', 195, 34, { align: 'right' });
      doc.text('IBAN: CH09 0027 9279 3507 4901 H', 195, 40, { align: 'right' });
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`FACTURE N. ${facture.numero}`, 15, 50);
      
      doc.setLineWidth(0.5);
      doc.line(15, 55, 195, 55);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let yInfo = 65;
      
      doc.text(`Date: ${formatDate(facture.date_facture)}`, 15, yInfo);
      if (periodoRef) {
        yInfo += 6;
        doc.text(periodoRef, 15, yInfo);
      }
      
      yInfo += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURÉ À:', 15, yInfo);
      yInfo += 6;
      doc.setFont('helvetica', 'normal');
      
      const clientData = clients.value.find(c => c.nom === nomeCliente);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      const maxWidth = 90;
      const clientLines = doc.splitTextToSize(nomeCliente, maxWidth);
      clientLines.forEach((line, index) => {
        doc.text(line, 15, yInfo + (index * 5));
      });
      yInfo += clientLines.length * 5;
      
      doc.setFont('helvetica', 'normal');
      
      if (clientData?.adresse) {
        doc.setFontSize(10);
        doc.text(clientData.adresse, 15, yInfo);
        yInfo += 5;
      }
      if (clientData?.ville) {
        doc.text(clientData.ville, 15, yInfo);
        yInfo += 5;
      }
      
      let yInfoRight = 67;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`CHANTIER N° ${chantier?.numero_cantiere || 'N/A'}`, 115, yInfoRight);
      yInfoRight += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`${nomeChantier}`, 115, yInfoRight);
      

      
      let yPos = Math.max(yInfo, yInfoRight) + 20;
      
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
        // CALCOLA IL TOTALE ZONA LORDO (senza remise)
        let totaleZonaLordo = 0;
        if (chantierDevis?.produits) {
          totaleZonaLordo = chantierDevis.produits
            .filter(p => p.zone === zona)
            .reduce((sum, p) => sum + Number(p.total || 0), 0);
        }
        
        const montantLordo = totaleZonaLordo * percentuale / 100;
        const remisePerc = chantierDevis?.remises || 0;
        
        // Calcola montant netto dopo remise
        let montantNetto = montantLordo;
        if (remisePerc > 0) {
          montantNetto = montantLordo * (1 - remisePerc / 100);
        }
        
        console.log(`📊 PDF - ${zona}: lordo=${montantLordo.toFixed(2)} CHF, remise=${remisePerc}%, netto=${montantNetto.toFixed(2)} CHF`);
        
        return [
          zona,
          `${percentuale}%`,
          `${montantLordo.toFixed(2)} CHF`,
          remisePerc > 0 ? `${remisePerc}%` : '-',
          `${montantNetto.toFixed(2)} CHF`
        ];
      });
      
      if (avancementData.length > 0) {
        autoTable(doc, {
          head: [['Zone', 'Avancement', 'Montant Brut', 'Remise', 'Montant Net HT']],
          body: avancementData,
          startY: yPos,
          theme: 'striped',
          headStyles: { 
            fillColor: [70, 130, 180], 
            textColor: 255,
            fontSize: 9
          },
          bodyStyles: { 
            fontSize: 8
          },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 25 },
            2: { cellWidth: 35 },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 35, fontStyle: 'bold' }
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
      
      // Sezione Acconti se presenti - MOLTO VISIBILE per resoconti finali
      if (accontiModalValue > 0) {
        // Verifica spazio per sezione acconti
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ACOMPTES PRÉCÉDENTS PAR ZONE', 10, yPos);
        yPos += 5;
        
        // Crea tabella con acconti per zona
        const accontiRows = [];
        Object.entries(accontiPerZona.value).forEach(([zone, importo]) => {
          if (importo > 0) {
            accontiRows.push([
              `Zone: ${zone}`,
              `-${Number(importo).toFixed(2)} CHF`
            ]);
          }
        });
        
        // Aggiungi riga totale
        accontiRows.push([
          { content: 'TOTAL ACOMPTES:', styles: { fontStyle: 'bold' } },
          { content: `-${accontiModalValue.toFixed(2)} CHF`, styles: { fontStyle: 'bold' } }
        ]);
        
        autoTable(doc, {
          head: [['Description', 'Montant HT']],
          body: accontiRows,
          startY: yPos,
          theme: 'grid',
          headStyles: { 
            fillColor: [70, 130, 180], 
            textColor: 255, 
            fontSize: 10 
          },
          bodyStyles: { 
            fontSize: 10, 
            fillColor: [255, 240, 240]
          }
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
      }
      
      // Aggiungi più spazio prima dei totali
      yPos += 25;
      const spazioRimanente = 200 - yPos;
      if (spazioRimanente > 60) {
        yPos += Math.floor(spazioRimanente * 0.3);
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
      
      // Sposta i totali più in basso se c'è spazio
      const spazioDisponibile = 250 - yPos;
      if (spazioDisponibile > 80) {
        yPos += Math.min(spazioDisponibile - 60, 50); // Aggiungi spazio ma non troppo
      }
      
      // Verifica spazio per footer
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Conditions de paiement dinamiche
      let footerY = yPos + 35;
      
      // Se siamo troppo in basso, vai a nuova pagina
      if (footerY > 270) {
        doc.addPage();
        footerY = 20;
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      
      // Estrai modalità di pagamento dalle notes
      const modalitaMatch = facture.notes?.match(/Conditions:\s*([^\n]+)/);
      const modalitaPagamento = modalitaMatch ? modalitaMatch[1].trim() : '30 jours net';
      
      doc.text(`Conditions de paiement: ${modalitaPagamento}`, 15, footerY);
      doc.setFontSize(9);
      doc.text('Merci de votre confiance', 15, footerY + 8);
      
      // Numerazione pagine
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} sur ${totalPages}`, 190, 290, { align: 'right' });
      }
      
      // Nome PDF: NumeroFacture_DataFacture_Cliente_Cantiere
      const clientName = (facture.client_nom || chantier?.client || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
      const chantierName = (chantier?.nom || 'Chantier').replace(/[^a-zA-Z0-9]/g, '_');
      const numeroFacture = facture.numero || 'F000';
      const dataFacture = facture.date_facture?.replace(/-/g, '') || new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      doc.save(`${numeroFacture}_${dataFacture}_${clientName}_${chantierName}.pdf`);
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
    
    // Totali finali con box - CORRETTO
    const realMontantHT = totalFactureHT; // USA SEMPRE IL TOTALE CALCOLATO (produits + régies)
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
    
    // Box per i totali ottimizzato
    const boxHeight = accontiHT > 0 ? 50 : 30;
    docFacture.setFillColor(245, 245, 245);
    docFacture.rect(115, yPos - 5, 85, boxHeight, 'F');
    docFacture.setDrawColor(200, 200, 200);
    docFacture.rect(115, yPos - 5, 85, boxHeight);
    
    docFacture.setFontSize(10);
    docFacture.setFont('helvetica', 'normal');
    
    let currentY = yPos + 2;
    
    // Se non ci sono acconti, mostra il calcolo normale
    if (accontiHT === 0) {
      docFacture.text('Total HT:', 125, currentY);
      docFacture.text(`${realMontantHT.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
      currentY += 6;
      
      docFacture.text(`TVA (${realTauxTVA}%):`, 125, currentY);
      docFacture.text(`${realMontantTVA.toFixed(2)} CHF`, 190, currentY, { align: 'right' });
      currentY += 8;
    }
    
    // Se ci sono acconti precedenti, mostrali
    if (accontiHT > 0) {
      docFacture.text('Total HT:', 120, currentY);
      docFacture.text(`${realMontantHT.toFixed(2)} CHF`, 195, currentY, { align: 'right' });
      currentY += 6;
      
      docFacture.setTextColor(200, 0, 0);
      docFacture.text('Acomptes HT:', 120, currentY);
      docFacture.text(`-${accontiHT.toFixed(2)} CHF`, 195, currentY, { align: 'right' });
      docFacture.setTextColor(0, 0, 0);
      currentY += 6;
      
      docFacture.setFont('helvetica', 'bold');
      docFacture.text('Montant net HT:', 120, currentY);
      docFacture.text(`${imponibileResiduoHT.toFixed(2)} CHF`, 195, currentY, { align: 'right' });
      docFacture.setFont('helvetica', 'normal');
      currentY += 6;
      
      docFacture.text(`TVA (${realTauxTVA}%):`, 120, currentY);
      docFacture.text(`${tvaResiduoHT.toFixed(2)} CHF`, 195, currentY, { align: 'right' });
      currentY += 8;
    }
    
    // Linea separatrice
    docFacture.setLineWidth(0.5);
    docFacture.line(120, currentY - 2, 195, currentY - 2);
    
    docFacture.setFont('helvetica', 'bold');
    docFacture.setFontSize(12);
    const labelFinal = accontiHT > 0 ? 'SOLDE À PAYER:' : 'TOTAL TTC:';
    docFacture.text(labelFinal, 120, currentY + 4);
    docFacture.text(`${realMontantTTC.toFixed(2)} CHF`, 195, currentY + 4, { align: 'right' });
    
    // Conditions de paiement in fondo alla pagina
    docFacture.setFont('helvetica', 'normal');
    docFacture.setFontSize(9);
    docFacture.setTextColor(100, 100, 100);
    
    // Estrai modalità di pagamento dalle notes
    const modalitaMatch = facture.notes?.match(/Conditions:\s*([^\n]+)/);
    const modalitaPagamento = modalitaMatch ? modalitaMatch[1].trim() : '30 jours net';
    
    docFacture.text(`Conditions de paiement: ${modalitaPagamento}`, 10, 270);
    docFacture.text('Merci de votre confiance', 10, 280);
    
    // Footer rimosso - dati già nell'header
    
    // Salva documenti con nomi personalizzati: NumeroFacture_DataFacture_Cliente_Cantiere
    const clientName = (facture.client_nom || chantier?.client || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    const chantierName = (chantier?.nom || 'Chantier').replace(/[^a-zA-Z0-9]/g, '_');
    const numeroFacture = facture.numero || 'F000';
    const dataFacture = facture.date_facture?.replace(/-/g, '') || new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    docMetrees.save(`${numeroFacture}_${dataFacture}_${clientName}_${chantierName}_Metrees.pdf`);
    docFacture.save(`${numeroFacture}_${dataFacture}_${clientName}_${chantierName}.pdf`);
    
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

const voirAnteprimaFacture = (facture) => {
  factureAnteprima.value = facture;
  showAnteprimaFacture.value = true;
};

const calculateTVAFacture = (facture) => {
  const montantHT = Number(facture.montant_ht || 0);
  const acconti = Number(facture.acconti_precedenti || 0);
  const imponibileResiduo = montantHT - acconti;
  const tauxTVA = Number(facture.taux_tva || 8.1) / 100;
  return imponibileResiduo * tauxTVA;
};

const calculateTotalFacture = (facture) => {
  const montantHT = Number(facture.montant_ht || 0);
  const acconti = Number(facture.acconti_precedenti || 0);
  const imponibileResiduo = montantHT - acconti;
  const tva = calculateTVAFacture(facture);
  return imponibileResiduo + tva;
};

const getResocontoDetails = (resocontoId) => {
  return resocontiPercentuali.value.find(r => r.id === resocontoId);
};

const getMetrageDetails = (metrageId) => {
  return metrages.value.find(m => m.id === metrageId);
};

const calculateZoneMontantSenzaRemiseAnteprima = (zone, percentage, chantierId) => {
  const chantier = chantiers.value.find(c => c.id == chantierId);
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  
  if (!chantierDevis) return 0;
  
  if (chantierDevis.modalita_prezzi === 'aCorps') {
    const montantCorps = Number(chantierDevis.montant_corps || 0);
    const numeroZone = chantierDevis.zones?.length || 1;
    const montantPerZona = montantCorps / numeroZone;
    return montantPerZona * percentage / 100;
  }
  
  if (!chantierDevis.produits) return 0;
  
  const totaleZona = chantierDevis.produits
    .filter(p => p.zone === zone)
    .reduce((sum, p) => sum + Number(p.total || 0), 0);
  
  return totaleZona * percentage / 100;
};

const getRemiseDevisAnteprima = (chantierId) => {
  const chantier = chantiers.value.find(c => c.id == chantierId);
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  return chantierDevis?.remises || 0;
};

const calculateZoneMontantAnteprima = (zone, percentage, chantierId) => {
  const chantier = chantiers.value.find(c => c.id == chantierId);
  const chantierDevis = devis.value.find(d => d.id == chantier?.devis_id);
  
  if (!chantierDevis) return 0;
  
  // Per devis à corps, usa il montant forfaitaire diviso per le zone
  if (chantierDevis.modalita_prezzi === 'aCorps') {
    const montantCorps = Number(chantierDevis.montant_corps || 0);
    const numeroZone = chantierDevis.zones?.length || 1;
    let montantPerZona = montantCorps / numeroZone;
    
    // Applica remise supplémentaire se presente
    if (chantierDevis.remises && chantierDevis.remises > 0) {
      montantPerZona = montantPerZona * (1 - chantierDevis.remises / 100);
    }
    
    return montantPerZona * percentage / 100;
  }
  
  // Per devis détaillé, usa i prodotti
  if (!chantierDevis.produits) return 0;
  
  let totaleZona = chantierDevis.produits
    .filter(p => p.zone === zone)
    .reduce((sum, p) => sum + Number(p.total || 0), 0);
  
  // Applica remise supplémentaire se presente
  if (chantierDevis.remises && chantierDevis.remises > 0) {
    totaleZona = totaleZona * (1 - chantierDevis.remises / 100);
  }
  
  return totaleZona * percentage / 100;
};

const resetFiltres = () => {
  filtreClient.value = '';
  filtreStatut.value = '';
};

const getUltimaDataFactura = async () => {
  try {
    const { data, error } = await supabase
      .from('factures')
      .select('date_facture')
      .order('date_facture', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data?.[0]?.date_facture || null;
  } catch (error) {
    console.error('Erreur récupération dernière date facture:', error);
    return null;
  }
};

const confermaDataPersonnalisee = () => {
  showDatePersonnalisee.value = false;
};

const annullaDataPersonnalisee = () => {
  showDatePersonnalisee.value = false;
  dateFacturePersonnalisee.value = '';
};

const riaprireResoconto = (facture) => {
  factureRiapertura.value = facture;
  motivoCorrezione.value = '';
  showRiaperturaResoconto.value = true;
};

const confermaRiapertura = async () => {
  if (!motivoCorrezione.value.trim()) {
    alert('Veuillez insérer le motif de la correction');
    return;
  }
  
  try {
    const facture = factureRiapertura.value;
    const numeroFactureOriginale = facture.numero;
    
    // 1. Salva il numero fattura nel resoconto per mantenerlo
    await supabase
      .from('resoconti_percentuali')
      .update({
        status: 'correction_needed',
        correction_reason: motivoCorrezione.value,
        numero_fattura_riservato: numeroFactureOriginale
      })
      .eq('id', facture.resoconto_id);
    
    // 2. Elimina la fattura
    await supabase
      .from('factures')
      .delete()
      .eq('id', facture.id);
    
    alert(`Rapport rouvert pour correction.\nLe chef pourra le modifier et la nouvelle facture gardera le numéro ${numeroFactureOriginale}`);
    
    showRiaperturaResoconto.value = false;
    loadData();
  } catch (error) {
    console.error('Errore riapertura:', error);
    alert('Errore: ' + error.message);
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
