const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function check() {
  const email = 'danielemaggi@dallelec.com';

  const { data: chantiers } = await supabase
    .from('chantiers')
    .select('id,nom,devis_id,capocantiere,type')
    .eq('capocantiere', email)
    .neq('type', 'interne');

  console.log('Chantiers non-interne:', chantiers?.length);

  const ids = chantiers?.map(c => c.id) || [];

  const { data: factures } = await supabase
    .from('factures')
    .select('id,chantier_id,montant_ht_brut,is_acconto')
    .in('chantier_id', ids);

  console.log('Factures totali:', factures?.length);

  chantiers?.forEach(c => {
    const fatt = (factures || []).filter(f => String(f.chantier_id) === String(c.id) && !f.is_acconto);
    console.log(`  [${c.id}] ${c.nom} | devis_id: ${c.devis_id} | fatture non-acconto: ${fatt.length}`);
  });
}

check().catch(console.error);
