<template>
  <div class="container py-4">
    <RetourButton to="/chef" />

    <h2 class="text-center mb-4">Rapport Final de Zone</h2>

    <!-- Selezione cantiere e zona -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Sélectionner chantier</h5>
          </div>
          <div class="card-body">
            <select v-model="selectedChantierId" class="form-control" @change="loadChantierData">
              <option value="">Choisir un chantier ({{ chantiers.length }} disponibles)</option>
              <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                {{ chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '' }}{{ chantier.nom }}
              </option>
            </select>
            <small class="text-muted mt-1 d-block" v-if="chantiers.length === 0">
              Aucun chantier assigné à {{ user?.email }}
            </small>
          </div>
        </div>
      </div>
      <div class="col-md-6" v-if="zones.length > 0">
        <div class="card">
          <div class="card-header">
            <h5>Sélectionner zone à finaliser</h5>
          </div>
          <div class="card-body">
            <select v-model="selectedZone" class="form-control" @change="loadZoneData">
              <option value="">Choisir une zone</option>
              <option v-for="zone in zones" :key="zone" :value="zone">
                {{ zone }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Riepilogo situazione zona -->
    <div v-if="selectedZone" class="card mb-4">
      <div class="card-header bg-info text-white">
        <h5>📊 Zone: {{ selectedZone }}</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h6>📋 Quantités prévues (devis)</h6>
            <div class="alert alert-primary">
              <strong>{{ totalMLPreviste.toFixed(2) }} ML</strong>
            </div>
          </div>
          <div class="col-md-6">
            <h6>📏 Quantités réelles posées</h6>
            <div class="alert alert-success">
              <strong>{{ totalMLReelles.toFixed(2) }} ML</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form quantità reali -->
    <div v-if="selectedZone && prodottiZona.length > 0" class="card mb-4">
      <div class="card-header">
        <h5>📏 Quantités réelles posées</h5>
      </div>
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Taille</th>
              <th>ML Prévues</th>
              <th>ML Posées</th>
              <th>Suppléments</th>
              <th>Total ML</th>
              <th>Différence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(prodotto, index) in prodottiZona" :key="index">
              <td>{{ prodotto.nom }}</td>
              <td>{{ prodotto.taille }}</td>
              <td>{{ prodotto.ml || 0 }}</td>
              <td>
                <input 
                  type="number" 
                  :value="prodotto.mlReali"
                  class="form-control" 
                  step="0.1"
                  @input="(e) => { prodotto.mlReali = Number(e.target.value); prodotto.totalML = prodotto.mlReali; }"
                />
              </td>
              <td>
                <div v-for="supp in supplementsDisponibili" :key="supp.id" class="d-flex align-items-center mb-1">
                  <input 
                    type="checkbox" 
                    :value="supp.nom" 
                    v-model="prodotto.supplementiSelezionati" 
                    class="form-check-input me-1"
                    @change="updateSupplementi(index)"
                  >
                  <span class="me-1 small">{{ supp.nom }}</span>
                  <input
                    v-if="prodotto.supplementiSelezionati && prodotto.supplementiSelezionati.includes(supp.nom)"
                    type="number"
                    class="form-control form-control-sm"
                    style="width: 60px;"
                    v-model.number="prodotto.quantitaSupplementi[supp.nom]"
                    min="0"
                    placeholder="Qté"
                    @input="updateSupplementi(index)"
                    @change="updateSupplementi(index)"
                    @keyup="updateSupplementi(index)"
                  >
                </div>
              </td>
              <td><strong>{{ ((prodotto.totalML || 0) > 0 ? prodotto.totalML : (prodotto.mlReali || 0)).toFixed(2) }}</strong></td>
              <td>
                <span :class="getDifferenzaClass(prodotto)">
                  {{ ((prodotto.totalML || prodotto.mlReali || 0) - (prodotto.ml || 0)).toFixed(1) }}
                </span>
              </td>

            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Form modifica supplementi -->
    <div v-if="prodottoInModifica" class="card mb-4 border-warning">
      <div class="card-header bg-warning">
        <h5>✎️ Modifier Suppléments: {{ prodottoInModifica.nom }} {{ prodottoInModifica.taille }}</h5>
      </div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-md-3">
            <label>ML Posées:</label>
            <input v-model.number="prodottoInModifica.mlReali" type="number" step="0.1" class="form-control">
          </div>
        </div>
        
        <div class="row mb-3">
          <div class="col-12">
            <label>Suppléments:</label>
            <div class="alert alert-light mb-2">
              <small><strong>Debug:</strong> Supplementi disponibili: {{ supplementsDisponibili.length }} | Selezionati: {{ supplementiSelezionati.length }} | Quantità: {{ Object.keys(quantitaSupplementi).length }}</small>
            </div>
            <div v-for="supp in supplementsDisponibili" :key="supp.id" class="d-flex align-items-center mb-1">
              <input 
                type="checkbox" 
                :value="supp.nom" 
                v-model="supplementiSelezionati" 
                class="form-check-input me-2"
                @change="forceUpdate"
              >
              <span class="me-2">{{ supp.nom }} ({{ supp.valeur }}m)</span>
              <input
                v-show="supplementiSelezionati.includes(supp.nom)"
                type="number"
                class="form-control form-control-sm w-25"
                v-model.number="quantitaSupplementi[supp.nom]"
                min="0"
                placeholder="Qté"
                style="display: inline-block !important;"
              >
              <span v-if="supplementiSelezionati.includes(supp.nom) && quantitaSupplementi[supp.nom]" class="ms-1 text-muted small">
                = {{ (quantitaSupplementi[supp.nom] * supp.valeur).toFixed(2) }}m
              </span>
            </div>
          </div>
        </div>
        
        <div class="text-end">
          <button @click="annullaModifica" class="btn btn-secondary me-2">❌ Annuler</button>
          <button @click="salvaModificaSupplementi" class="btn btn-success">✅ Sauvegarder</button>
        </div>
      </div>
    </div>

    <!-- Sezione Regie -->
    <div v-if="selectedZone" class="card mb-4">
      <div class="card-header">
        <h5>⏰ Régies (Heures supplémentaires)</h5>
      </div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-md-2">
            <label>Heures:</label>
            <input v-model.number="nouvelleRegie.heures" type="number" step="0.5" class="form-control" placeholder="2.0">
          </div>
          <div class="col-md-4">
            <label>Description travail:</label>
            <input v-model="nouvelleRegie.description" type="text" class="form-control" placeholder="Modification installation...">
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button @click="ajouterRegie" class="btn btn-success w-100" :disabled="!regieValide">
              ➕ Ajouter
            </button>
          </div>
        </div>
        
        <table v-if="regies.length > 0" class="table table-sm">
          <thead>
            <tr>
              <th>Heures</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(regie, index) in regies" :key="index">
              <td>{{ regie.heures }}h</td>
              <td>{{ regie.description }}</td>
              <td>
                <button @click="supprimerRegie(index)" class="btn btn-sm btn-danger">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="regies.length > 0" class="text-end">
          <strong>Total Heures Régies: {{ totalHeuresRegies }}h</strong>
        </div>
      </div>
    </div>

    <!-- Supplementi aggiuntivi -->
    <div v-if="selectedZone" class="card mb-4">
      <div class="card-header">
        <h5>➕ Suppléments non prévus</h5>
      </div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-md-3">
            <input v-model="nuovoSupplemento.descrizione" class="form-control" placeholder="Description">
          </div>
          <div class="col-md-2">
            <input v-model.number="nuovoSupplemento.quantita" type="number" class="form-control" placeholder="Qté">
          </div>
          <div class="col-md-2">
            <input v-model.number="nuovoSupplemento.prezzo" type="number" class="form-control" placeholder="Prix">
          </div>
          <div class="col-md-2">
            <button @click="aggiungiSupplemento" class="btn btn-success">➕ Ajouter</button>
          </div>
        </div>
        
        <table v-if="supplementiAggiuntivi.length > 0" class="table table-sm">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantité</th>
              <th>Prix Unit.</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(supp, index) in supplementiAggiuntivi" :key="index">
              <td>{{ supp.descrizione }}</td>
              <td>{{ supp.quantita }}</td>
              <td>{{ supp.prezzo.toFixed(2) }}</td>
              <td>{{ (supp.quantita * supp.prezzo).toFixed(2) }} CHF</td>
              <td>
                <button @click="rimuoviSupplemento(index)" class="btn btn-sm btn-danger">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Riepilogo finale quantità -->
    <div v-if="selectedZone" class="card mb-4">
      <div class="card-header bg-success text-white">
        <h5>📋 Résumé des Quantités</h5>
      </div>
      <div class="card-body">
        <table class="table">
          <tbody>
            <tr>
              <td><strong>Total ML prévues</strong></td>
              <td class="text-end"><strong>{{ totalMLPreviste.toFixed(2) }} ML</strong></td>
            </tr>
            <tr>
              <td><strong>Total ML réelles posées</strong></td>
              <td class="text-end"><strong>{{ totalMLReelles.toFixed(2) }} ML</strong></td>
            </tr>
            <tr class="table-active">
              <td><strong>DIFFÉRENCE</strong></td>
              <td class="text-end" :class="differenceMLClass">
                <strong>{{ (totalMLReelles - totalMLPreviste).toFixed(2) }} ML</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>



    <!-- Azioni -->
    <div v-if="selectedZone" class="text-center">
      <button @click="salvaResocontoFinale" class="btn btn-success">
        💾 Sauvegarder et envoyer pour approbation
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import { useAuth } from '@/composables/useAuth';
import RetourButton from '@/components/RetourButton.vue';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '@/assets/logo.jpg';

const router = useRouter();
const { user } = useAuth();
const chantiers = ref([]);
const selectedChantierId = ref('');
const selectedZone = ref('');
const zones = ref([]);
const prodottiZona = ref([]);
const resocontiPercentuali = ref([]);
const devisData = ref(null);
const supplementiAggiuntivi = ref([]);
const nuovoSupplemento = ref({
  descrizione: '',
  quantita: 0,
  prezzo: 0
});
const accontiPrecedenti = ref(0);
const numeroDevis = ref('');
const nomClient = ref('');
const nomChantier = ref('');
const regies = ref([]);
const prixRegieChantier = ref(75);
const nouvelleRegie = ref({
  heures: 0,
  description: ''
});
const supplementsDisponibili = ref([]);
const prodottoInModifica = ref(null);
const supplementiSelezionati = ref([]);
const quantitaSupplementi = ref({});

// Computed per calcoli
const zonesCompletees = computed(() => {
  return zones.value.filter(zona => getPercentualeFatturata(zona) > 0);
});

const percentualeFatturata = computed(() => {
  return getPercentualeFatturata(selectedZone.value);
});

const totalMLPreviste = computed(() => {
  return prodottiZona.value.reduce((sum, p) => sum + (p.ml || 0), 0);
});

const totalMLReelles = computed(() => {
  return prodottiZona.value.reduce((sum, p) => sum + (p.mlReali || 0), 0);
});

const differenceMLClass = computed(() => {
  const diff = totalMLReelles.value - totalMLPreviste.value;
  return diff >= 0 ? 'text-success' : 'text-danger';
});

const regieValide = computed(() => {
  return nouvelleRegie.value.heures > 0 && nouvelleRegie.value.description.trim();
});

const totalHeuresRegies = computed(() => {
  return regies.value.reduce((sum, r) => sum + r.heures, 0);
});

const totalMontantRegies = computed(() => {
  return regies.value.reduce((sum, r) => sum + (r.heures * r.prixHeure), 0);
});

const importoPrevisto = computed(() => {
  return prodottiZona.value.reduce((sum, p) => sum + ((p.ml || 0) * (p.prix || 0)), 0);
});

const importoFatturato = computed(() => {
  // SOLO percentuale prodotti, ESCLUSE le regie
  return (importoPrevisto.value * percentualeFatturata.value) / 100;
});

const importoRegieFatturate = computed(() => {
  // Calcola regie già fatturate per questa zona
  if (!selectedZone.value) return 0;
  
  return resocontiPercentuali.value
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => {
      if (!r.regies) return sum;
      return sum + r.regies
        .filter(regie => regie.zone === selectedZone.value)
        .reduce((regieSum, regie) => regieSum + (regie.heures * (regie.prixHeure || 75)), 0);
    }, 0);
});

