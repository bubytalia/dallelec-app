import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function fixTvaFatture() {
  console.log('🔧 Correzione TVA fatture esistenti...');
  
  try {
    // Trova tutte le fatture con TVA 20%
    const { data: fatture, error: selectError } = await supabase
      .from('factures')
      .select('*')
      .eq('taux_tva', 20);
    
    if (selectError) throw selectError;
    
    console.log(`📋 Trovate ${fatture?.length || 0} fatture con TVA 20%`);
    
    if (!fatture || fatture.length === 0) {
      console.log('✅ Nessuna fattura da correggere');
      return;
    }
    
    // Aggiorna ogni fattura
    for (const fattura of fatture) {
      const montantHT = Number(fattura.montant_ht || 0);
      const nuovoMontantTVA = montantHT * 0.081; // 8.1%
      const nuovoMontantTTC = montantHT + nuovoMontantTVA;
      
      const { error: updateError } = await supabase
        .from('factures')
        .update({
          taux_tva: 8.1,
          montant_ttc: nuovoMontantTTC
        })
        .eq('id', fattura.id);
      
      if (updateError) {
        console.error(`❌ Errore fattura ${fattura.numero}:`, updateError);
      } else {
        console.log(`✅ Fattura ${fattura.numero}: TVA 20% → 8.1%`);
      }
    }
    
    console.log('🎉 Correzione completata!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixTvaFatture();