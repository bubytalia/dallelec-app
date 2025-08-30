// Verifica se esistono tabelle per le condizioni in Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConditionsTables() {
  console.log('🔍 Verifica tabelle condizioni in Supabase...');
  
  try {
    // Prova a leggere da possibili tabelle condizioni
    const possibleTables = ['conditions', 'paiements', 'termes', 'clauses'];
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);
        
        if (!error) {
          console.log(`✅ Tabella ${tableName} esiste: ${data.length} record`);
          if (data.length > 0) {
            console.log('   Esempio record:', data[0]);
          }
        }
      } catch (e) {
        console.log(`❌ Tabella ${tableName} non esiste`);
      }
    }
    
    // Controlla anche se ci sono condizioni nei devis di Supabase
    console.log('\n📋 Condizioni nei devis Supabase:');
    const { data: devis, error } = await supabase
      .from('devis')
      .select('*')
      .limit(3);
    
    if (!error && devis) {
      devis.forEach(d => {
        const conditionFields = Object.keys(d).filter(key =>
          key.includes('condition') || key.includes('paiement')
        );
        
        if (conditionFields.length > 0) {
          console.log(`   ${d.numero}: ${conditionFields.join(', ')}`);
        } else {
          console.log(`   ${d.numero}: Nessuna condizione`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

checkConditionsTables();