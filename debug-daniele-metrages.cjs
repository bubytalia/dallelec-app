const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function debug() {
  const email = 'danielemaggi@dallelec.com';

  // Simula fetchChantiers di ChefSelectionCantiere
  const { data: chefData } = await supabase
    .from('chefdechantiers')
    .select('nom, prenom')
    .eq('email', email)
    .single();

  console.log('Chef data:', chefData);

  const n1 = `${chefData.nom} ${chefData.prenom}`;
  const n2 = `${chefData.prenom} ${chefData.nom}`;
  const orFilter = `capocantiere.eq.${email},capocantiere.eq.${n1},capocantiere.eq.${n2}`;

  console.log('orFilter:', orFilter);

  const { data, error } = await supabase
    .from('chantiers')
    .select('id, nom, modalita_resoconto, capocantiere')
    .neq('type', 'interne')
    .or(orFilter);

  if (error) {
    console.error('Errore:', error);
    return;
  }

  console.log(`\nChantiers trovati: ${data?.length}`);
  data?.forEach(c => {
    console.log(`  [${c.id}] ${c.nom} | modalita_resoconto: "${c.modalita_resoconto}" | capocantiere: "${c.capocantiere}"`);
  });
}

debug().catch(console.error);