const variazioniQuantita = computed(() => {
  return prodottiZona.value.reduce((sum, p) => {
    const diff = (p.mlReali || 0) - (p.ml || 0);
    return sum + (diff * (p.prix || 0));
  }, 0);
});

const totalSupplementi = computed(() => {
  return supplementiAggiuntivi.value.reduce((sum, s) => sum + (s.quantita * (s.prezzo || 0)), 0);
});

const conguaglioFinale = computed(() => {
  return variazioniQuantita.value + totalSupplementi.value + totalMontantRegies.value;
});

const differenzaImporto = computed(() => {
  const realeFinale = importoFatturato.value + conguaglioFinale.value;
  return realeFinale - importoFatturato.value;
});

// Classes per colori
const differenzaClass = computed(() => {
  return differenzaImporto.value >= 0 ? 'alert-warning' : 'alert-info';
});

const variazioniQuantitaClass = computed(() => {
  return variazioniQuantita.value >= 0 ? 'text-success' : 'text-danger';
});

const congualioClass = computed(() => {
  return conguaglioFinale.value >= 0 ? 'text-success' : 'text-danger';
});

// Methods
const fetchChantiers = async () => {
  const userEmail = localStorage.getItem('userEmail');
  console.log('🔍 UserEmail:', userEmail);
  
  if (!userEmail) {
    console.warn('Utente non autenticato');
    return;
  }
  
  try {
    // Trova il chef dalla tabella chefdechantiers
    const { data: chefData, error: chefError } = await supabase
      .from('chefdechantiers')
      .select('nom, prenom')
      .eq('email', userEmail)
      .single();
    
    if (chefError || !chefData) {
      console.error('❌ Chef non trovato');
      chantiers.value = [];
      return;
    }
    
    const nomeCompleto1 = `${chefData.nom} ${chefData.prenom}`; // Maggi Daniele
    const nomeCompleto2 = `${chefData.prenom} ${chefData.nom}`; // Daniele Maggi
    
    console.log('🔍 Cercando cantieri per:', { userEmail, nomeCompleto1, nomeCompleto2 });
    
    // Cerca cantieri per email o entrambi i formati nome
    const { data, error } = await supabase
      .from('chantiers')
      .select('*')
      .or(`capocantiere.eq.${userEmail},capocantiere.eq.${nomeCompleto1},capocantiere.eq.${nomeCompleto2}`);
    
    if (error) throw error;
    
    console.log('✅ Cantieri trovati:', data?.length || 0);
    chantiers.value = data || [];
    
  } catch (error) {
    console.error('❌ Errore:', error);
    chantiers.value = [];
  }
};

