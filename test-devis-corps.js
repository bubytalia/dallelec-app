// Test per verificare colonne devis à corps
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDevisCorps() {
  console.log('🔍 Test colonne devis à corps...');
  
  try {
    // Test 1: Verifica struttura tabella
    const { data, error } = await supabase
      .from('devis')
      .select('id, description_corps, montant_corps, modalita_prezzi')
      .limit(1);
    
    if (error) {
      console.error('❌ Errore:', error.message);
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('🚨 Le colonne description_corps e/o montant_corps NON esistono!');
        console.log('📝 Eseguire lo script SQL: add-devis-corps-columns.sql');
      }
      return;
    }
    
    console.log('✅ Colonne esistono nel database');
    console.log('📊 Dati test:', data);
    
    // Test 2: Cerca devis à corps esistenti
    const { data: corpsDevis, error: corpsError } = await supabase
      .from('devis')
      .select('*')
      .eq('modalita_prezzi', 'aCorps');
    
    if (corpsError) {
      console.error('❌ Errore ricerca devis à corps:', corpsError);
      return;
    }
    
    console.log(`📋 Trovati ${corpsDevis.length} devis à corps esistenti`);
    if (corpsDevis.length > 0) {
      console.log('🔍 Primo devis à corps:', corpsDevis[0]);
    }
    
  } catch (err) {
    console.error('❌ Errore generale:', err);
  }
}

testDevisCorps();