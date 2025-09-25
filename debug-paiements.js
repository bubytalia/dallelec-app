// Debug script per controllare i dati nella tabella paiements
import { supabase } from './src/supabase.js';

async function debugPaiements() {
  console.log('🔍 Debug tabella paiements...');
  
  try {
    // 1. Tutti i paiements
    const { data: paiements, error } = await supabase
      .from('paiements')
      .select('*');
    
    if (error) throw error;
    
    console.log('📋 Paiements nella tabella:');
    paiements.forEach((p, i) => {
      console.log(`${i}: ID=${p.id} (tipo: ${typeof p.id}) - Nome: "${p.nom}"`);
    });
    
    // 2. Controlla un devis specifico
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select('id, paiement')
      .limit(5);
    
    if (devisError) throw devisError;
    
    console.log('\n💰 Paiements nei devis:');
    devis.forEach(d => {
      console.log(`Devis ${d.id}: paiement=${d.paiement} (tipo: ${typeof d.paiement})`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

debugPaiements();