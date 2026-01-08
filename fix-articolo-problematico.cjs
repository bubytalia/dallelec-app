const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function fixArticoloProblematico() {
  try {
    console.log('🔧 Correggendo articolo SRAIL1000ACOFFRETA...');
    
    // Aggiorna l'articolo con un prezzo di default
    const { error } = await supabase
      .from('produits')
      .update({
        prix: 1500.00, // Prezzo ragionevole per un coffret 1000A
        nom: 'Coffret alimentation (1000 A)' // Aggiungi anche il nom mancante
      })
      .eq('article', 'SRAIL1000ACOFFRETA');
    
    if (error) {
      console.error('❌ Errore aggiornamento:', error);
      return;
    }
    
    console.log('✅ Articolo corretto con successo!');
    console.log('- Prix: 1500.00 CHF');
    console.log('- Nom: Coffret alimentation (1000 A)');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

fixArticoloProblematico();