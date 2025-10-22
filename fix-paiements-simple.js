import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPaiementsSimple() {
  console.log('🔧 FIX PAIEMENTS - SOLO GIORNI\n');

  try {
    // Aggiorna solo jours_echeance
    const metodiPagamento = [
      { nom: 'Comptant', jours_echeance: 0 },
      { nom: '30 jours net', jours_echeance: 30 },
      { nom: '60 jours net', jours_echeance: 60 },
      { nom: 'Virement bancaire', jours_echeance: 30 },
      { nom: 'Chèque', jours_echeance: 30 }
    ];

    for (const metodo of metodiPagamento) {
      const { error } = await supabase
        .from('paiements')
        .update({ jours_echeance: metodo.jours_echeance })
        .eq('nom', metodo.nom);
      
      if (error) {
        console.log(`❌ Errore ${metodo.nom}:`, error.message);
      } else {
        console.log(`✅ ${metodo.nom}: ${metodo.jours_echeance} giorni`);
      }
    }

    // Verifica risultato
    console.log('\n📊 VERIFICA FINALE:');
    const { data: paiements } = await supabase.from('paiements').select('*');
    paiements?.forEach(p => {
      console.log(`  ${p.nom}: ${p.jours_echeance} giorni`);
    });

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixPaiementsSimple();