const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjI4NzQsImV4cCI6MjA1MDUzODg3NH0.Ej_Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCantiereWithMultipleDevis() {
  try {
    // 1. Trova tutti i devis dello stesso cantiere
    const { data: allDevis } = await supabase
      .from('devis')
      .select('id, nom, adresse');
    
    // 2. Raggruppa per cantiere (nome + indirizzo)
    const cantieriMap = new Map();
    
    allDevis.forEach(devis => {
      const key = `${devis.nom}-${devis.adresse}`;
      if (!cantieriMap.has(key)) {
        cantieriMap.set(key, []);
      }
      cantieriMap.get(key).push(devis.id);
    });
    
    // 3. Aggiorna cantieri con devis_ids array
    const { data: cantieri } = await supabase
      .from('chantiers')
      .select('*');
    
    for (const cantiere of cantieri) {
      const key = `${cantiere.nom}-${cantiere.adresse}`;
      const devisIds = cantieriMap.get(key) || [];
      
      if (devisIds.length > 0) {
        console.log(`Aggiornando cantiere ${cantiere.nom}: ${devisIds.length} devis`);
        
        await supabase
          .from('chantiers')
          .update({ 
            devis_ids: devisIds,
            devis_id: devisIds[0] // Mantieni compatibilità
          })
          .eq('id', cantiere.id);
      }
    }
    
    console.log('✅ Aggiornamento completato!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

updateCantiereWithMultipleDevis();