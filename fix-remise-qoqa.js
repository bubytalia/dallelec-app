import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRemiseQOQA() {
  try {
    // Trova il devis QOQA
    const { data: devis, error: searchError } = await supabase
      .from('devis')
      .select('*')
      .ilike('nom', '%QOQA%')
      .single();
    
    if (searchError) {
      console.error('Errore ricerca devis:', searchError);
      return;
    }
    
    console.log('🔍 Devis trovato:', devis.numero, devis.nom);
    console.log('📊 Total attuale:', devis.total);
    console.log('🔍 Remise attuale:', devis.remise_supplementaire);
    
    // Aggiorna con remise supplémentaire 15%
    const { error: updateError } = await supabase
      .from('devis')
      .update({
        remise_supplementaire: 15,
        total: 19913.72  // Total corretto con remise
      })
      .eq('id', devis.id);
    
    if (updateError) {
      console.error('Errore aggiornamento:', updateError);
      return;
    }
    
    console.log('✅ Devis QOQA aggiornato con remise supplémentaire 15%');
    console.log('💰 Nuovo total: 19913.72 CHF');
    
  } catch (error) {
    console.error('Errore:', error);
  }
}

fixRemiseQOQA();