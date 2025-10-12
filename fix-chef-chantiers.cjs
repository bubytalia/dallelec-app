const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixChefChantiers() {
  console.log('🔧 ASSEGNAZIONE CHANTIERS A chef@dallelec.com');
  
  // Assegna alcuni chantiers a chef@dallelec.com per test
  const chantiersToAssign = [2, 9]; // Questi hanno già resoconti percentuali
  
  for (const chantierId of chantiersToAssign) {
    const { error } = await supabase
      .from('chantiers')
      .update({ capocantiere: 'chef@dallelec.com' })
      .eq('id', chantierId);
    
    if (error) {
      console.error(`❌ Errore assegnazione chantier ${chantierId}:`, error);
    } else {
      console.log(`✅ Chantier ${chantierId} assegnato a chef@dallelec.com`);
    }
  }
  
  // Verifica risultato
  const { data: chefChantiers } = await supabase
    .from('chantiers')
    .select('*')
    .eq('capocantiere', 'chef@dallelec.com');
  
  console.log(`\n📋 Chantiers ora assegnati a chef@dallelec.com: ${chefChantiers?.length || 0}`);
  chefChantiers?.forEach(c => {
    console.log(`- ID: ${c.id}, Nome: ${c.nom}`);
  });
}

fixChefChantiers().catch(console.error);