// Debug script per controllare tabella paiements
import { supabase } from './src/supabase.js';

async function debugPaiements() {
  console.log('🔍 Controllo tabella paiements...');
  
  // 1. Controlla tutti i paiements
  const { data: paiements, error: paiementsError } = await supabase
    .from('paiements')
    .select('*');
  
  if (paiementsError) {
    console.error('❌ Errore paiements:', paiementsError);
    return;
  }
  
  console.log('📋 Paiements disponibili:', paiements);
  
  // 2. Controlla il devis specifico
  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select('paiement')
    .eq('id', 24)
    .single();
  
  if (devisError) {
    console.error('❌ Errore devis:', devisError);
    return;
  }
  
  console.log('💰 Paiement salvato nel devis 24:', devis.paiement);
  
  // 3. Trova corrispondenza
  const found = paiements.find(p => p.id === devis.paiement);
  console.log('🎯 Paiement trovato:', found);
}

debugPaiements();