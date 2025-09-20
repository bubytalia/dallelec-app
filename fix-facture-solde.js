// Script per correggere la fattura con il solde à payer
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFactureSolde() {
  try {
    const accontiHT = 10000;
    const totalHT = 27750.54;
    const imponibileResiduoHT = totalHT - accontiHT;
    const tvaResiduo = imponibileResiduoHT * 0.081;
    const soldeAPayer = imponibileResiduoHT + tvaResiduo;
    
    console.log(`Solde à payer: ${soldeAPayer.toFixed(2)} CHF`);
    
    const { error } = await supabase
      .from('factures')
      .update({
        montant_ttc: soldeAPayer,
        notes: 'Facture avec acconti HT: 10000.00 CHF - Solde à payer'
      })
      .eq('numero', 'F2025-052');
    
    if (error) throw error;
    console.log('✅ Fattura aggiornata con solde à payer!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixFactureSolde();