const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function check() {
  // Cerca tutte le email simili a "daniele" o "maggi" in chefdechantiers
  const { data: chefs } = await supabase
    .from('chefdechantiers')
    .select('id, nom, prenom, email');

  console.log('Tutti i chef de chantiers:');
  chefs?.forEach(c => console.log(`  [${c.id}] ${c.prenom} ${c.nom} | email: "${c.email}"`));

  // Cerca cantieri con capocantiere che contiene "maggi" o "daniele"
  const { data: chantiers } = await supabase
    .from('chantiers')
    .select('id, nom, capocantiere')
    .ilike('capocantiere', '%maggi%');

  console.log('\nChantiers con capocantiere contenente "maggi":');
  chantiers?.forEach(c => console.log(`  [${c.id}] ${c.nom} | capocantiere: "${c.capocantiere}"`));
}

check().catch(console.error);
