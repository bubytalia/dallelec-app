// Script per verificare e correggere il montant della fattura
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFactureMontant() {
  try {
    // 1. Trova la fattura F2025-052
    const { data: facture, error: errorFacture } = await supabase
      .from('factures')
      .select('*')
      .eq('numero', 'F2025-052')
      .single();
    
    if (errorFacture) throw errorFacture;
    
    console.log('🔍 Fattura trovata:', facture);
    console.log('💰 Montant attuale HT:', facture.montant_ht);
    console.log('💰 Montant attuale TTC:', facture.montant_ttc);
    
    // 2. Trova il resoconto associato
    if (facture.resoconto_id) {
      const { data: resoconto } = await supabase
        .from('resoconti_percentuali')
        .select('*')
        .eq('id', facture.resoconto_id)
        .single();
      
      console.log('📋 Resoconto associato:', resoconto);
      
      // 3. Calcola il montant corretto
      const montantTravauxHT = 25950.54; // Dal resoconto
      const montantRegiesHT = 1800.00; // 24h × 75 CHF
      const totalHT = montantTravauxHT + montantRegiesHT;
      const tva = totalHT * 0.081;
      const totalTTC = totalHT + tva;
      
      console.log('🧮 CALCOLO CORRETTO:');
      console.log(`Travaux HT: ${montantTravauxHT.toFixed(2)} CHF`);
      console.log(`Régies HT: ${montantRegiesHT.toFixed(2)} CHF`);
      console.log(`Total HT: ${totalHT.toFixed(2)} CHF`);
      console.log(`TVA (8.1%): ${tva.toFixed(2)} CHF`);
      console.log(`Total TTC: ${totalTTC.toFixed(2)} CHF`);
      
      // 4. Aggiorna la fattura
      const { error: updateError } = await supabase
        .from('factures')
        .update({
          montant_ht: totalHT,
          montant_ttc: totalTTC,
          taux_tva: 8.1
        })
        .eq('id', facture.id);
      
      if (updateError) throw updateError;
      
      console.log('✅ Fattura aggiornata con montanti corretti!');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixFactureMontant();