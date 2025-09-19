<template>
  <div class="container py-4">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Configurazione Numerazione Fatture</h2>

    <div class="card">
      <div class="card-header">
        <h5>Impostazioni Numerazione</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label class="form-label">Anno di riferimento:</label>
              <input v-model="config.anno" type="number" class="form-control" :min="2020" :max="2030">
            </div>
            
            <div class="mb-3">
              <label class="form-label">Numero di partenza:</label>
              <input v-model="config.numeroPartenza" type="number" class="form-control" min="1">
              <small class="text-muted">Inserire l'ultimo numero di fattura emesso prima dell'uso del sistema</small>
            </div>
            
            <div class="mb-3">
              <label class="form-label">Prefisso (opzionale):</label>
              <input v-model="config.prefisso" type="text" class="form-control" placeholder="es. FAT, F">
              <small class="text-muted">Prefisso da aggiungere al numero fattura</small>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="alert alert-info">
              <h6>Anteprima formato:</h6>
              <strong>{{ anteprimaNumero }}</strong>
            </div>
            
            <div class="alert alert-warning">
              <h6>⚠️ Attenzione:</h6>
              <p>Modificare questi valori influenzerà la numerazione delle prossime fatture.</p>
              <p>Assicurarsi che il numero di partenza sia corretto per evitare duplicati.</p>
            </div>
          </div>
        </div>
        
        <div class="d-flex gap-2">
          <button @click="salvaConfigurazione" class="btn btn-primary">
            💾 Salva Configurazione
          </button>
          <button @click="resetConfigurazione" class="btn btn-warning">
            🔄 Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Statistiche attuali -->
    <div class="card mt-4">
      <div class="card-header">
        <h5>Statistiche Fatture</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-3">
            <div class="text-center">
              <h4 class="text-primary">{{ totaleFatture }}</h4>
              <small>Fatture totali</small>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center">
              <h4 class="text-success">{{ fattureAnnoCorrente }}</h4>
              <small>Fatture {{ new Date().getFullYear() }}</small>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center">
              <h4 class="text-info">{{ ultimaFattura }}</h4>
              <small>Ultima fattura</small>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center">
              <h4 class="text-warning">{{ prossimaFattura }}</h4>
              <small>Prossima fattura</small>
            </div>
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

const config = ref({
  anno: new Date().getFullYear(),
  numeroPartenza: 1,
  prefisso: 'F'
});

const factures = ref([]);

const anteprimaNumero = computed(() => {
  const numero = config.value.numeroPartenza + 1;
  const prefisso = config.value.prefisso || '';
  return `${prefisso}${config.value.anno}-${String(numero).padStart(3, '0')}`;
});

const totaleFatture = computed(() => factures.value.length);

const fattureAnnoCorrente = computed(() => {
  const annoCorrente = new Date().getFullYear();
  return factures.value.filter(f => {
    const dataFattura = new Date(f.date_facture || f.dateFacture);
    return dataFattura.getFullYear() === annoCorrente;
  }).length;
});

const ultimaFattura = computed(() => {
  if (factures.value.length === 0) return 'Nessuna';
  const ultima = factures.value
    .sort((a, b) => new Date(b.date_facture || b.dateFacture) - new Date(a.date_facture || a.dateFacture))[0];
  return ultima.numero || 'N/A';
});

const prossimaFattura = computed(() => {
  return anteprimaNumero.value;
});

const loadData = async () => {
  try {
    // Carica configurazione esistente
    const { data: configData, error: configError } = await supabase
      .from('configurazione_fatture')
      .select('*')
      .single();
    
    if (configData && !configError) {
      config.value = {
        anno: configData.anno || new Date().getFullYear(),
        numeroPartenza: configData.numero_partenza || 1,
        prefisso: configData.prefisso || 'F'
      };
    }

    // Carica fatture esistenti
    const { data: facturesData, error: facturesError } = await supabase
      .from('factures')
      .select('*');
    
    if (!facturesError) {
      factures.value = facturesData || [];
    }
  } catch (error) {
    console.error('Errore caricamento dati:', error);
  }
};

const salvaConfigurazione = async () => {
  if (!confirm('Salvare la nuova configurazione? Questo influenzerà la numerazione delle prossime fatture.')) return;
  
  try {
    // Verifica se esiste già una configurazione
    const { data: existing } = await supabase
      .from('configurazione_fatture')
      .select('id')
      .single();

    const configData = {
      anno: config.value.anno,
      numero_partenza: config.value.numeroPartenza,
      prefisso: config.value.prefisso,
      updated_at: new Date().toISOString()
    };

    let error;
    if (existing) {
      // Aggiorna configurazione esistente
      ({ error } = await supabase
        .from('configurazione_fatture')
        .update(configData)
        .eq('id', existing.id));
    } else {
      // Crea nuova configurazione
      ({ error } = await supabase
        .from('configurazione_fatture')
        .insert([{
          ...configData,
          created_at: new Date().toISOString()
        }]));
    }

    if (error) throw error;
    
    alert('Configurazione salvata con successo!');
  } catch (error) {
    console.error('Errore salvataggio:', error);
    alert('Errore: ' + error.message);
  }
};

const resetConfigurazione = () => {
  if (!confirm('Ripristinare la configurazione predefinita?')) return;
  
  config.value = {
    anno: new Date().getFullYear(),
    numeroPartenza: 1,
    prefisso: 'F'
  };
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>