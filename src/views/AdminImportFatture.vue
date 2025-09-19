<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Importazione Fatture Storiche</h2>

    <!-- Configurazione numerazione -->
    <div class="card mb-4">
      <div class="card-header">
        <h5>1. Configurazione Numerazione</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <label>Ultimo numero fattura emesso:</label>
            <input v-model="ultimoNumero" type="number" class="form-control" placeholder="es. 1250">
          </div>
          <div class="col-md-4">
            <label>Anno:</label>
            <input v-model="anno" type="number" class="form-control">
          </div>
          <div class="col-md-4">
            <label>Prossima fattura sarà:</label>
            <div class="form-control bg-light">F{{ anno }}-{{ String(ultimoNumero + 1).padStart(3, '0') }}</div>
          </div>
        </div>
        <button @click="salvaConfig" class="btn btn-primary mt-2">💾 Salva Configurazione</button>
      </div>
    </div>

    <!-- Importazione rapida -->
    <div class="card">
      <div class="card-header">
        <h5>2. Importazione Rapida Fatture</h5>
      </div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-md-6">
            <label>Cantiere:</label>
            <select v-model="selectedChantier" class="form-control">
              <option value="">Seleziona cantiere</option>
              <option v-for="chantier in chantiers" :key="chantier.id" :value="chantier.id">
                {{ chantier.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '' }}{{ chantier.nom }}
              </option>
            </select>
          </div>
        </div>

        <!-- Form aggiunta fattura -->
        <div class="border p-3 mb-3">
          <h6>Aggiungi Fattura Storica</h6>
          <div class="row">
            <div class="col-md-3">
              <input v-model="nuovaFattura.numero" type="text" class="form-control" placeholder="N° Fattura">
            </div>
            <div class="col-md-3">
              <input v-model="nuovaFattura.data" type="date" class="form-control">
            </div>
            <div class="col-md-3">
              <input v-model="nuovaFattura.importo" type="number" step="0.01" class="form-control" placeholder="Importo CHF">
            </div>
            <div class="col-md-3">
              <button @click="aggiungiFattura" class="btn btn-success" :disabled="!selectedChantier">➕ Aggiungi</button>
            </div>
          </div>
        </div>

        <!-- Lista fatture da importare -->
        <div v-if="fattureImport.length > 0">
          <h6>Fatture da importare ({{ fattureImport.length }}):</h6>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Data</th>
                  <th>Importo</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(fattura, index) in fattureImport" :key="index">
                  <td>{{ fattura.numero }}</td>
                  <td>{{ fattura.data }}</td>
                  <td>{{ fattura.importo }} CHF</td>
                  <td>
                    <button @click="rimuoviFattura(index)" class="btn btn-sm btn-danger">🗑</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button @click="importaFatture" class="btn btn-primary">💾 Importa Tutte ({{ fattureImport.length }})</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

const ultimoNumero = ref(0);
const anno = ref(new Date().getFullYear());
const chantiers = ref([]);
const selectedChantier = ref('');
const fattureImport = ref([]);

const nuovaFattura = ref({
  numero: '',
  data: '',
  importo: ''
});

const loadChantiers = async () => {
  const { data } = await supabase.from('chantiers').select('*');
  chantiers.value = data || [];
};

const salvaConfig = async () => {
  try {
    const { error } = await supabase
      .from('configurazione_fatture')
      .upsert([{
        id: 1,
        ultimo_numero: ultimoNumero.value,
        anno: anno.value,
        updated_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    alert('Configurazione salvata!');
  } catch (error) {
    alert('Errore: ' + error.message);
  }
};

const aggiungiFattura = () => {
  if (!nuovaFattura.value.numero || !nuovaFattura.value.data || !nuovaFattura.value.importo) {
    alert('Compila tutti i campi');
    return;
  }
  
  fattureImport.value.push({
    numero: nuovaFattura.value.numero,
    data: nuovaFattura.value.data,
    importo: parseFloat(nuovaFattura.value.importo),
    chantier_id: selectedChantier.value
  });
  
  nuovaFattura.value = { numero: '', data: '', importo: '' };
};

const rimuoviFattura = (index) => {
  fattureImport.value.splice(index, 1);
};

const importaFatture = async () => {
  if (!confirm(`Importare ${fattureImport.value.length} fatture?`)) return;
  
  try {
    const chantier = chantiers.value.find(c => c.id == selectedChantier.value);
    
    const fattureDaInserire = fattureImport.value.map(f => ({
      numero: f.numero,
      chantier_id: f.chantier_id,
      date_facture: f.data,
      montant_ht: f.importo / 1.081,
      taux_tva: 8.1,
      montant_ttc: f.importo,
      statut: 'payee',
      client_nom: chantier?.client || 'Cliente',
      notes: 'Fattura storica importata',
      created_at: new Date().toISOString(),
      is_imported: true
    }));
    
    const { error } = await supabase
      .from('factures')
      .insert(fattureDaInserire);
    
    if (error) throw error;
    
    alert(`${fattureImport.value.length} fatture importate con successo!`);
    fattureImport.value = [];
  } catch (error) {
    alert('Errore importazione: ' + error.message);
  }
};

onMounted(() => {
  loadChantiers();
});
</script>