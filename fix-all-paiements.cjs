const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function fixAllPaiements() {
  try {
    console.log('🔧 Correzione di tutti i metodi di pagamento...');
    
    // Correggi Chèque: 7 giorni per entrambi i campi
    await supabase
      .from('paiements')
      .update({ jours_echeance: 7 })
      .eq('nom', 'Chèque');
    
    // Correggi Virement bancaire: 7 giorni per entrambi i campi  
    await supabase
      .from('paiements')
      .update({ jours_echeance: 7 })
      .eq('nom', 'Virement bancaire');
    
    console.log('✅ Correzioni applicate');
    
    // Verifica risultato finale
    const { data: allPaiements } = await supabase
      .from('paiements')
      .select('*')
      .order('nom');
    
    console.log('\n📋 Tutti i metodi di pagamento corretti:');
    allPaiements.forEach(p => {
      const match = p.giorni_calcolo === p.jours_echeance ? '✅' : '❌';
      console.log(`${match} ${p.nom}: calcolo=${p.giorni_calcolo}, echeance=${p.jours_echeance}`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixAllPaiements();