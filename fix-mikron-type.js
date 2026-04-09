import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cambiaTypeMikron() {
  console.log('🔧 CAMBIO TYPE_METRAGE MIKRON\n');
  
  // Cerca cantiere Mikron
  const { data: cantiere } = await supabase
    .from('chantiers')
    .select('*')
    .ilike('nom', '%mikron%')
    .single();
  
  console.log('📋 CANTIERE TROVATO:');
  console.log(`   Nome: ${cantiere.nom}`);
  console.log(`   Type métrage attuale: ${cantiere.type_metrage}\n`);
  
  // Cambia a detaille
  const { error } = await supabase
    .from('chantiers')
    .update({ type_metrage: 'detaille' })
    .eq('id', cantiere.id);
  
  if (error) {
    console.error('❌ Errore:', error);
  } else {
    console.log('✅ Type métrage cambiato da "percentuel" a "detaille"');
    console.log('   Ora puoi fare i métrages dettagliati per MIKRON!');
  }
}

cambiaTypeMikron().catch(console.error);
