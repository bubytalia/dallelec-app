const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGruppoMikron() {
  try {
    console.log('🧪 Test gruppo devis per Mikron...');
    
    // 1. Trova devis Mikron
    const { data: devisMikron } = await supabase
      .from('devis')
      .select('*')
      .ilike('nom', '%Mikron%');
    
    console.log(`📋 Trovati ${devisMikron?.length || 0} devis Mikron`);
    
    if (!devisMikron || devisMikron.length === 0) {
      console.log('❌ Nessun devis Mikron trovato');
      return;
    }
    
    // 2. Crea gruppo_devis_id per Mikron
    const gruppoId = `GRUPPO_MIKRON_${Date.now()}`;
    console.log(`🔗 Creando gruppo: ${gruppoId}`);
    
    // 3. Assegna stesso gruppo a tutti i devis Mikron
    for (const devis of devisMikron) {
      console.log(`📝 Aggiornando devis ${devis.numero} con gruppo ${gruppoId}`);
      
      const { error } = await supabase
        .from('devis')
        .update({ gruppo_devis_id: gruppoId })
        .eq('id', devis.id);
      
      if (error) {
        console.error(`❌ Errore devis ${devis.id}:`, error);
      } else {
        console.log(`✅ Devis ${devis.numero} aggiornato`);
      }
    }
    
    // 4. Aggiorna cantiere Mikron
    console.log('🏗️ Aggiornando cantiere Mikron...');
    
    const { error: cantiereError } = await supabase
      .from('chantiers')
      .update({ gruppo_devis_id: gruppoId })
      .eq('id', 2);
    
    if (cantiereError) {
      console.error('❌ Errore cantiere:', cantiereError);
    } else {
      console.log('✅ Cantiere Mikron aggiornato');
    }
    
    console.log('🎉 Test completato! Ora prova il resoconto finale.');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

testGruppoMikron();