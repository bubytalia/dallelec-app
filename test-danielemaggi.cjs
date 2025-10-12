const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDanielemaggi() {
  const email = 'danielemaggi@dallelec.com';
  console.log(`🔍 TEST PER ${email}`);
  
  // Chantiers assegnati
  const { data: chantiers } = await supabase
    .from('chantiers')
    .select('*')
    .eq('capocantiere', email);
  
  console.log(`\n📋 CHANTIERS: ${chantiers?.length || 0}`);
  chantiers?.forEach(c => console.log(`- ID: ${c.id}, Nome: ${c.nom}`));
  
  if (chantiers?.length > 0) {
    const chantierIds = chantiers.map(c => c.id);
    
    // Resoconti percentuali
    const { data: resoconti } = await supabase
      .from('resoconti_percentuali')
      .select('*')
      .in('chantier_id', chantierIds)
      .eq('draft', false);
    
    console.log(`\n📊 RESOCONTI PERCENTUALI: ${resoconti?.length || 0}`);
    resoconti?.forEach(r => {
      const chantier = chantiers.find(c => c.id === r.chantier_id);
      console.log(`- ID: ${r.id}, Chantier: ${chantier?.nom}, Periodo: ${r.periode_month}, Data: ${r.created_at}`);
    });
  }
}

testDanielemaggi().catch(console.error);