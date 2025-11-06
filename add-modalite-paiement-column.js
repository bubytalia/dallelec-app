import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addModalitePaiementColumn() {
  try {
    console.log('🔧 Aggiunta colonna modalite_paiement alla tabella factures...');
    
    // Esegui la query SQL per aggiungere la colonna
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE factures 
        ADD COLUMN IF NOT EXISTS modalite_paiement TEXT DEFAULT '30 jours net';
        
        UPDATE factures 
        SET modalite_paiement = '30 jours net' 
        WHERE modalite_paiement IS NULL;
      `
    });
    
    if (error) {
      console.error('❌ Errore:', error);
      return;
    }
    
    console.log('✅ Colonna modalite_paiement aggiunta con successo!');
    console.log('✅ Fatture esistenti aggiornate con modalità di default');
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

addModalitePaiementColumn();