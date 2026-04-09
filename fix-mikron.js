import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMikron() {
  console.log('🔍 VERIFICA MIKRON\n');
  
  // Cerca cantiere Mikron
  const { data: cantiere } = await supabase
    .from('chantiers')
    .select('*')
    .ilike('nom', '%mikron%')
    .single();
  
  console.log('📋 CANTIERE:');
  console.log(`   Nome: ${cantiere.nom}`);
  console.log(`   ID: ${cantiere.id}`);
  console.log(`   Indirizzo: ${cantiere.adresse}\n`);
  
  // Cerca devis MIKRON 2
  const { data: devis } = await supabase
    .from('devis')
    .select('*')
    .ilike('nom', '%MIKRON%');
  
  console.log(`📄 DEVIS TROVATI (${devis.length}):\n`);
  devis.forEach(d => {
    console.log(`   - ${d.nom} (N° ${d.numero})`);
    console.log(`     Indirizzo: ${d.adresse}\n`);
  });
  
  // Soluzione 1: Aggiorna nome cantiere
  console.log('💡 SOLUZIONE 1: Aggiorna nome cantiere a "MIKRON 2"\n');
  
  const conferma = 'si'; // Cambia in 'si' per eseguire
  
  if (conferma === 'si') {
    const { error } = await supabase
      .from('chantiers')
      .update({ nom: 'MIKRON 2' })
      .eq('id', cantiere.id);
    
    if (error) {
      console.error('❌ Errore:', error);
    } else {
      console.log('✅ Nome cantiere aggiornato a "MIKRON 2"');
      console.log('   Ora il cantiere apparirà nelle métrées!');
    }
  } else {
    console.log('⚠️ Modifica NON eseguita (cambia conferma in "si" per eseguire)');
  }
}

fixMikron().catch(console.error);
