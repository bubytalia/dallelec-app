// Script per verificare e popolare le zone dei devis esistenti
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixZonesDevis() {
  console.log('🔧 Verifica e correzione zone devis...');
  
  try {
    // Carica tutti i devis
    const { data: devis, error } = await supabase
      .from('devis')
      .select('*');
    
    if (error) throw error;
    
    console.log(`📋 Trovati ${devis.length} devis`);
    
    for (const d of devis) {
      console.log(`\n🔍 Devis ${d.numero} (${d.nom})`);
      console.log(`   Zones attuali:`, d.zones);
      
      // Se non ha zone, aggiungiamo zone di default basate sul nome/tipo cantiere
      if (!d.zones || (Array.isArray(d.zones) && d.zones.length === 0)) {
        let defaultZones = [];
        
        // Zone di default basate sul tipo di cantiere
        const nom = d.nom?.toLowerCase() || '';
        if (nom.includes('campus') || nom.includes('college') || nom.includes('école')) {
          defaultZones = ['Bâtiment A', 'Bâtiment B', 'Extérieur'];
        } else if (nom.includes('bureau') || nom.includes('office')) {
          defaultZones = ['Rez-de-chaussée', '1er étage', '2ème étage'];
        } else {
          // Zone generiche
          defaultZones = ['Zone 1', 'Zone 2'];
        }
        
        console.log(`   ➕ Aggiunta zone di default:`, defaultZones);
        
        // Aggiorna il devis con le zone di default
        const { error: updateError } = await supabase
          .from('devis')
          .update({ zones: defaultZones })
          .eq('id', d.id);
        
        if (updateError) {
          console.error(`   ❌ Errore aggiornamento:`, updateError);
        } else {
          console.log(`   ✅ Zone aggiunte con successo`);
        }
      } else {
        console.log(`   ✅ Zone già presenti`);
      }
    }
    
    console.log('\n🎉 Correzione zone completata!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixZonesDevis();