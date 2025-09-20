// Script per aggiornare le régies nei resoconti esistenti
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixResocontoRegies() {
  try {
    // 1. Trova tutti i resoconti del cantiere Mikron
    const { data: resoconti, error: errorResoconti } = await supabase
      .from('resoconti_percentuali')
      .select('*')
      .eq('chantier_id', 2); // ID del cantiere Mikron
    
    if (errorResoconti) throw errorResoconti;
    
    console.log('🔍 Resoconti trovati:', resoconti.length);
    
    for (const resoconto of resoconti) {
      console.log('\n📋 Resoconto ID:', resoconto.id);
      console.log('📅 Periodo:', resoconto.periode_month);
      console.log('🔧 Régies attuali:', resoconto.regies);
      
      if (resoconto.regies && resoconto.regies.length > 0) {
        // Aggiorna il prezzo delle régies a 75 CHF
        const regiesAggiornate = resoconto.regies.map(regie => ({
          ...regie,
          prixHeure: 75
        }));
        
        console.log('🔧 Régies aggiornate:', regiesAggiornate);
        
        // Salva le régies aggiornate
        const { error: updateError } = await supabase
          .from('resoconti_percentuali')
          .update({ regies: regiesAggiornate })
          .eq('id', resoconto.id);
        
        if (updateError) throw updateError;
        
        console.log('✅ Régies aggiornate per resoconto', resoconto.id);
      } else {
        console.log('ℹ️ Nessuna régie in questo resoconto');
      }
    }
    
    console.log('\n🎯 Aggiornamento completato!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixResocontoRegies();