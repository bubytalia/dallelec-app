const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCantiereWithMultipleDevis() {
  try {
    console.log('🔍 Caricamento devis...');
    
    // 1. Trova tutti i devis dello stesso cantiere
    const { data: allDevis } = await supabase
      .from('devis')
      .select('id, nom, adresse');
    
    console.log(`📋 Trovati ${allDevis?.length || 0} devis`);
    
    if (!allDevis || allDevis.length === 0) {
      console.log('⚠️ Nessun devis trovato');
      return;
    }
    
    // 2. Raggruppa per cantiere (nome + indirizzo)
    const cantieriMap = new Map();
    
    allDevis.forEach(devis => {
      const key = `${devis.nom || ''}-${devis.adresse || ''}`;
      if (!cantieriMap.has(key)) {
        cantieriMap.set(key, []);
      }
      cantieriMap.get(key).push(devis.id);
    });
    
    console.log(`🏗️ Trovati ${cantieriMap.size} cantieri unici`);
    
    // 3. Aggiorna cantieri con devis_ids array
    const { data: cantieri } = await supabase
      .from('chantiers')
      .select('*');
    
    console.log(`🏢 Trovati ${cantieri.length} cantieri nel database`);
    
    for (const cantiere of cantieri) {
      const key = `${cantiere.nom || ''}-${cantiere.adresse || ''}`;
      const devisIds = cantieriMap.get(key) || [];
      
      if (devisIds.length > 0) {
        console.log(`🔄 Aggiornando cantiere "${cantiere.nom}": ${devisIds.length} devis [${devisIds.join(', ')}]`);
        
        const { error } = await supabase
          .from('chantiers')
          .update({ 
            devis_ids: devisIds,
            devis_id: devisIds[0] // Mantieni compatibilità
          })
          .eq('id', cantiere.id);
          
        if (error) {
          console.error(`❌ Errore aggiornamento cantiere ${cantiere.id}:`, error);
        } else {
          console.log(`✅ Cantiere ${cantiere.id} aggiornato`);
        }
      } else {
        console.log(`⚠️ Nessun devis trovato per cantiere "${cantiere.nom}"`);
      }
    }
    
    console.log('🎉 Aggiornamento completato!');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

updateCantiereWithMultipleDevis();