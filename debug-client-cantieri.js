// Debug per vedere i clienti e cantieri
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugClientCantieri() {
  try {
    // Carica factures, chantiers e clients
    const { data: factures } = await supabase.from('factures').select('*');
    const { data: chantiers } = await supabase.from('chantiers').select('*');
    const { data: clients } = await supabase.from('clients').select('*');
    
    console.log('📋 CLIENTI DISPONIBILI:');
    clients.forEach(c => console.log(`  - "${c.nom}"`));
    
    console.log('\n🏗️ CANTIERI CON FATTURE:');
    const chantiersConFatture = chantiers.filter(ch => 
      factures.some(f => f.chantier_id === ch.id)
    );
    
    chantiersConFatture.forEach(ch => {
      const clienteTrovato = clients.find(c => c.nom === ch.client);
      console.log(`  - Cantiere: "${ch.nom}"`);
      console.log(`    Cliente cantiere: "${ch.client}"`);
      console.log(`    Cliente trovato: ${clienteTrovato ? '✅' : '❌'}`);
      
      // Mostra fatture associate
      const fattureAssociate = factures.filter(f => f.chantier_id === ch.id);
      fattureAssociate.forEach(f => {
        console.log(`    Fattura ${f.numero}: client_nom="${f.client_nom}"`);
      });
      console.log('');
    });
    
    console.log('\n🔍 POSSIBILI MATCH PARZIALI:');
    chantiersConFatture.forEach(ch => {
      if (!clients.find(c => c.nom === ch.client)) {
        console.log(`\nCantiere: "${ch.client}"`);
        const possibiliMatch = clients.filter(c => 
          c.nom.toLowerCase().includes(ch.client.toLowerCase().split(' ')[0]) ||
          ch.client.toLowerCase().includes(c.nom.toLowerCase().split(' ')[0])
        );
        if (possibiliMatch.length > 0) {
          console.log('  Possibili match:');
          possibiliMatch.forEach(m => console.log(`    - "${m.nom}"`));
        }
      }
    });
    
  } catch (error) {
    console.error('Errore:', error);
  }
}

debugClientCantieri();