const loadChantierData = async () => {
  if (!selectedChantierId.value) {
    zones.value = [];
    selectedZone.value = '';
    return;
  }
  
  try {
    // Trova il cantiere selezionato
    const chantier = chantiers.value.find(c => String(c.id) === String(selectedChantierId.value));
    
    // Usa gruppo_devis_id se disponibile, altrimenti fallback a devis_id singolo
    const gruppoDevisId = chantier?.gruppo_devis_id;
    const devisId = chantier?.devis_id || chantier?.devisId;
    
    console.log('🔍 Cantiere e gruppo devis:', {
      cantiere: chantier.nom,
      gruppoDevisId: gruppoDevisId,
      devisId: devisId
    });
    
    let allDevisStessoCantiere = [];
    let devisError = null;
    
    if (gruppoDevisId) {
      // Nuova logica: cerca tutti i devis del gruppo
      console.log('🆕 Usando gruppo_devis_id:', gruppoDevisId);
      const result = await supabase
        .from('devis')
        .select('*')
        .eq('gruppo_devis_id', gruppoDevisId);
      
      allDevisStessoCantiere = result.data || [];
      devisError = result.error;
    } else if (devisId) {
      // Logica vecchia: carica singolo devis
      console.log('🔄 Fallback a devis_id:', devisId);
      const result = await supabase
        .from('devis')
        .select('*')
        .eq('id', devisId)
        .single();
      
      allDevisStessoCantiere = result.data ? [result.data] : [];
      devisError = result.error;
    }
    
    if (devisError || !allDevisStessoCantiere || allDevisStessoCantiere.length === 0) {
      console.error('Errore caricamento devis:', devisError);
      alert('Aucun devis trouvé pour ce chantier');
      return;
    }
    
    console.log(`📋 Trovati ${allDevisStessoCantiere.length} devis per il cantiere`);
    allDevisStessoCantiere.forEach((d, i) => {
      console.log(`Devis ${i+1}: ${d.numero} - Prodotti: ${d.produits?.length || 0}`);
    });
    
    console.log('🏗️ Cantiere selezionato:', chantier);
    
    // Combina tutti i devis in uno unico
    const devisCombinato = {
      numero: allDevisStessoCantiere.map(d => d.numero).join(', '),
      nom: allDevisStessoCantiere[0].nom,
      produits: []
    };
    
    // Mappa per sommare prodotti uguali
    const prodottiMap = new Map();
    
    allDevisStessoCantiere.forEach(devis => {
      if (devis.produits && Array.isArray(devis.produits)) {
        devis.produits.forEach(prodotto => {
          const key = `${prodotto.zone}-${prodotto.article}-${prodotto.nom}-${prodotto.taille}`;
          
          if (prodottiMap.has(key)) {
            // Somma le quantità
            const existing = prodottiMap.get(key);
            existing.ml = (existing.ml || 0) + (prodotto.ml || 0);
            existing.mlReali = existing.ml;
          } else {
            // Nuovo prodotto
            prodottiMap.set(key, {
              ...prodotto,
              mlReali: prodotto.ml
            });
          }
        });
      }
    });
    
    devisCombinato.produits = Array.from(prodottiMap.values());
    
    // Usa il devis combinato
    devisData.value = devisCombinato;
    numeroDevis.value = devisCombinato.numero;
    nomClient.value = devisCombinato.nom || '';
    
    const numeroDisplay = chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '';
    nomChantier.value = `${numeroDisplay}${chantier.nom} - ${chantier.adresse}`;
    
    // Estrai le zone dai prodotti combinati
    if (devisCombinato.produits && devisCombinato.produits.length > 0) {
      const zoneSet = new Set();
      devisCombinato.produits.forEach(produit => {
        if (produit.zone) {
          zoneSet.add(produit.zone);
        }
      });
      zones.value = Array.from(zoneSet).sort();
      console.log('✅ Zone caricate da multipli devis:', zones.value);
      console.log('📦 Prodotti combinati:', devisCombinato.produits.length);
    } else {
      zones.value = [];
      console.log('⚠️ Nessuna zona trovata nei devis');
    }
    
    // Carica resoconti percentuali per tutti i devis
    const { data: resocontiData, error: resocontiError } = await supabase
      .from('resoconti_percentuali')
      .select('*')
      .eq('chantier_id', selectedChantierId.value)
      .eq('status', 'approved');
    
    if (resocontiError) {
      console.error('Errore caricamento resoconti:', resocontiError);
    } else {
      resocontiPercentuali.value = resocontiData || [];
      console.log('📊 Resoconti percentuali caricati:', resocontiPercentuali.value.length);
    }
    
  } catch (error) {
    console.error('❌ Errore generale loadChantierData:', error);
    alert('Erreur lors du chargement: ' + error.message);
  }
};

const loadZoneData = () => {
  if (!selectedZone.value || !devisData.value) {
    console.warn('⚠️ Zona o devis mancanti:', { zona: selectedZone.value, devis: !!devisData.value });
    return;
  }
  
  console.log('🔍 Caricamento dati zona:', selectedZone.value);
  console.log('📦 Prodotti totali nel devis:', devisData.value.produits?.length || 0);
  
  // Filtra prodotti della zona selezionata
  const prodottiFiltrati = devisData.value.produits?.filter(p => {
    console.log(`Prodotto: ${p.nom} - Zona: "${p.zone}" vs "${selectedZone.value}"`);
    return p.zone === selectedZone.value;
  }) || [];
  
  console.log('✅ Prodotti trovati per la zona:', prodottiFiltrati.length);
  
  prodottiZona.value = prodottiFiltrati.map(p => ({
    ...p, 
    mlReali: p.ml,
    supplementiSelezionati: [],
    quantitaSupplementi: {},
    totalML: p.ml
  }));
  
  supplementiAggiuntivi.value = [];
  regies.value = [];
  calcolaImpatti();
};

const getPercentualeFatturata = (zona) => {
  if (!zona) return 0;
  return resocontiPercentuali.value
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => {
      return sum + (r.avancementi?.[zona] || 0);
    }, 0);
};

