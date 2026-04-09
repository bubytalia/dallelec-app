import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificaMikron() {
  console.log('🔍 VERIFICA COMPLETA MIKRON\n');
  
  // 1. Trova cantiere
  const { data: cantiere } = await supabase
    .from('chantiers')
    .select('*')
    .ilike('nom', '%mikron%')
    .single();
  
  console.log('📋 CANTIERE:');
  console.log(`   Nome: ${cantiere.nom}`);
  console.log(`   Indirizzo: ${cantiere.adresse}`);
  console.log(`   Capo: ${cantiere.capocantiere}`);
  console.log(`   Type métrage: ${cantiere.type_metrage || 'detaille'}`);
  console.log(`   Devis associato: ${cantiere.devis_associe ? 'Sì' : 'No'}\n`);
  
  // 2. Cerca devis con nome O indirizzo
  const { data: devisByNome } = await supabase
    .from('devis')
    .select('*')
    .eq('nom', cantiere.nom);
  
  const { data: devisByIndirizzo } = await supabase
    .from('devis')
    .select('*')
    .eq('adresse', cantiere.adresse);
  
  console.log(`📄 DEVIS TROVATI PER NOME "${cantiere.nom}": ${devisByNome?.length || 0}`);
  console.log(`📄 DEVIS TROVATI PER INDIRIZZO "${cantiere.adresse}": ${devisByIndirizzo?.length || 0}\n`);
  
  // 3. Cerca tutti i devis MIKRON
  const { data: allMikron } = await supabase
    .from('devis')
    .select('*')
    .ilike('nom', '%MIKRON%');
  
  console.log(`📄 TUTTI I DEVIS MIKRON (${allMikron?.length || 0}):\n`);
  allMikron?.forEach(d => {
    console.log(`   - ${d.nom} (N° ${d.numero})`);
    console.log(`     Indirizzo: ${d.adresse}`);
    console.log(`     Prodotti: ${d.produits?.length || 0}\n`);
  });
  
  // 4. Soluzione
  if (!devisByNome?.length && !devisByIndirizzo?.length && allMikron?.length) {
    console.log('❌ PROBLEMA: Il devis MIKRON non è collegato al cantiere!\n');
    console.log('💡 SOLUZIONI:');
    console.log('   1. Aggiorna indirizzo devis con: "' + cantiere.adresse + '"');
    console.log('   2. Oppure aggiorna nome cantiere con: "' + allMikron[0].nom + '"');
  }
}

verificaMikron().catch(console.error);
