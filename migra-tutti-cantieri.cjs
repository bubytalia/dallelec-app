const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migraTuttiCantieri() {
  try {
    console.log('🔄 Migrazione cantieri al sistema gruppo_devis_id...');
    
    // 1. Trova tutti i cantieri che hanno devis_id ma non gruppo_devis_id
    const { data: cantieri } = await supabase
      .from('chantiers')
      .select('*')
      .not('devis_id', 'is', null)
      .is('gruppo_devis_id', null);
    
    console.log(`🏗️ Trovati ${cantieri?.length || 0} cantieri da migrare`);
    
    if (!cantieri || cantieri.length === 0) {
      console.log('✅ Nessun cantiere da migrare');
      return;
    }
    
    // 2. Per ogni cantiere, crea un gruppo e migra
    for (const cantiere of cantieri) {
      console.log(`\n🔧 Migrando cantiere ${cantiere.id}: ${cantiere.nom}`);
      
      // Crea gruppo unico per questo cantiere
      const gruppoId = `GRUPPO_${cantiere.id}_${Date.now()}`;
      
      // Aggiorna il devis con il gruppo
      const { error: devisError } = await supabase
        .from('devis')
        .update({ gruppo_devis_id: gruppoId })
        .eq('id', cantiere.devis_id);
      
      if (devisError) {
        console.error(`❌ Errore aggiornamento devis ${cantiere.devis_id}:`, devisError);
        continue;
      }
      
      // Aggiorna il cantiere con il gruppo
      const { error: cantiereError } = await supabase
        .from('chantiers')
        .update({ gruppo_devis_id: gruppoId })
        .eq('id', cantiere.id);
      
      if (cantiereError) {
        console.error(`❌ Errore aggiornamento cantiere ${cantiere.id}:`, cantiereError);
      } else {
        console.log(`✅ Cantiere ${cantiere.id} migrato al gruppo ${gruppoId}`);
      }
    }
    
    console.log('\n🎉 Migrazione completata!');
    
  } catch (error) {
    console.error('❌ Errore migrazione:', error);
  }
}

migraTuttiCantieri();