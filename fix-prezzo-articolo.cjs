const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function fixPrezzoArticolo() {
  try {
    console.log('🔧 Correggendo prezzo articolo SRAIL1000ACOFFRETA...');
    
    // Aggiorna solo il prezzo
    const { error } = await supabase
      .from('produits')
      .update({
        prix: 1500.00 // Prezzo ragionevole per un coffret 1000A
      })
      .eq('article', 'SRAIL1000ACOFFRETA');
    
    if (error) {
      console.error('❌ Errore aggiornamento:', error);
      return;
    }
    
    console.log('✅ Prezzo corretto: 1500.00 CHF');
    
    // Verifica la correzione
    const { data: prodotto } = await supabase
      .from('produits')
      .select('article, description, prix')
      .eq('article', 'SRAIL1000ACOFFRETA')
      .single();
    
    console.log('✅ Verifica:', prodotto);
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

fixPrezzoArticolo();