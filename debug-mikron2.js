import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMikron2() {
  console.log('🔍 DEBUG CANTIERE MIKRON2\n');
  
  const userEmail = 'danielemaggi@dallelec.com';
  
  // 1. Trova il capo cantiere
  const { data: chefData, error: chefError } = await supabase
    .from('chefdechantiers')
    .select('*')
    .eq('email', userEmail)
    .single();
  
  if (chefError || !chefData) {
    console.error('❌ Capo cantiere non trovato:', chefError);
    return;
  }
  
  console.log('✅ Capo cantiere:');
  console.log(`   Nome: ${chefData.nom} ${chefData.prenom}`);
  console.log(`   Email: ${chefData.email}\n`);
  
  const nomeCompleto1 = `${chefData.nom} ${chefData.prenom}`;
  const nomeCompleto2 = `${chefData.prenom} ${chefData.nom}`;
  
  // 2. Cerca il cantiere MIKRON2
  const { data: mikron2, error: mikronError } = await supabase
    .from('chantiers')
    .select('*')
    .ilike('nom', '%MIKRON2%');
  
  if (mikronError) {
    console.error('❌ Errore ricerca MIKRON2:', mikronError);
    return;
  }
  
  if (!mikron2 || mikron2.length === 0) {
    console.log('❌ Cantiere MIKRON2 NON TROVATO nel database!\n');
    return;
  }
  
  console.log(`📋 Trovati ${mikron2.length} cantiere(i) MIKRON2:\n`);
  
  mikron2.forEach((c, i) => {
    console.log(`${i + 1}. ${c.nom}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   Numero: ${c.numero_cantiere || 'N/A'}`);
    console.log(`   Indirizzo: ${c.adresse}`);
    console.log(`   Capo cantiere nel DB: "${c.capocantiere}"`);
    console.log(`   Type métrage: ${c.type_metrage || 'detaille'}`);
    
    // Verifica corrispondenza
    const match = c.capocantiere === userEmail || 
                  c.capocantiere === nomeCompleto1 || 
                  c.capocantiere === nomeCompleto2;
    
    if (match) {
      console.log(`   ✅ CORRISPONDE! Dovrebbe apparire nelle métrées`);
    } else {
      console.log(`   ❌ NON CORRISPONDE!`);
      console.log(`\n   🔧 PROBLEMA TROVATO:`);
      console.log(`      Il campo "capocantiere" contiene: "${c.capocantiere}"`);
      console.log(`      Ma il sistema cerca:`);
      console.log(`      - ${userEmail}`);
      console.log(`      - ${nomeCompleto1}`);
      console.log(`      - ${nomeCompleto2}`);
      console.log(`\n   💡 SOLUZIONE:`);
      console.log(`      Aggiorna il campo "capocantiere" del cantiere con uno di questi valori.`);
    }
    console.log('');
  });
}

debugMikron2().catch(console.error);
