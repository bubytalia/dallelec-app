// Debug script per verificare la struttura della tabella factures
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFacturesTable() {
  console.log('🔍 VERIFICA TABELLA FACTURES');
  
  try {
    // 1. Test lettura factures con tutte le colonne
    const { data: facturesTest, error: facturesError } = await supabase
      .from('factures')
      .select('*')
      .limit(1);
    
    if (facturesError) {
      console.error('❌ Errore lettura factures:', facturesError);
    } else {
      console.log('✅ Test lettura factures OK:', facturesTest.length, 'record trovati');
      if (facturesTest.length > 0) {
        console.log('📄 Colonne disponibili:', Object.keys(facturesTest[0]));
        console.log('📄 Prima fattura:', facturesTest[0]);
      }
    }
    
    // 2. Test aggiornamento solo statut
    if (facturesTest && facturesTest.length > 0) {
      const testFacture = facturesTest[0];
      console.log(`🧪 Test aggiornamento statut fattura ${testFacture.numero}...`);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('factures')
        .update({
          statut: testFacture.statut // Stesso valore per non cambiare nulla
        })
        .eq('id', testFacture.id)
        .select();
      
      if (updateError) {
        console.error('❌ ERRORE AGGIORNAMENTO:', updateError);
        console.log('Dettagli errore:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
      } else {
        console.log('✅ Test aggiornamento statut OK:', updateResult);
      }
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

// Esegui il debug
debugFacturesTable();