const calcolaImpatti = () => {
  // Ricalcola totalML per ogni prodotto
  prodottiZona.value.forEach(prodotto => {
    let totalSuppML = 0;
    if (prodotto.supplementiSelezionati && prodotto.quantitaSupplementi) {
      prodotto.supplementiSelezionati.forEach(suppNom => {
        const qte = prodotto.quantitaSupplementi[suppNom] || 0;
        const supp = supplementsDisponibili.value.find(s => s.nom === suppNom);
        const valeur = supp?.valeur || 1;
        totalSuppML += qte * valeur;
      });
    }
    prodotto.totalML = (prodotto.mlReali || 0) + totalSuppML;
  });
};

const calcolaImpattoProdotto = (prodotto) => {
  const diff = (prodotto.mlReali || 0) - (prodotto.ml || 0);
  return diff * (prodotto.prix || 0);
};

const getDifferenzaClass = (prodotto) => {
  const diff = (prodotto.mlReali || 0) - (prodotto.ml || 0);
  return diff >= 0 ? 'text-success' : 'text-danger';
};

const getImpactClass = (prodotto) => {
  const impact = calcolaImpattoProdotto(prodotto);
  return impact >= 0 ? 'text-success' : 'text-danger';
};

const aggiungiSupplemento = () => {
  if (nuovoSupplemento.value.descrizione && nuovoSupplemento.value.quantita > 0 && nuovoSupplemento.value.prezzo > 0) {
    supplementiAggiuntivi.value.push({ ...nuovoSupplemento.value });
    nuovoSupplemento.value = { descrizione: '', quantita: 0, prezzo: 0 };
  }
};

