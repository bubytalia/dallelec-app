import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFactureMigros() {
  try {
    console.log('🔧 Correzione fattura Migros F2025-060...');
    
    // Trova la fattura F2025-060
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('*')
      .eq('numero', 'F2025-060')
      .single();
    
    if (factureError) {
      console.error('❌ Errore nel trovare la fattura:', factureError);
      return;
    }
    
    console.log('📄 Fattura trovata:', facture);
    
    // Calcola il montant corretto
    const montantProduits = 9844.50; // Dal PDF
    const montantRegies = 225.00;    // Dal PDF
    const totalHT = montantProduits + montantRegies; // 10069.50
    const tva = totalHT * 0.081; // 815.63
    const totalTTC = totalHT + tva; // 10885.13
    
    console.log('💰 Calcoli corretti:');
    console.log('  - Produits: 9844.50 CHF');
    console.log('  - Régies: 225.00 CHF');
    console.log('  - Total HT: ' + totalHT.toFixed(2) + ' CHF');
    console.log('  - TVA: ' + tva.toFixed(2) + ' CHF');
    console.log('  - Total TTC: ' + totalTTC.toFixed(2) + ' CHF');
    
    // Aggiorna la fattura
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: totalHT,
        montant_ttc: totalTTC
      })
      .eq('numero', 'F2025-060');
    
    if (updateError) {
      console.error('❌ Errore aggiornamento:', updateError);
      return;
    }
    
    console.log('✅ Fattura F2025-060 corretta con successo!');
    console.log('✅ Ora l\'anteprima mostrerà i totali corretti');
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

fixFactureMigros();