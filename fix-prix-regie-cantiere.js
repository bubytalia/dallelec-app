// Script per aggiornare il prezzo régies del cantiere specifico
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPrixRegie() {
  try {
    // 1. Trova il cantiere "Halle et stock - Mikron"
    const { data: chantiers, error: errorChantiers } = await supabase
      .from('chantiers')
      .select('*')
      .ilike('nom', '%Halle et stock%');
    
    if (errorChantiers) throw errorChantiers;
    
    console.log('🔍 Cantieri trovati:', chantiers);
    
    if (chantiers.length > 0) {
      const cantiere = chantiers[0];
      console.log('📋 Cantiere attuale:', cantiere);
      console.log('💰 Prezzo regie attuale:', cantiere.prix_regie);
      
      // 2. Aggiorna il prezzo a 75 CHF
      const { error: updateError } = await supabase
        .from('chantiers')
        .update({ prix_regie: 75 })
        .eq('id', cantiere.id);
      
      if (updateError) throw updateError;
      
      console.log('✅ Prezzo regie aggiornato a 75 CHF per cantiere:', cantiere.nom);
      
      // 3. Verifica l'aggiornamento
      const { data: verificaCantiere } = await supabase
        .from('chantiers')
        .select('*')
        .eq('id', cantiere.id)
        .single();
      
      console.log('🔍 Verifica cantiere aggiornato:', verificaCantiere);
      console.log('💰 Nuovo prezzo regie:', verificaCantiere.prix_regie);
    } else {
      console.log('❌ Nessun cantiere trovato con nome "Halle et stock"');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixPrixRegie();