// Correzione Projet Alegria a Prix Fixes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProjetAlegria() {
  console.log('🔧 Correzione Projet Alegria...');
  
  try {
    // Aggiorna Projet Alegria a Prix Fixes
    const { error } = await supabase
      .from('devis')
      .update({ 
        modalita_prezzi: 'prezziFissi',
        remises: {} // Svuota le remises per prix fixes
      })
      .eq('nom', 'Projet Alegria');
    
    if (error) throw error;
    
    console.log('✅ Projet Alegria aggiornato a Prix Fixes');
    
    // Verifica
    const { data: verificaDevis, error: verificaError } = await supabase
      .from('devis')
      .select('*')
      .eq('nom', 'Projet Alegria')
      .single();
    
    if (verificaError) throw verificaError;
    
    console.log('🔍 Verifica:');
    console.log('   modalita_prezzi:', verificaDevis.modalita_prezzi);
    console.log('   remises:', verificaDevis.remises);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixProjetAlegria();