// Script per correggere la fattura con acconti
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFactureAvecAcconti() {
  try {
    const accontiHT = 10000; // Acconto indicato
    const totalHT = 27750.54; // Total lavori + régies
    const imponibileResiduoHT = totalHT - accontiHT;
    const tvaResiduo = imponibileResiduoHT * 0.081;
    const soldeAPayer = imponibileResiduoHT + tvaResiduo;
    
    console.log('🧮 CALCOLO CON ACCONTI:');
    console.log(`Total HT: ${totalHT.toFixed(2)} CHF`);
    console.log(`Acconti HT: -${accontiHT.toFixed(2)} CHF`);
    console.log(`Imponibile residuo: ${imponibileResiduoHT.toFixed(2)} CHF`);
    console.log(`TVA (8.1%): ${tvaResiduo.toFixed(2)} CHF`);
    console.log(`Solde à payer: ${soldeAPayer.toFixed(2)} CHF`);
    
    // Aggiorna la fattura con il solde à payer
    const { error } = await supabase
      .from('factures')
      .update({
        montant_ht: totalHT,
        montant_ttc: soldeAPayer, // Il TTC diventa il solde à payer
        acconti_ht: accontiHT,
        notes: 'Facture générée depuis resoconto percentuel 2025-09 - Acconti HT: 10000.00 CHF'
      })
      .eq('numero', 'F2025-052');
    
    if (error) throw error;
    
    console.log('✅ Fattura aggiornata con acconti!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixFactureAvecAcconti();