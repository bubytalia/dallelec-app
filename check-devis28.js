import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDevis28() {
  console.log('🔍 VERIFICA DEVIS ID 28\n');
  
  const { data: devis, error } = await supabase
    .from('devis')
    .select('*')
    .eq('id', 28);
  
  if (error) {
    console.error('❌ Errore:', error);
    return;
  }
  
  if (!devis || devis.length === 0) {
    console.log('❌ DEVIS ID 28 NON TROVATO!\n');
    
    // Cerca tutti i devis MIKRON
    const { data: allMikron } = await supabase
      .from('devis')
      .select('id, numero, nom')
      .ilike('nom', '%MIKRON%');
    
    console.log('📄 Devis MIKRON disponibili:');
    allMikron?.forEach(d => {
      console.log(`   ID: ${d.id} - ${d.nom} (N° ${d.numero})`);
    });
    
    return;
  }
  
  console.log('✅ DEVIS TROVATO:');
  console.log(`   ID: ${devis[0].id}`);
  console.log(`   Nome: ${devis[0].nom}`);
  console.log(`   Numero: ${devis[0].numero}`);
  console.log(`   Indirizzo: ${devis[0].adresse}`);
  console.log(`   Prodotti: ${devis[0].produits?.length || 0}`);
  
  if (devis[0].produits && devis[0].produits.length > 0) {
    console.log('\n📦 Primi 3 prodotti:');
    devis[0].produits.slice(0, 3).forEach((p, i) => {
      console.log(`   ${i+1}. ${p.nom} - Zone: ${p.zone}`);
    });
  } else {
    console.log('\n⚠️ DEVIS SENZA PRODOTTI!');
  }
}

checkDevis28().catch(console.error);
