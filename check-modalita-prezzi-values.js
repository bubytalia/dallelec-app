// Script per verificare e correggere i valori modalita_prezzi nei devis
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkModalitaPrezziValues() {
  console.log('🔍 Verifica valori modalita_prezzi...');
  
  try {
    // Carica tutti i devis
    const { data: devis, error } = await supabase
      .from('devis')
      .select('*');
    
    if (error) throw error;
    
    console.log(`📋 Trovati ${devis.length} devis`);
    
    let needsUpdate = 0;
    
    for (const d of devis) {
      console.log(`\n🔍 Devis ${d.numero}:`);
      console.log(`   modalita_prezzi: "${d.modalita_prezzi}"`);
      console.log(`   remises: ${d.remises ? 'PRESENTE' : 'NULL'}`);
      
      // Verifica se il valore è corretto
      const validValues = ['scontistica', 'prezziFissi'];
      if (!validValues.includes(d.modalita_prezzi)) {
        console.log(`   ⚠️ Valore non valido: "${d.modalita_prezzi}"`);
        
        // Determina il valore corretto basandosi sui dati
        let correctValue = 'scontistica'; // Default
        
        // Se ha remises configurate, probabilmente è scontistica
        if (d.remises && Object.keys(d.remises).length > 0) {
          correctValue = 'scontistica';
        }
        
        console.log(`   ➡️ Dovrebbe essere: "${correctValue}"`);
        needsUpdate++;
        
        // Aggiorna il devis
        const { error: updateError } = await supabase
          .from('devis')
          .update({ modalita_prezzi: correctValue })
          .eq('id', d.id);
        
        if (updateError) {
          console.error(`   ❌ Errore aggiornamento:`, updateError);
        } else {
          console.log(`   ✅ Aggiornato a: "${correctValue}"`);
        }
      } else {
        console.log(`   ✅ Valore corretto`);
      }
    }
    
    console.log(`\n📊 Riepilogo:`);
    console.log(`   Devis totali: ${devis.length}`);
    console.log(`   Devis aggiornati: ${needsUpdate}`);
    
    // Test caricamento come farebbe DevisCreate.vue
    console.log(`\n🧪 Test caricamento primo devis:`);
    const firstDevis = devis[0];
    if (firstDevis) {
      const modalitaPrezzi = firstDevis.modalita_prezzi || 'scontistica';
      console.log(`   Valore caricato: "${modalitaPrezzi}"`);
      console.log(`   Radio button scontistica checked: ${modalitaPrezzi === 'scontistica'}`);
      console.log(`   Radio button prezziFissi checked: ${modalitaPrezzi === 'prezziFissi'}`);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

checkModalitaPrezziValues();