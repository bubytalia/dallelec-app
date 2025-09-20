<template>
  <div class="container py-5">
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Configuration Régies</h2>
    
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Prix régie par défaut</h5>
            <small class="text-muted">Ce prix sera utilisé automatiquement lors de la création de nouveaux cantiers</small>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Prix par heure (CHF)</label>
              <input 
                v-model.number="prixRegieDefault" 
                type="number" 
                step="1" 
                class="form-control form-control-lg text-center" 
                placeholder="75"
              />
            </div>
            <div class="text-center">
              <button @click="savePrixDefault" class="btn btn-primary btn-lg">
                💾 Sauvegarder prix par défaut
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-12">
        <div class="alert alert-info">
          <h6>ℹ️ Comment ça fonctionne :</h6>
          <ul class="mb-0">
            <li>Définissez ici le <strong>prix régie par défaut</strong> de votre entreprise</li>
            <li>Ce prix sera automatiquement proposé lors de la création de nouveaux cantiers</li>
            <li>Vous pourrez toujours modifier le prix pour chaque cantier individuellement</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

export default {
  name: 'Regies',
  components: {
    RetourButton
  },
  setup() {
    const prixRegieDefault = ref(75);

    const fetchPrixDefault = async () => {
      try {
        const { data, error } = await supabase
          .from('configuration')
          .select('prix_default')
          .eq('type', 'regies')
          .single();
        
        if (data && !error) {
          prixRegieDefault.value = data.prix_default || 75;
        }
      } catch (error) {
        console.log('Aucune configuration trouvée, utilisation valeur par défaut');
      }
    };

    const savePrixDefault = async () => {
      try {
        // Usa UPSERT per gestire sia INSERT che UPDATE
        const { error } = await supabase
          .from('configuration')
          .upsert({
            type: 'regies',
            prix_default: prixRegieDefault.value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'type'
          });
        
        if (error) throw error;
        alert('✅ Prix par défaut sauvegardé avec succès!');
      } catch (error) {
        console.error('Erreur sauvegarde:', error);
        alert('❌ Erreur lors de la sauvegarde: ' + error.message);
      }
    };

    onMounted(fetchPrixDefault);

    return {
      prixRegieDefault,
      savePrixDefault
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: auto;
}
.table {
  margin-top: 30px;
}
</style>