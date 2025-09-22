// Elimina devis à corps esistente per test pulito
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDevisCorps() {
  console.log('🧹 Cleanup devis à corps esistenti...');
  
  try {
    // Trova tutti i devis à corps
    const { data: corpsDevis, error: findError } = await supabase
      .from('devis')
      .select('id, numero, nom')
      .eq('modalita_prezzi', 'aCorps');
    
    if (findError) {
      console.error('❌ Errore ricerca:', findError);
      return;
    }
    
    console.log(`📋 Trovati ${corpsDevis.length} devis à corps da eliminare:`);
    corpsDevis.forEach(d => {
      console.log(`- ID ${d.id}: ${d.numero} - ${d.nom}`);
    });
    
    if (corpsDevis.length === 0) {
      console.log('✅ Nessun devis à corps da eliminare');
      return;
    }
    
    // Elimina tutti
    const { error: deleteError } = await supabase
      .from('devis')
      .delete()
      .eq('modalita_prezzi', 'aCorps');
    
    if (deleteError) {
      console.error('❌ Errore eliminazione:', deleteError);
      return;
    }
    
    console.log('✅ Tutti i devis à corps eliminati');
    console.log('🎯 Ora puoi creare un nuovo devis à corps pulito dal frontend');
    
  } catch (err) {
    console.error('❌ Errore generale:', err);
  }
}

cleanupDevisCorps();