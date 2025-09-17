<template>
  <div class="container py-4">
    <RetourButton to="/chef" />

    <h2 class="text-center mb-4">Resoconto Finale di Zona</h2>

    <!-- Selezione cantiere e zona -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Sélectionner chantier</h5>
          </div>
          <div class="card-body">
            <select v-model="selectedChantierId" class="form-control" @change="loadChantierData">
              <option value="">Choisir un chantier</option>
              <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                {{ chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '' }}{{ chantier.nom }}
              </option>
            </select>
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
              <option v-for="zone in zonesCompletees" :key="zone" :value="zone">
                {{ zone }} ({{ getPercentualeFatturata(zone) }}% facturé)
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Riepilogo situazione zona -->
    <div v-if="selectedZone" class="card mb-4">
      <div class="card-header bg-info text-white">
        <h5>📊 Situation Zone: {{ selectedZone }}</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <h6>💰 Déjà facturé (pourcentage)</h6>
            <div class="alert alert-success">
              <strong>{{ percentualeFatturata }}%</strong><br>
              <small>{{ importoFatturato.toFixed(2) }} CHF</small>
            </div>
          </div>
          <div class="col-md-4">
            <h6>📋 Quantités prévues (devis)</h6>
            <div class="alert alert-primary">
              <strong>{{ totalMLPreviste.toFixed(2) }} ML</strong><br>
              <small>{{ importoPrevisto.toFixed(2) }} CHF</small>
            </div>
          </div>
          <div class="col-md-4">
            <h6>⚖️ Différence à régulariser</h6>
            <div class="alert" :class="differenzaClass">
              <strong>{{ differenzaImporto.toFixed(2) }} CHF</strong><br>
              <small>{{ differenzaImporto >= 0 ? 'Supplément à facturer' : 'Crédit client' }}</small>
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
              <th>Prix Unit.</th>
              <th>Impact €</th>
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
              <td>{{ prodotto.prix?.toFixed(2) || '0.00' }} CHF</td>
              <td>
                <span :class="getImpactClass(prodotto)">
                  {{ calcolaImpattoProdotto(prodotto).toFixed(2) }} CHF
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

    <!-- Riepilogo finale -->
    <div v-if="selectedZone" class="card mb-4">
      <div class="card-header bg-warning">
        <h5>📋 Riepilogo Finale</h5>
      </div>
      <div class="card-body">
        <table class="table">
          <tbody>
            <tr>
              <td><strong>Importo già fatturato ({{ percentualeFatturata }}%)</strong></td>
              <td class="text-end">{{ importoFatturato.toFixed(2) }} CHF</td>
            </tr>
            <tr>
              <td>Variazioni quantità reali</td>
              <td class="text-end" :class="variazioniQuantitaClass">
                {{ variazioniQuantita.toFixed(2) }} CHF
              </td>
            </tr>
            <tr>
              <td>Supplementi aggiuntivi</td>
              <td class="text-end text-success">{{ totalSupplementi.toFixed(2) }} CHF</td>
            </tr>
            <tr class="table-active">
              <td><strong>CONGUAGLIO DA FATTURARE</strong></td>
              <td class="text-end" :class="congualioClass">
                <strong>{{ conguaglioFinale.toFixed(2) }} CHF</strong>
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
  quantita: 0,
  prezzo: 0
});

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
  if (!user.value?.email) {
    console.warn('Utente non autenticato');
    return;
  }
  
  const { data: allChantiers } = await supabase
    .from('chantiers')
    .select('*')
    .eq('capocantiere', user.value.email);
  
  chantiers.value = allChantiers || [];
};

const loadChantierData = async () => {
  if (!selectedChantierId.value) return;
  
  const chantier = chantiers.value.find(c => c.id === selectedChantierId.value);
  if (!chantier?.devisId) return;
  
  // Carica devis
  const { data: devisDoc } = await supabase
    .from('devis')
    .select('*')
    .eq('id', chantier.devisId)
    .single();
  
  if (devisDoc) {
    devisData.value = devisDoc;
    
    // Estrai zone
    const zoneSet = new Set();
    devisData.value.produits?.forEach(p => {
      if (p.zone) zoneSet.add(p.zone);
    });
    zones.value = Array.from(zoneSet).sort();
  }
  
  // Carica resoconti percentuali
  const { data: resocontiData } = await supabase
    .from('resoconti_percentuali')
    .select('*')
    .eq('chantierId', selectedChantierId.value)
    .eq('status', 'approved');
  
  resocontiPercentuali.value = resocontiData || [];
};

const loadZoneData = () => {
  if (!selectedZone.value || !devisData.value) return;
  
  // Filtra prodotti della zona selezionata
  prodottiZona.value = devisData.value.produits
    ?.filter(p => p.zone === selectedZone.value)
    ?.map(p => ({ ...p, mlReali: p.ml })) || [];
  
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
    nuovoSupplemento.value = { descrizione: '', quantita: 0, prezzo: 0 };
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