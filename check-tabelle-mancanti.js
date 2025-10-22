import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTabelleMancanti() {
  console.log('🔍 CHECK TABELLE SUPABASE\n');

  const tabelleDaVerificare = [
    'paiements',
    'conditions', 
    'configurazione_fatture',
    'factures',
    'clients',
    'chantiers',
    'devis'
  ];

  for (const tabella of tabelleDaVerificare) {
    try {
      const { data, error } = await supabase.from(tabella).select('*').limit(1);
      
      if (error) {
        console.log(`❌ ${tabella}: ${error.message}`);
      } else {
        console.log(`✅ ${tabella}: OK (${data?.length || 0} record)`);
        
        // Mostra struttura per paiements
        if (tabella === 'paiements' && data?.[0]) {
          console.log('   Colonne:', Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`❌ ${tabella}: ${err.message}`);
    }
  }

  // Verifica se esiste colonna jours_echeance in paiements
  console.log('\n🔍 STRUTTURA PAIEMENTS:');
  try {
    const { data } = await supabase.from('paiements').select('*').limit(1);
    if (data?.[0]) {
      console.log('Colonne esistenti:', Object.keys(data[0]));
    }
  } catch (err) {
    console.log('Errore:', err.message);
  }
}

checkTabelleMancanti();