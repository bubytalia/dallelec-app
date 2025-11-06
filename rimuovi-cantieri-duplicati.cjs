const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function rimuoviCantieriDuplicati() {
  try {
    // Trova cantieri Mikron
    const { data: cantieriMikron } = await supabase
      .from('chantiers')
      .select('*')
      .ilike('nom', '%Mikron%')
      .order('id');
    
    console.log('🏗️ Cantieri Mikron trovati:');
    cantieriMikron?.forEach(c => {
      console.log(`- ID: ${c.id}, Numero: ${c.numero_cantiere}, Nome: "${c.nom}"`);
    });
    
    // Rimuovi cantieri con ID > 2 (quelli creati per errore)
    const cantieriDaRimuovere = cantieriMikron?.filter(c => c.id > 2) || [];
    
    if (cantieriDaRimuovere.length > 0) {
      console.log('🗑️ Rimuovendo cantieri duplicati:');
      for (const cantiere of cantieriDaRimuovere) {
        console.log(`- Rimuovendo cantiere ID ${cantiere.id}: ${cantiere.numero_cantiere}`);
        
        const { error } = await supabase
          .from('chantiers')
          .delete()
          .eq('id', cantiere.id);
        
        if (error) {
          console.error(`❌ Errore rimozione cantiere ${cantiere.id}:`, error);
        } else {
          console.log(`✅ Cantiere ${cantiere.id} rimosso`);
        }
      }
    } else {
      console.log('✅ Nessun cantiere duplicato da rimuovere');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

rimuoviCantieriDuplicati();