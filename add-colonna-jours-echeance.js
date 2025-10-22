import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColonnaJoursEcheance() {
  console.log('🔧 AGGIUNTA COLONNA jours_echeance\n');

  try {
    // Esegui SQL per aggiungere colonna
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE paiements 
        ADD COLUMN IF NOT EXISTS jours_echeance INTEGER DEFAULT 30;
      `
    });

    if (alterError) {
      console.log('❌ Errore ALTER TABLE:', alterError.message);
      console.log('⚠️ Provo metodo alternativo...');
      
      // Metodo alternativo: aggiorna direttamente i record
      const metodiPagamento = [
        { nom: 'Comptant', jours_echeance: 0 },
        { nom: '30 jours net', jours_echeance: 30 },
        { nom: '60 jours net', jours_echeance: 60 },
        { nom: 'Virement bancaire', jours_echeance: 30 },
        { nom: 'Chèque', jours_echeance: 30 }
      ];

      console.log('📝 Aggiornamento manuale record...');
      for (const metodo of metodiPagamento) {
        const { error } = await supabase
          .from('paiements')
          .update({ jours_echeance: metodo.jours_echeance })
          .eq('nom', metodo.nom);
        
        if (error) {
          console.log(`❌ ${metodo.nom}: ${error.message}`);
        } else {
          console.log(`✅ ${metodo.nom}: ${metodo.jours_echeance} giorni`);
        }
      }
    } else {
      console.log('✅ Colonna aggiunta con successo');
      
      // Aggiorna i valori
      const updates = [
        { nom: 'Comptant', jours_echeance: 0 },
        { nom: '30 jours net', jours_echeance: 30 },
        { nom: '60 jours net', jours_echeance: 60 },
        { nom: 'Virement bancaire', jours_echeance: 30 },
        { nom: 'Chèque', jours_echeance: 30 }
      ];

      for (const update of updates) {
        await supabase
          .from('paiements')
          .update({ jours_echeance: update.jours_echeance })
          .eq('nom', update.nom);
        console.log(`✅ ${update.nom}: ${update.jours_echeance} giorni`);
      }
    }

    // Verifica finale
    console.log('\n📊 VERIFICA FINALE:');
    const { data } = await supabase.from('paiements').select('*');
    data?.forEach(p => {
      console.log(`  ${p.nom}: ${p.jours_echeance || 'NON IMPOSTATO'} giorni`);
    });

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

addColonnaJoursEcheance();