const rimuoviSupplemento = (index) => {
  supplementiAggiuntivi.value.splice(index, 1);
};

const ajouterRegie = () => {
  if (!regieValide.value) return;
  
  const nouvelleRegieItem = {
    heures: nouvelleRegie.value.heures,
    prixHeure: prixRegieChantier.value,
    description: nouvelleRegie.value.description
  };
  
  regies.value.push(nouvelleRegieItem);
  
  // Reset form
  nouvelleRegie.value = {
    heures: 0,
    description: ''
  };
};

const supprimerRegie = (index) => {
  regies.value.splice(index, 1);
};

const modificaProdotto = (index) => {
  const prodotto = prodottiZona.value[index];
  console.log('🔧 Modificando prodotto:', prodotto);
  console.log('📋 Supplementi disponibili totali:', supplementsDisponibili.value.length);
  
  prodottoInModifica.value = { ...prodotto, index };
  
  // Reset e carica supplementi esistenti
  supplementiSelezionati.value = [];
  quantitaSupplementi.value = {};
  
  // Inizializza quantità per tutti i supplementi disponibili
  supplementsDisponibili.value.forEach(supp => {
    quantitaSupplementi.value[supp.nom] = 0;
  });
  
  // Carica supplementi esistenti del prodotto
  if (prodotto.supplements && Array.isArray(prodotto.supplements)) {
    console.log('📦 Supplementi esistenti prodotto:', prodotto.supplements);
    prodotto.supplements.forEach(s => {
      supplementiSelezionati.value.push(s.supplement);
      quantitaSupplementi.value[s.supplement] = s.qtePosee || 0;
    });
  }
  
  console.log('✅ Supplementi selezionati:', supplementiSelezionati.value);
  console.log('🔢 Quantità inizializzate:', quantitaSupplementi.value);
};



const updateSupplementi = (index) => {
  const prodotto = prodottiZona.value[index];
  
  // Calcola total ML supplementi
  let totalSuppML = 0;
  if (prodotto.supplementiSelezionati) {
    prodotto.supplementiSelezionati.forEach(suppNom => {
      const qte = prodotto.quantitaSupplementi[suppNom] || 0;
      const supp = supplementsDisponibili.value.find(s => s.nom === suppNom);
      const valeur = supp?.valeur || 1;
      totalSuppML += qte * valeur;
    });
  }
  
  // Aggiorna total ML
  prodotto.totalML = (prodotto.mlReali || 0) + totalSuppML;
};

const annullaModifica = () => {
  prodottoInModifica.value = null;
  supplementiSelezionati.value = [];
  quantitaSupplementi.value = {};
};

const salvaModificaSupplementi = () => {
  if (!prodottoInModifica.value) return;
  
  const index = prodottoInModifica.value.index;
  const prodotto = prodottiZona.value[index];
  
  // Crea array supplementi
  const supplementDetails = supplementiSelezionati.value.map(nom => {
    const supp = supplementsDisponibili.value.find(s => s.nom === nom);
    const qtePosee = quantitaSupplementi.value[nom] || 0;
    return {
      supplement: nom,
      valeur: supp?.valeur || 1,
      qtePosee,
      totalML: qtePosee * (supp?.valeur || 1)
    };
  });
  
  const totalSuppML = supplementDetails.reduce((sum, s) => sum + (s.totalML || 0), 0);
  
  // Aggiorna prodotto
  prodotto.mlReali = prodottoInModifica.value.mlReali;
  prodotto.supplements = supplementDetails;
  prodotto.totalSuppML = totalSuppML;
  prodotto.totalML = (prodotto.mlReali || 0) + totalSuppML;
  
  annullaModifica();
  calcolaImpatti();
};

const fetchSupplements = async () => {
  try {
    const { data, error } = await supabase
      .from('supplements')
      .select('*')
      .order('ordre');
    
    if (error) throw error;
    
    supplementsDisponibili.value = (data || []).map(item => ({
      id: item.id,
      nom: item.nom,
      valeur: item.valeur || 1,
      ordre: item.ordre || 0
    }));
    
    console.log('📋 Supplementi caricati dal DB:', supplementsDisponibili.value);
  } catch (error) {
    console.log('❌ Errore caricamento supplementi:', error);
    supplementsDisponibili.value = [];
  }
};

const salvaResocontoFinale = async () => {
  if (!selectedChantierId.value || !selectedZone.value) {
    alert('Sélectionner chantier et zone');
    return;
  }
  
  try {
    const resocontoData = {
      chantier_id: selectedChantierId.value,
      periode_month: new Date().toISOString().slice(0, 7),
      avancementi: { [selectedZone.value]: 100 },
      prodotti_reali: prodottiZona.value,
      regies: regies.value,
      supplementi_aggiuntivi: supplementiAggiuntivi.value,
      total_ml_previste: totalMLPreviste.value,
      total_ml_reali: totalMLReelles.value,
      importo_fatturato_prodotti: importoFatturato.value,
      importo_regie_fatturate: importoRegieFatturate.value,
      variazioni_quantita: variazioniQuantita.value,
      conguaglio_finale: conguaglioFinale.value,
      acconti_precedenti: accontiPrecedenti.value || 0,
      descrizione: `Resoconto finale zona ${selectedZone.value} - ${prodottiZona.value.length} prodotti`,
      capocantiere: user.value?.email || localStorage.getItem('userEmail'),
      status: 'pending_approval',
      type: 'resoconto_finale',
      created_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('resoconti_percentuali')
      .insert([resocontoData]);
    
    if (error) throw error;
    
    alert('Resoconto finale inviato per approbazione admin!\nPuoi continuare a modificare se necessario.');
    
  } catch (error) {
    console.error('Errore salvataggio:', error);
    alert('Errore nel salvataggio: ' + error.message);
  }
};



onMounted(async () => {
  await fetchChantiers();
  await fetchSupplements();
  
  // Gestisci parametri URL
  const urlParams = new URLSearchParams(window.location.search);
  const chantierId = urlParams.get('chantier');
  const zone = urlParams.get('zone');
  
  if (chantierId) {
    selectedChantierId.value = chantierId;
    await loadChantierData();
    
    if (zone) {
      selectedZone.value = zone;
      loadZoneData();
    }
  }
});
</script>