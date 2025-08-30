// Script per aggiornare la tabella devis con i campi mancanti
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDevisTable() {
  console.log('🔧 Aggiornamento tabella devis...');
  
  try {
    // Esegui le query SQL per aggiungere i campi mancanti
    const queries = [
      'ALTER TABLE devis ADD COLUMN IF NOT EXISTS zones JSONB',
      'ALTER TABLE devis ADD COLUMN IF NOT EXISTS modalita_prezzi TEXT DEFAULT \'scontistica\'',
      'ALTER TABLE devis ADD COLUMN IF NOT EXISTS remises JSONB',
      'ALTER TABLE devis ADD COLUMN IF NOT EXISTS produits JSONB',
      'ALTER TABLE devis ADD COLUMN IF NOT EXISTS discount DECIMAL(5,2) DEFAULT 0',
      'ALTER TABLE devis ADD COLUMN IF NOT EXISTS draft BOOLEAN DEFAULT true',
      'ALTER TABLE devis ADD COLUMN IF NOT EXISTS data_congelati JSONB'
    ];
    
    for (const query of queries) {
      console.log(`Eseguendo: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error(`❌ Errore: ${error.message}`);
      } else {
        console.log('✅ Query eseguita con successo');
      }
    }
    
    console.log('🎉 Aggiornamento tabella devis completato!');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

updateDevisTable();