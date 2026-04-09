import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMetreesCantiere() {
  console.log('🔍 DEBUG MÉTRÉES CANTIERE\n');
  
  // 1. Chiedi l'email del capo cantiere
  const userEmail = 'danielemaggi@dallelec.com'; // Modifica con la tua email
  console.log(`📧 Email capo cantiere: ${userEmail}\n`);
  
  // 2. Trova il capo cantiere
  const { data: chefData, error: chefError } = await supabase
    .from('chefdechantiers')
    .select('*')
    .eq('email', userEmail)
    .single();
  
  if (chefError || !chefData) {
    console.error('❌ Capo cantiere non trovato:', chefError);
    return;
  }
  
  console.log('✅ Capo cantiere trovato:');
  console.log(`   Nome: ${chefData.nom}`);
  console.log(`   Prenom: ${chefData.prenom}`);
  console.log(`   Email: ${chefData.email}\n`);
  
  const nomeCompleto1 = `${chefData.nom} ${chefData.prenom}`;
  const nomeCompleto2 = `${chefData.prenom} ${chefData.nom}`;
  
  console.log('🔍 Formati nome cercati:');
  console.log(`   1. Email: ${userEmail}`);
  console.log(`   2. Formato 1: ${nomeCompleto1}`);
  console.log(`   3. Formato 2: ${nomeCompleto2}\n`);
  
  // 3. Cerca TUTTI i cantieri
  const { data: allChantiers, error: allError } = await supabase
    .from('chantiers')
    .select('*');
  
  if (allError) {
    console.error('❌ Errore caricamento cantieri:', allError);
    return;
  }
  
  console.log(`📋 Totale cantieri nel database: ${allChantiers.length}\n`);
  
  // 4. Filtra cantieri che corrispondono
  const chantiersMatch = allChantiers.filter(c => 
    c.capocantiere === userEmail || 
    c.capocantiere === nomeCompleto1 || 
    c.capocantiere === nomeCompleto2
  );
  
  console.log(`✅ Cantieri trovati per questo capo: ${chantiersMatch.length}\n`);
  
  if (chantiersMatch.length > 0) {
    console.log('📋 Lista cantieri trovati:');
    chantiersMatch.forEach((c, i) => {
      console.log(`\n   ${i + 1}. ${c.nom}`);
      console.log(`      ID: ${c.id}`);
      console.log(`      Numero: ${c.numero_cantiere || 'N/A'}`);
      console.log(`      Indirizzo: ${c.adresse}`);
      console.log(`      Capo cantiere: ${c.capocantiere}`);
      console.log(`      Type métrage: ${c.type_metrage || 'detaille'}`);
    });
  }
  
  // 5. Mostra cantieri che NON corrispondono ma potrebbero essere tuoi
  console.log('\n\n🔍 ALTRI CANTIERI (potrebbero essere tuoi con formato diverso):');
  const otherChantiers = allChantiers.filter(c => 
    c.capocantiere && 
    c.capocantiere !== userEmail && 
    c.capocantiere !== nomeCompleto1 && 
    c.capocantiere !== nomeCompleto2 &&
    (c.capocantiere.toLowerCase().includes(chefData.nom.toLowerCase()) ||
     c.capocantiere.toLowerCase().includes(chefData.prenom.toLowerCase()))
  );
  
  if (otherChantiers.length > 0) {
    otherChantiers.forEach((c, i) => {
      console.log(`\n   ${i + 1}. ${c.nom}`);
      console.log(`      ID: ${c.id}`);
      console.log(`      Capo cantiere nel DB: "${c.capocantiere}"`);
      console.log(`      ⚠️ FORMATO NON RICONOSCIUTO!`);
    });
    
    console.log('\n\n💡 SOLUZIONE:');
    console.log('   Questi cantieri hanno un formato del campo "capocantiere" diverso.');
    console.log('   Devi aggiornare il campo "capocantiere" con uno di questi valori:');
    console.log(`   - ${userEmail}`);
    console.log(`   - ${nomeCompleto1}`);
    console.log(`   - ${nomeCompleto2}`);
  }
  
  // 6. Mostra TUTTI i valori unici di capocantiere
  console.log('\n\n📊 TUTTI I VALORI DI "capocantiere" NEL DATABASE:');
  const uniqueCapoCantiere = [...new Set(allChantiers.map(c => c.capocantiere).filter(Boolean))];
  uniqueCapoCantiere.forEach((cap, i) => {
    console.log(`   ${i + 1}. "${cap}"`);
  });
}

debugMetreesCantiere().catch(console.error);
