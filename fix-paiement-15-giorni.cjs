const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function fixPaiement15Giorni() {
  try {
    console.log('🔧 Correzione modalità pagamento "15 jours net"...');
    
    // Correggi il campo jours_echeance per "15 jours net"
    const { data, error } = await supabase
      .from('paiements')
      .update({ 
        jours_echeance: 15  // Correggi da 30 a 15
      })
      .eq('nom', '15 jours net')
      .select();
    
    if (error) throw error;
    
    console.log('✅ Modalità pagamento corretta:', data);
    
    // Verifica tutte le modalità
    const { data: allPaiements, error: allError } = await supabase
      .from('paiements')
      .select('*');
    
    if (allError) throw allError;
    
    console.log('\n📋 Tutte le modalità di pagamento:');
    allPaiements.forEach(p => {
      console.log(`${p.nom}: giorni_calcolo=${p.giorni_calcolo}, jours_echeance=${p.jours_echeance}`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixPaiement15Giorni();