import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllChantiers() {
  const userEmail = 'danielemaggi@dallelec.com';
  
  const { data: chefData } = await supabase
    .from('chefdechantiers')
    .select('*')
    .eq('email', userEmail)
    .single();
  
  const nomeCompleto1 = `${chefData.nom} ${chefData.prenom}`;
  const nomeCompleto2 = `${chefData.prenom} ${chefData.nom}`;
  
  const { data: allChantiers } = await supabase
    .from('chantiers')
    .select('*')
    .order('nom');
  
  console.log(`\n📋 TUTTI I CANTIERI (${allChantiers.length} totali):\n`);
  
  const tuoiCantieri = [];
  const altriCantieri = [];
  
  allChantiers.forEach(c => {
    const match = c.capocantiere === userEmail || 
                  c.capocantiere === nomeCompleto1 || 
                  c.capocantiere === nomeCompleto2;
    
    if (match) {
      tuoiCantieri.push(c);
    } else {
      altriCantieri.push(c);
    }
  });
  
  console.log(`✅ TUOI CANTIERI (${tuoiCantieri.length}):\n`);
  tuoiCantieri.forEach((c, i) => {
    console.log(`${i + 1}. ${c.nom}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   Numero: ${c.numero_cantiere || 'N/A'}`);
    console.log(`   Indirizzo: ${c.adresse}`);
    console.log(`   Capo: ${c.capocantiere}\n`);
  });
  
  console.log(`\n📋 ALTRI CANTIERI (${altriCantieri.length}):\n`);
  altriCantieri.forEach((c, i) => {
    console.log(`${i + 1}. ${c.nom} - Capo: ${c.capocantiere || 'N/A'}`);
  });
}

listAllChantiers().catch(console.error);
