const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugHistorique() {
  console.log('🔍 DEBUG HISTORIQUE MÉTRAGES');
  
  // 1. Verifica tutti i chantiers
  console.log('\n📋 TUTTI I CHANTIERS:');
  const { data: allChantiers } = await supabase
    .from('chantiers')
    .select('*')
    .order('nom');
  
  console.log(`Trovati ${allChantiers?.length || 0} chantiers totali`);
  allChantiers?.forEach(c => {
    console.log(`- ID: ${c.id}, Nome: ${c.nom}, Capocantiere: ${c.capocantiere}`);
  });
  
  // 2. Verifica métrages
  console.log('\n📏 TUTTI I MÉTRAGES:');
  const { data: allMetrages } = await supabase
    .from('metrages')
    .select('*')
    .eq('draft', false)
    .order('created_at', { ascending: false });
  
  console.log(`Trovati ${allMetrages?.length || 0} métrages totali`);
  allMetrages?.forEach(m => {
    console.log(`- ID: ${m.id}, Chantier: ${m.chantier_id}, Data: ${m.created_at}, Draft: ${m.draft}`);
  });
  
  // 3. Verifica resoconti percentuali
  console.log('\n📊 TUTTI I RESOCONTI PERCENTUALI:');
  const { data: allResoconti } = await supabase
    .from('resoconti_percentuali')
    .select('*')
    .eq('draft', false)
    .order('created_at', { ascending: false });
  
  console.log(`Trovati ${allResoconti?.length || 0} resoconti percentuali totali`);
  allResoconti?.forEach(r => {
    console.log(`- ID: ${r.id}, Chantier: ${r.chantier_id}, Data: ${r.created_at}, Draft: ${r.draft}, Periodo: ${r.periode_month}`);
  });
  
  // 4. Test con email chef@dallelec.com
  const testEmail = 'chef@dallelec.com';
  console.log(`\n👨‍💼 CHANTIERS PER ${testEmail}:`);
  
  const { data: chefChantiers } = await supabase
    .from('chantiers')
    .select('*')
    .eq('capocantiere', testEmail)
    .order('nom');
  
  console.log(`Trovati ${chefChantiers?.length || 0} chantiers per ${testEmail}`);
  chefChantiers?.forEach(c => {
    console.log(`- ID: ${c.id}, Nome: ${c.nom}`);
  });
  
  if (chefChantiers?.length > 0) {
    const chantierIds = chefChantiers.map(c => c.id);
    
    // Métrages per questi chantiers
    const { data: chefMetrages } = await supabase
      .from('metrages')
      .select('*')
      .in('chantier_id', chantierIds)
      .eq('draft', false);
    
    console.log(`\n📏 MÉTRAGES PER QUESTI CHANTIERS: ${chefMetrages?.length || 0}`);
    
    // Resoconti per questi chantiers
    const { data: chefResoconti } = await supabase
      .from('resoconti_percentuali')
      .select('*')
      .in('chantier_id', chantierIds)
      .eq('draft', false);
    
    console.log(`📊 RESOCONTI PER QUESTI CHANTIERS: ${chefResoconti?.length || 0}`);
  }
}

debugHistorique().catch(console.error);