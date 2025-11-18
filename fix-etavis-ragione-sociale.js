// Script per aggiornare la ragione sociale Etavis in tutto il sistema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEtavisRagioneSociale() {
  try {
    console.log('🔄 AGGIORNAMENTO RAGIONE SOCIALE ETAVIS');
    console.log('Da: "Etavis SA" → A: "Etavis Romandie SA"\n');
    
    const vecchioNome = 'Etavis SA';
    const nuovoNome = 'Etavis Romandie SA';
    
    // 1. AGGIORNA CANTIERI
    console.log('🏗️ Aggiornamento cantieri...');
    const { data: chantiersAggiornati, error: chantiersError } = await supabase
      .from('chantiers')
      .update({ client: nuovoNome })
      .eq('client', vecchioNome)
      .select();
    
    if (chantiersError) {
      console.error('❌ Errore aggiornamento cantieri:', chantiersError);
    } else {
      console.log(`✅ ${chantiersAggiornati.length} cantieri aggiornati`);
      chantiersAggiornati.forEach(c => console.log(`   - ${c.nom}`));
    }
    
    // 2. AGGIORNA FATTURE
    console.log('\n💰 Aggiornamento fatture...');
    const { data: fattureAggiornate, error: fattureError } = await supabase
      .from('factures')
      .update({ client_nom: nuovoNome })
      .eq('client_nom', vecchioNome)
      .select();
    
    if (fattureError) {
      console.error('❌ Errore aggiornamento fatture:', fattureError);
    } else {
      console.log(`✅ ${fattureAggiornate.length} fatture aggiornate`);
      fattureAggiornate.forEach(f => console.log(`   - ${f.numero}`));
    }
    
    // 3. VERIFICA FINALE
    console.log('\n🔍 Verifica finale...');
    
    // Conta cantieri con vecchio nome
    const { count: chantiersVecchi } = await supabase
      .from('chantiers')
      .select('*', { count: 'exact', head: true })
      .eq('client', vecchioNome);
    
    // Conta fatture con vecchio nome
    const { count: fattureVecchie } = await supabase
      .from('factures')
      .select('*', { count: 'exact', head: true })
      .eq('client_nom', vecchioNome);
    
    console.log(`📊 Cantieri con "${vecchioNome}": ${chantiersVecchi || 0}`);
    console.log(`📊 Fatture con "${vecchioNome}": ${fattureVecchie || 0}`);
    
    if ((chantiersVecchi || 0) === 0 && (fattureVecchie || 0) === 0) {
      console.log('\n🎉 SUCCESSO! Tutti i dati sono stati aggiornati correttamente');
      console.log('Ora tutte le fatture future useranno automaticamente "Etavis Romandie SA"');
    } else {
      console.log('\n⚠️ Alcuni record potrebbero non essere stati aggiornati');
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

// Esegui lo script
fixEtavisRagioneSociale();