import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugCantiere2() {
  console.log('🔍 Verifica cantiere ID 2...\n');
  
  try {
    // 1. Verifica cantiere
    const { data: cantiere, error: errorCantiere } = await supabase
      .from('chantiers')
      .select('*')
      .eq('id', 2)
      .single();
    
    if (errorCantiere) {
      console.error('❌ Errore cantiere:', errorCantiere);
      return;
    }
    
    console.log('📋 CANTIERE ID 2:');
    console.log('- Nome:', cantiere.nom);
    console.log('- Modalità:', cantiere.modalitaResoconto);
    console.log('- Capocantiere:', cantiere.capocantiere);
    console.log('- devis_id:', cantiere.devis_id);
    console.log('- devisId:', cantiere.devisId);
    console.log('- Tutti i campi:', Object.keys(cantiere));
    console.log('\n');
    
    // 2. Verifica devis associato
    const devisId = cantiere.devis_id || cantiere.devisId;
    if (devisId) {
      console.log('🔍 Verifica devis ID:', devisId);
      
      const { data: devis, error: errorDevis } = await supabase
        .from('devis')
        .select('*')
        .eq('id', devisId)
        .single();
      
      if (errorDevis) {
        console.error('❌ Errore devis:', errorDevis);
      } else {
        console.log('📄 DEVIS TROVATO:');
        console.log('- ID:', devis.id);
        console.log('- Nome cliente:', devis.nom);
        console.log('- Numero prodotti:', devis.produits?.length || 0);
        
        if (devis.produits?.length > 0) {
          const zones = [...new Set(devis.produits.map(p => p.zone).filter(z => z))];
          console.log('- Zone:', zones);
        }
      }
    } else {
      console.log('❌ NESSUN DEVIS ASSOCIATO AL CANTIERE');
    }
    
    // 3. Verifica tutti i cantieri percentuali
    console.log('\n🔍 Tutti i cantieri percentuali:');
    const { data: chantiersPerc, error: errorPerc } = await supabase
      .from('chantiers')
      .select('id, nom, modalitaResoconto, devis_id, devisId')
      .eq('modalitaResoconto', 'percentuale');
    
    if (chantiersPerc) {
      chantiersPerc.forEach(c => {
        console.log(`- ID ${c.id}: ${c.nom} (devis: ${c.devis_id || c.devisId || 'NESSUNO'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

debugCantiere2();