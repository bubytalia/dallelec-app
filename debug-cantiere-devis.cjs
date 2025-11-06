const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCantiereDevis() {
  try {
    console.log('🔍 Debug cantiere e devis...');
    
    // Chiedi quale cantiere debuggare
    console.log('Inserisci ID cantiere da debuggare (es: 2 per Mikron):');
    
    // Debug Hifi Filter
    const cantiereId = 18; // Hifi Filter
    
    // 1. Trova il cantiere
    const { data: cantiere } = await supabase
      .from('chantiers')
      .select('*')
      .eq('id', cantiereId)
      .single();
    
    console.log(`\n🏗️ Cantiere ${cantiereId}:`, {
      nome: cantiere?.nom,
      devis_id: cantiere?.devis_id,
      gruppo_devis_id: cantiere?.gruppo_devis_id
    });
    
    if (!cantiere?.gruppo_devis_id) {
      console.log('❌ Cantiere non ha gruppo_devis_id!');
      return;
    }
    
    // 2. Trova tutti i devis del gruppo
    const { data: devisGruppo } = await supabase
      .from('devis')
      .select('*')
      .eq('gruppo_devis_id', cantiere.gruppo_devis_id);
    
    console.log(`\n📋 Devis nel gruppo ${cantiere.gruppo_devis_id}:`);
    devisGruppo?.forEach(d => {
      console.log(`- ID: ${d.id}, Numero: ${d.numero}, Nome: "${d.nom}", Prodotti: ${d.produits?.length || 0}`);
    });
    
    // 3. Trova devis con stesso nome/indirizzo (per confronto)
    const { data: devisStessoNome } = await supabase
      .from('devis')
      .select('*')
      .eq('nom', cantiere.nom)
      .eq('adresse', cantiere.adresse);
    
    console.log(`\n🔍 Devis con stesso nome/indirizzo:`);
    devisStessoNome?.forEach(d => {
      console.log(`- ID: ${d.id}, Numero: ${d.numero}, Gruppo: ${d.gruppo_devis_id || 'NESSUNO'}, Prodotti: ${d.produits?.length || 0}`);
    });
    
    // 4. Verifica se ci sono devis non raggruppati
    const devisNonRaggruppati = devisStessoNome?.filter(d => !d.gruppo_devis_id || d.gruppo_devis_id !== cantiere.gruppo_devis_id);
    
    if (devisNonRaggruppati && devisNonRaggruppati.length > 0) {
      console.log(`\n⚠️ Trovati ${devisNonRaggruppati.length} devis NON raggruppati:`);
      devisNonRaggruppati.forEach(d => {
        console.log(`- ${d.numero}: gruppo "${d.gruppo_devis_id || 'NESSUNO'}" (dovrebbe essere "${cantiere.gruppo_devis_id}")`);
      });
      
      // Offri di correggerli
      console.log('\n🔧 Correggendo devis non raggruppati...');
      for (const devis of devisNonRaggruppati) {
        const { error } = await supabase
          .from('devis')
          .update({ gruppo_devis_id: cantiere.gruppo_devis_id })
          .eq('id', devis.id);
        
        if (error) {
          console.error(`❌ Errore correzione devis ${devis.id}:`, error);
        } else {
          console.log(`✅ Devis ${devis.numero} corretto`);
        }
      }
    } else {
      console.log('\n✅ Tutti i devis sono correttamente raggruppati');
    }
    
  } catch (error) {
    console.error('❌ Errore debug:', error);
  }
}

debugCantiereDevis();