import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMikron2() {
  // Trova cantiere MIKRON 2
  const { data: cantiere } = await supabase
    .from('chantiers')
    .select('*')
    .eq('nom', 'Mikron 2 Swizerland AC Boudry')
    .single();
  
  console.log('📋 CANTIERE MIKRON 2:');
  console.log(JSON.stringify(cantiere, null, 2));
  console.log('\n');
  
  // Cerca tutti i campi che potrebbero contenere l'ID del devis
  const campiDevis = Object.keys(cantiere).filter(k => k.toLowerCase().includes('devis'));
  console.log('🔍 Campi relativi a devis:', campiDevis);
  campiDevis.forEach(campo => {
    console.log(`   ${campo}: ${cantiere[campo]}`);
  });
}

checkMikron2().catch(console.error);
