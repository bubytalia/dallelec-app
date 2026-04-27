<template>
  <div class="container py-4">
    <RetourButton to="/admin" />

    <h2 class="text-center mb-4">Rapport Final de Zone (Admin)</h2>

    <!-- Selezione cantiere e zona -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Sélectionner chantier</h5>
          </div>
          <div class="card-body">
            <div class="d-flex gap-2">
              <select v-model="selectedChantierId" class="form-control" @change="loadChantierData">
                <option value="">Choisir un chantier ({{ chantiers.length }} disponibles)</option>
                <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                  {{ chantier.numeroCantiere ? `N° ${chantier.numeroCantiere} - ` : '' }}{{ chantier.nom }}
                </option>
              </select>
              <button v-if="selectedChantierId" @click="refreshDevisData" class="btn btn-primary" title="Recharger">🔄</button>
            </div>
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
              <option v-for="zone in zones" :key="zone" :value="zone">{{ zone }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Riepilogo zona -->
    <div v-if="selectedZone" class="card mb-4">
      <div class="card-header bg-info text-white">
        <h5>📊 Zone: {{ selectedZone }}</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h6>📋 Quantités prévues (devis)</h6>
            <div class="alert alert-primary"><strong>{{ totalMLPreviste.toFixed(2) }} ML</strong></div>
          </div>
          <div class="col-md-6">
            <h6>📏 Quantités réelles posées</h6>
            <div class="alert alert-success"><strong>{{ totalMLReelles.toFixed(2) }} ML</strong></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form quantità reali -->
    <div v-if="selectedZone && prodottiZona.length > 0" class="card mb-4">
      <div class="card-header"><h5>📏 Quantités réelles posées</h5></div>
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>Produit</th><th>Taille</th><th>ML Prévues</th><th>ML Posées</th>
              <th>Suppléments</th><th>Total ML</th><th>Différence</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(prodotto, index) in prodottiZona" :key="index">
              <td>{{ prodotto.nom }}</td>
              <td>{{ prodotto.taille }}</td>
              <td>{{ prodotto.ml || 0 }}</td>
              <td>
                <input type="number" :value="prodotto.mlReali" class="form-control" step="0.1"
                  @input="(e) => { prodotto.mlReali = Number(e.target.value); prodotto.totalML = prodotto.mlReali; }" />
              </td>
              <td>
                <div v-for="supp in supplementsDisponibili" :key="supp.id" class="d-flex align-items-center mb-1">
                  <input type="checkbox" :value="supp.nom" v-model="prodotto.supplementiSelezionati" 
                    class="form-check-input me-1"
                    @change="() => { onSupplementToggle(index, supp.nom); updateSupplementi(index); }">
                  <span class="me-1 small">{{ supp.nom }}</span>
                  <input v-if="prodotto.supplementiSelezionati && prodotto.supplementiSelezionati.includes(supp.nom)"
                    type="number" class="form-control form-control-sm" style="width: 60px;"
                    v-model.number="prodotto.quantitaSupplementi[supp.nom]" min="0" placeholder="Qté"
                    @input="updateSupplementi(index)">
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

    <!-- Sezione Regie -->
    <div v-if="selectedZone" class="card mb-4">
      <div class="card-header"><h5>⏰ Régies (Heures supplémentaires)</h5></div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-md-2">
            <label>Heures:</label>
            <input v-model.number="nouvelleRegie.heures" type="number" step="0.5" class="form-control" placeholder="2.0">
          </div>
          <div class="col-md-4">
            <label>Description:</label>
            <input v-model="nouvelleRegie.description" type="text" class="form-control" placeholder="Modification installation...">
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button @click="ajouterRegie" class="btn btn-success w-100" :disabled="!regieValide">➕ Ajouter</button>
          </div>
        </div>
        <table v-if="regies.length > 0" class="table table-sm">
          <thead><tr><th>Heures</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="(regie, index) in regies" :key="index">
              <td>{{ regie.heures }}h</td>
              <td>{{ regie.description }}</td>
              <td><button @click="supprimerRegie(index)" class="btn btn-sm btn-danger">🗑</button></td>
            </tr>
          </tbody>
        </table>
        <div v-if="regies.length > 0" class="text-end"><strong>Total: {{ totalHeuresRegies }}h</strong></div>
      </div>
    </div>

    <!-- Suppléments non prévus -->
    <div v-if="selectedZone" class="card mb-4">
      <div class="card-header"><h5>➕ Suppléments non prévus</h5></div>
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
          <thead><tr><th>Description</th><th>Quantité</th><th>Prix Unit.</th><th>Total</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="(supp, index) in supplementiAggiuntivi" :key="index">
              <td>{{ supp.descrizione }}</td>
              <td>{{ supp.quantita }}</td>
              <td>{{ supp.prezzo.toFixed(2) }}</td>
              <td>{{ (supp.quantita * supp.prezzo).toFixed(2) }} CHF</td>
              <td><button @click="rimuoviSupplemento(index)" class="btn btn-sm btn-danger">🗑</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Résumé quantités -->
    <div v-if="selectedZone" class="card mb-4">
      <div class="card-header bg-success text-white"><h5>📋 Résumé des Quantités</h5></div>
      <div class="card-body">
        <table class="table">
          <tbody>
            <tr><td><strong>Total ML prévues</strong></td><td class="text-end"><strong>{{ totalMLPreviste.toFixed(2) }} ML</strong></td></tr>
            <tr><td><strong>Total ML réelles posées</strong></td><td class="text-end"><strong>{{ totalMLReelles.toFixed(2) }} ML</strong></td></tr>
            <tr class="table-active">
              <td><strong>DIFFÉRENCE</strong></td>
              <td class="text-end" :class="differenceMLClass"><strong>{{ (totalMLReelles - totalMLPreviste).toFixed(2) }} ML</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Zone già aggiunte -->
    <div v-if="zoneSelezionate.length > 0" class="card mb-4">
      <div class="card-header bg-primary text-white"><h5>📋 Zones ajoutées ({{ zoneSelezionate.length }})</h5></div>
      <div class="card-body">
        <div v-for="(zona, idx) in zoneSelezionate" :key="idx" class="alert alert-info d-flex justify-content-between align-items-center">
          <div><strong>{{ zona.nome }}</strong> - {{ zona.prodotti.length }} produits - {{ zona.totalMLReali.toFixed(2) }} ML</div>
          <div>
            <button @click="modificaZona(idx)" class="btn btn-sm btn-warning me-2">✏️ Modifier</button>
            <button @click="rimuoviZona(idx)" class="btn btn-sm btn-danger">🗑 Supprimer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Azioni -->
    <div class="text-center">
      <button v-if="selectedZone" @click="aggiungiZonaAlResoconto" class="btn btn-primary me-2">
        ➕ Ajouter cette zone au rapport
      </button>
      <button v-if="zoneSelezionate.length > 0" @click="salvaResocontoFinale" class="btn btn-success">
        💾 Sauvegarder rapport final ({{ zoneSelezionate.length }} zones)
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import RetourButton from '@/components/RetourButton.vue';

const router = useRouter();
const chantiers = ref([]);
const selectedChantierId = ref('');
const selectedZone = ref('');
const zoneSelezionate = ref([]);
const zones = ref([]);
const prodottiZona = ref([]);
const resocontiPercentuali = ref([]);
const devisData = ref(null);
const supplementiAggiuntivi = ref([]);
const nuovoSupplemento = ref({ descrizione: '', quantita: 0, prezzo: 0 });
const numeroDevis = ref('');
const nomClient = ref('');
const nomChantier = ref('');
const regies = ref([]);
const prixRegieChantier = ref(75);
const nouvelleRegie = ref({ heures: 0, description: '' });
const supplementsDisponibili = ref([]);

const totalMLPreviste = computed(() => prodottiZona.value.reduce((sum, p) => sum + (p.ml || 0), 0));
const totalMLReelles = computed(() => prodottiZona.value.reduce((sum, p) => sum + (p.mlReali || 0), 0));
const differenceMLClass = computed(() => (totalMLReelles.value - totalMLPreviste.value) >= 0 ? 'text-success' : 'text-danger');
const regieValide = computed(() => nouvelleRegie.value.heures > 0 && nouvelleRegie.value.description.trim());
const totalHeuresRegies = computed(() => regies.value.reduce((sum, r) => sum + r.heures, 0));

// Admin: carica TUTTI i cantieri
const fetchChantiers = async () => {
  try {
    const { data, error } = await supabase.from('chantiers').select('*').order('nom');
    if (error) throw error;
    chantiers.value = data || [];
  } catch (error) {
    console.error('Erreur:', error);
    chantiers.value = [];
  }
};

const loadChantierData = async () => {
  if (!selectedChantierId.value) { zones.value = []; selectedZone.value = ''; return; }
  
  try {
    const chantier = chantiers.value.find(c => String(c.id) === String(selectedChantierId.value));
    const gruppoDevisId = chantier?.gruppo_devis_id;
    const devisId = chantier?.devis_id || chantier?.devisId;
    
    let allDevisStessoCantiere = [];
    
    if (gruppoDevisId) {
      const { data } = await supabase.from('devis').select('*').eq('gruppo_devis_id', gruppoDevisId);
      allDevisStessoCantiere = data || [];
      if (!allDevisStessoCantiere.length && devisId) {
        const { data: fb } = await supabase.from('devis').select('*').eq('id', devisId).single();
        allDevisStessoCantiere = fb ? [fb] : [];
      }
    } else if (devisId) {
      const { data } = await supabase.from('devis').select('*').eq('id', devisId).single();
      allDevisStessoCantiere = data ? [data] : [];
    }
    
    if (!allDevisStessoCantiere.length) { alert('Aucun devis trouvé'); return; }
    
    const devisCombinato = { numero: allDevisStessoCantiere.map(d => d.numero).join(', '), nom: allDevisStessoCantiere[0].nom, produits: [] };
    const prodottiMap = new Map();
    
    allDevisStessoCantiere.forEach(devis => {
      (devis.produits || []).forEach(prodotto => {
        const key = `${prodotto.zone}-${prodotto.article}-${prodotto.nom}-${prodotto.taille}`;
        if (prodottiMap.has(key)) {
          const existing = prodottiMap.get(key);
          existing.ml = (existing.ml || 0) + (prodotto.ml || 0);
          existing.mlReali = existing.ml;
        } else {
          prodottiMap.set(key, { ...prodotto, mlReali: prodotto.ml });
        }
      });
    });
    
    devisCombinato.produits = Array.from(prodottiMap.values());
    devisData.value = devisCombinato;
    numeroDevis.value = devisCombinato.numero;
    nomClient.value = devisCombinato.nom || '';
    
    const numeroDisplay = chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '';
    nomChantier.value = `${numeroDisplay}${chantier.nom} - ${chantier.adresse}`;
    
    const zoneSet = new Set();
    (devisCombinato.produits || []).forEach(p => { if (p.zone) zoneSet.add(p.zone); });
    zones.value = Array.from(zoneSet).sort();
    
    const { data: resocontiData } = await supabase.from('resoconti_percentuali').select('*')
      .eq('chantier_id', selectedChantierId.value).eq('status', 'approved');
    resocontiPercentuali.value = resocontiData || [];
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
};

const loadZoneData = () => {
  if (!selectedZone.value || !devisData.value) return;
  if (zoneSelezionate.value.some(z => z.nome === selectedZone.value)) {
    alert('Cette zone a déjà été ajoutée'); selectedZone.value = ''; return;
  }
  
  const prodottiFiltrati = devisData.value.produits?.filter(p => p.zone === selectedZone.value) || [];
  prodottiZona.value = prodottiFiltrati.map(p => ({
    ...p, mlReali: p.ml, supplementiSelezionati: [], quantitaSupplementi: {}, totalML: p.ml
  }));
  supplementiAggiuntivi.value = [];
  regies.value = [];
};

const getDifferenzaClass = (prodotto) => ((prodotto.mlReali || 0) - (prodotto.ml || 0)) >= 0 ? 'text-success' : 'text-danger';

const onSupplementToggle = (index, suppNom) => {
  const prodotto = prodottiZona.value[index];
  if (!prodotto.supplementiSelezionati) prodotto.supplementiSelezionati = [];
  if (!prodotto.quantitaSupplementi) prodotto.quantitaSupplementi = {};
  if (!prodotto.supplementiSelezionati.includes(suppNom)) {
    prodotto.quantitaSupplementi[suppNom] = 0;
  }
};

const updateSupplementi = (index) => {
  const prodotto = prodottiZona.value[index];
  let totalSuppML = 0;
  if (prodotto.supplementiSelezionati) {
    prodotto.supplementiSelezionati.forEach(suppNom => {
      const qte = prodotto.quantitaSupplementi[suppNom] || 0;
      const supp = supplementsDisponibili.value.find(s => s.nom === suppNom);
      totalSuppML += qte * (supp?.valeur || 1);
    });
  }
  prodotto.totalML = (prodotto.mlReali || 0) + totalSuppML;
  
  // Aggiorna supplements array
  prodotto.supplements = (prodotto.supplementiSelezionati || [])
    .filter(nom => (prodotto.quantitaSupplementi[nom] || 0) > 0)
    .map(nom => {
      const supp = supplementsDisponibili.value.find(s => s.nom === nom);
      const qte = prodotto.quantitaSupplementi[nom] || 0;
      return { supplement: nom, valeur: supp?.valeur || 1, qtePosee: qte, totalML: qte * (supp?.valeur || 1) };
    });
};

const aggiungiSupplemento = () => {
  if (nuovoSupplemento.value.descrizione && nuovoSupplemento.value.quantita > 0 && nuovoSupplemento.value.prezzo > 0) {
    supplementiAggiuntivi.value.push({ ...nuovoSupplemento.value });
    nuovoSupplemento.value = { descrizione: '', quantita: 0, prezzo: 0 };
  }
};
const rimuoviSupplemento = (index) => { supplementiAggiuntivi.value.splice(index, 1); };

const ajouterRegie = () => {
  if (!regieValide.value) return;
  regies.value.push({ heures: nouvelleRegie.value.heures, prixHeure: prixRegieChantier.value, description: nouvelleRegie.value.description });
  nouvelleRegie.value = { heures: 0, description: '' };
};
const supprimerRegie = (index) => { regies.value.splice(index, 1); };

const aggiungiZonaAlResoconto = () => {
  if (!selectedZone.value || !prodottiZona.value.length) { alert('Compléter les données'); return; }
  if (zoneSelezionate.value.some(z => z.nome === selectedZone.value)) { alert('Zone déjà ajoutée'); return; }
  
  zoneSelezionate.value.push({
    nome: selectedZone.value,
    prodotti: JSON.parse(JSON.stringify(prodottiZona.value)),
    regies: JSON.parse(JSON.stringify(regies.value)),
    supplementiAggiuntivi: JSON.parse(JSON.stringify(supplementiAggiuntivi.value)),
    totalMLPreviste: totalMLPreviste.value,
    totalMLReali: totalMLReelles.value
  });
  
  selectedZone.value = '';
  prodottiZona.value = [];
  regies.value = [];
  supplementiAggiuntivi.value = [];
  alert(`Zone ajoutée! Total: ${zoneSelezionate.value.length}`);
};

const rimuoviZona = (index) => { if (confirm('Supprimer?')) zoneSelezionate.value.splice(index, 1); };

const modificaZona = (index) => {
  const zona = zoneSelezionate.value[index];
  selectedZone.value = zona.nome;
  prodottiZona.value = JSON.parse(JSON.stringify(zona.prodotti));
  regies.value = JSON.parse(JSON.stringify(zona.regies));
  supplementiAggiuntivi.value = JSON.parse(JSON.stringify(zona.supplementiAggiuntivi));
  zoneSelezionate.value.splice(index, 1);
};

const refreshDevisData = async () => {
  const zonaCorrente = selectedZone.value;
  await loadChantierData();
  if (zonaCorrente && zones.value.includes(zonaCorrente)) {
    const prodottiFiltrati = devisData.value.produits?.filter(p => p.zone === zonaCorrente) || [];
    prodottiZona.value = prodottiFiltrati.map(p => ({ ...p, mlReali: p.ml, supplementiSelezionati: [], quantitaSupplementi: {}, totalML: p.ml }));
    selectedZone.value = zonaCorrente;
  }
  alert('Données rechargées!');
};

// Admin: salva direttamente come approved
const salvaResocontoFinale = async () => {
  if (!selectedChantierId.value || !zoneSelezionate.value.length) {
    alert('Ajouter au moins une zone'); return;
  }
  
  try {
    const avancementi = {};
    zoneSelezionate.value.forEach(zona => { avancementi[zona.nome] = 100; });
    
    const tuttiProdotti = [];
    const tutteRegies = [];
    const tuttiSupplementi = [];
    let totalMLPrevisteGlobale = 0;
    let totalMLRealiGlobale = 0;
    
    zoneSelezionate.value.forEach(zona => {
      const prodottiPuliti = zona.prodotti.map(p => {
        const pp = { ...p };
        if (pp.supplements && Array.isArray(pp.supplements)) {
          pp.supplements = pp.supplements.filter(s => (s.qtePosee || s.qte || 0) > 0).map(s => {
            const qte = s.qtePosee || s.qte || 0;
            return { ...s, totalML: qte * (s.valeur || 1) };
          });
        }
        const mlBase = pp.mlReali || 0;
        const mlSupp = (pp.supplements || []).reduce((sum, s) => sum + (s.totalML || 0), 0);
        pp.totalML = mlBase + mlSupp;
        return pp;
      });
      
      tuttiProdotti.push(...prodottiPuliti);
      tutteRegies.push(...zona.regies.map(r => ({ ...r, zone: zona.nome })));
      tuttiSupplementi.push(...zona.supplementiAggiuntivi.map(s => ({ ...s, zone: zona.nome })));
      totalMLPrevisteGlobale += zona.totalMLPreviste;
      totalMLRealiGlobale += zona.totalMLReali;
    });
    
    const userEmail = localStorage.getItem('userEmail');
    
    const { error } = await supabase.from('resoconti_percentuali').insert([{
      chantier_id: selectedChantierId.value,
      periode_month: new Date().toISOString().slice(0, 7),
      avancementi,
      prodotti_reali: tuttiProdotti,
      regies: tutteRegies,
      supplementi_aggiuntivi: tuttiSupplementi,
      total_ml_previste: totalMLPrevisteGlobale,
      total_ml_reali: totalMLRealiGlobale,
      descrizione: `Rapport final ${zoneSelezionate.value.length} zones: ${zoneSelezionate.value.map(z => z.nome).join(', ')}`,
      capocantiere: userEmail,
      status: 'approved',
      type: 'resoconto_finale',
      created_at: new Date().toISOString()
    }]);
    
    if (error) throw error;
    
    alert(`Rapport final sauvegardé!\n${zoneSelezionate.value.length} zones incluses`);
    zoneSelezionate.value = [];
    selectedZone.value = '';
    prodottiZona.value = [];
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
};

const fetchSupplements = async () => {
  try {
    const { data, error } = await supabase.from('supplements').select('*').order('ordre');
    if (error) throw error;
    supplementsDisponibili.value = (data || []).map(item => ({ id: item.id, nom: item.nom, valeur: item.valeur || 1, ordre: item.ordre || 0 }));
  } catch (error) {
    supplementsDisponibili.value = [];
  }
};

onMounted(async () => {
  await fetchChantiers();
  await fetchSupplements();
  
  const urlParams = new URLSearchParams(window.location.search);
  const chantierId = urlParams.get('chantier');
  const zone = urlParams.get('zone');
  
  if (chantierId) {
    selectedChantierId.value = chantierId;
    await loadChantierData();
    if (zone) { selectedZone.value = zone; loadZoneData(); }
  }
});
</script>
