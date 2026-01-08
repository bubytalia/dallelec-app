const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function debugArticoloProblematico() {
  try {
    console.log('🔍 Cercando articolo problematico...');
    
    // Cerca l'articolo specifico
    const { data: prodotto, error } = await supabase
      .from('produits')
      .select('*')
      .eq('article', 'SRAIL1000ACOFFRETA')
      .single();
    
    if (error) {
      console.log('❌ Errore:', error);
      return;
    }
    
    if (!prodotto) {
      console.log('❌ Articolo non trovato');
      return;
    }
    
    console.log('✅ Articolo trovato:');
    console.log('ID:', prodotto.id);
    console.log('Article:', prodotto.article);
    console.log('Description:', prodotto.description);
    console.log('Nom:', prodotto.nom);
    console.log('Taille:', prodotto.taille);
    console.log('Unite:', prodotto.unite);
    console.log('Prix:', prodotto.prix);
    console.log('Prezzo_netto:', prodotto.prezzo_netto);
    console.log('Famille_id:', prodotto.famille_id);
    console.log('Sousfamille_id:', prodotto.sousfamille_id);
    
    // Verifica se ci sono caratteri speciali o problemi
    console.log('\n🔍 Analisi caratteri speciali:');
    console.log('Article length:', prodotto.article?.length);
    console.log('Description length:', prodotto.description?.length);
    console.log('Article bytes:', Buffer.from(prodotto.article || '').toString('hex'));
    
    // Verifica se ci sono valori null o undefined problematici
    console.log('\n🔍 Verifica valori null/undefined:');
    Object.keys(prodotto).forEach(key => {
      const value = prodotto[key];
      if (value === null || value === undefined) {
        console.log(`${key}: ${value}`);
      }
      if (typeof value === 'string' && value.includes('\0')) {
        console.log(`${key} contiene caratteri null!`);
      }
    });
    
    // Test di serializzazione JSON
    console.log('\n🔍 Test serializzazione JSON:');
    try {
      const jsonString = JSON.stringify(prodotto);
      console.log('✅ JSON serialization OK');
      console.log('JSON length:', jsonString.length);
    } catch (e) {
      console.log('❌ JSON serialization FAILED:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

debugArticoloProblematico();