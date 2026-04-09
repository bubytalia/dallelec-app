import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMikronMatch() {
  // Trova cantiere MIKRON
  const { data: cantiere } = await supabase
    .from('chantiers')
    .select('*')
    .ilike('nom', '%MIKRON%')
    .single();
  
  console.log('📋 CANTIERE:');
  console.log(`   Nome: "${cantiere.nom}"`);
  console.log(`   Indirizzo: "${cantiere.adresse}"`);
  console.log(`   Capo: ${cantiere.capocantiere}\n`);
  
  // Trova devis MIKRON
  const { data: allDevis } = await supabase
    .from('devis')
    .select('*')
    .ilike('nom', '%MIKRON%');
  
  console.log(`📄 DEVIS MIKRON (${allDevis.length}):\n`);
  allDevis.forEach(d => {
    console.log(`   Nome: "${d.nom}"`);
    console.log(`   Indirizzo: "${d.adresse}"`);
    console.log(`   Numero: ${d.numero}`);
    console.log(`   Prodotti: ${d.produits?.length || 0}\n`);
  });
  
  // Test query come nel codice
  console.log('🔍 TEST QUERY (come nel codice):\n');
  const { data: testDevis, error } = await supabase
    .from('devis')
    .select('*')
    .or(`nom.eq."${cantiere.nom}",adresse.eq."${cantiere.adresse}"`);
  
  console.log(`   Query: nom.eq."${cantiere.nom}" OR adresse.eq."${cantiere.adresse}"`);
  console.log(`   Risultati: ${testDevis?.length || 0}`);
  
  if (error) {
    console.log(`   Errore: ${error.message}\n`);
  }
  
  if (!testDevis || testDevis.length === 0) {
    console.log('\n❌ NESSUN MATCH!\n');
    console.log('💡 CAUSA: Nome o indirizzo non corrispondono esattamente\n');
    console.log('🔧 SOLUZIONE: Aggiorna il devis con:');
    console.log(`   Nome: "${cantiere.nom}"`);
    console.log(`   OPPURE`);
    console.log(`   Indirizzo: "${cantiere.adresse}"`);
  } else {
    console.log('\n✅ MATCH TROVATO!');
  }
}

debugMikronMatch().catch(console.error);
