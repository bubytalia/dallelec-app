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
              <th>ML Réelles</th>
              <th>Différence</th>
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
                  v-model.number="prodotto.mlReali" 
                  class="form-control" 
                  step="0.1"
                  @input="calcolaImpatti"
                />
              </td>
              <td>
                <span :class="getDifferenzaClass(prodotto)">
                  {{ ((prodotto.mlReali || 0) - (prodotto.ml || 0)).toFixed(1) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
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
            <button @click="aggiungiSupplemento" class="btn btn-success">➕ Ajouter</button>
          </div>
        </div>
        
        <table v-if="supplementiAggiuntivi.length > 0" class="table table-sm">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(supp, index) in supplementiAggiuntivi" :key="index">
              <td>{{ supp.descrizione }}</td>
              <td>{{ supp.quantita }}</td>
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
      <button @click="salvaResocontoFinale" class="btn btn-success me-2">
        💾 Sauvegarder resoconto final
      </button>
      <button @click="generaPdfConguaglio" class="btn btn-primary">
        📄 Générer PDF conguaglio
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
  quantita: 0
});
const numeroDevis = ref('');
const nomClient = ref('');
const nomChantier = ref('');

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

const importoPrevisto = computed(() => {
  return prodottiZona.value.reduce((sum, p) => sum + ((p.ml || 0) * (p.prix || 0)), 0);
});

const importoFatturato = computed(() => {
  return (importoPrevisto.value * percentualeFatturata.value) / 100;
});

const variazioniQuantita = computed(() => {
  return prodottiZona.value.reduce((sum, p) => {
    const diff = (p.mlReali || 0) - (p.ml || 0);
    return sum + (diff * (p.prix || 0));
  }, 0);
});

const totalSupplementi = computed(() => {
  return supplementiAggiuntivi.value.reduce((sum, s) => sum + (s.quantita * s.prezzo), 0);
});

const conguaglioFinale = computed(() => {
  return variazioniQuantita.value + totalSupplementi.value;
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
  
  prodottiZona.value = prodottiFiltrati.map(p => ({ ...p, mlReali: p.ml }));
  
  supplementiAggiuntivi.value = [];
  calcolaImpatti();
};

const getPercentualeFatturata = (zona) => {
  if (!zona) return 0;
  return resocontiPercentuali.value.reduce((sum, r) => {
    return sum + (r.avancementi?.[zona] || 0);
  }, 0);
};

const calcolaImpatti = () => {
  // Trigger reattività computed
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
  if (nuovoSupplemento.value.descrizione && nuovoSupplemento.value.quantita > 0) {
    supplementiAggiuntivi.value.push({ ...nuovoSupplemento.value });
    nuovoSupplemento.value = { descrizione: '', quantita: 0 };
  }
};

const rimuoviSupplemento = (index) => {
  supplementiAggiuntivi.value.splice(index, 1);
};

const salvaResocontoFinale = async () => {
  const resocontoFinale = {
    chantierId: selectedChantierId.value,
    zona: selectedZone.value,
    percentualeFatturata: percentualeFatturata.value,
    importoFatturato: importoFatturato.value,
    prodottiReali: prodottiZona.value,
    supplementiAggiuntivi: supplementiAggiuntivi.value,
    variazioniQuantita: variazioniQuantita.value,
    totalSupplementi: totalSupplementi.value,
    conguaglioFinale: conguaglioFinale.value,
    capocantiere: user.value?.email || 'unknown',
    createdAt: new Date().toISOString(),
    status: 'completato'
  };
  
  const { error } = await supabase
    .from('resoconti_finali')
    .insert([resocontoFinale]);
  
  if (error) {
    alert('Errore nel salvataggio: ' + error.message);
  } else {
    alert('Resoconto finale salvato con successo!');
  }
};

const generaPdfConguaglio = () => {
  if (!selectedChantierId.value || !selectedZone.value) return;
  
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  
  // Header
  const logoW = 55;
  const logoH = logoW / 5.32;
  doc.addImage(logo, 'JPEG', 10, 10, logoW, logoH);
  
  doc.setFontSize(8);
  const companyInfo = ['DALLELEC Sarl', 'Rue de Bourgogne 25', '1203 Genève', 'contact@dallelec.ch'];
  let y = 12;
  companyInfo.forEach(line => {
    doc.text(line, 200, y, { align: 'right' });
    y += 4;
  });
  
  // Titolo
  doc.setFontSize(18);
  doc.setFont('Helvetica', 'bold');
  doc.text('CONGUAGLIO FINALE ZONA', 105, 40, { align: 'center' });
  
  // Info cantiere
  const chantierInfo = chantiers.value.find(c => c.id === selectedChantierId.value);
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'normal');
  let yPos = 55;
  doc.text(`Chantier: ${chantierInfo?.nom || ''}`, 10, yPos);
  yPos += 6;
  doc.text(`Client: ${devisData.value?.nom || ''}`, 10, yPos);
  yPos += 6;
  doc.text(`Zone: ${selectedZone.value}`, 10, yPos);
  yPos += 6;
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 10, yPos);
  yPos += 15;
  
  // Riepilogo
  const riepHead = [['Description', 'Montant']];
  const riepBody = [
    [`Déjà facturé (${percentualeFatturata.value}%)`, `${importoFatturato.value.toFixed(2)} CHF`],
    ['Variations quantités', `${variazioniQuantita.value.toFixed(2)} CHF`],
    ['Suppléments', `${totalSupplementi.value.toFixed(2)} CHF`],
    ['CONGUAGLIO FINAL', `${conguaglioFinale.value.toFixed(2)} CHF`]
  ];
  
  autoTable(doc, {
    head: riepHead,
    body: riepBody,
    startY: yPos,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200] },
    columnStyles: { 1: { halign: 'right' } }
  });
  
  const fileName = `conguaglio-${chantierInfo?.numeroCantiere || 'cantiere'}-${selectedZone.value}.pdf`;
  doc.save(fileName);
};

onMounted(async () => {
  await fetchChantiers();
  
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