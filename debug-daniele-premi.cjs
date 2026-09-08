const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function debug() {
  const email = 'danielemaggi@dallelec.com';

  // Simula loadData di ChefPremi
  const [ch, fa, dv] = await Promise.all([
    supabase.from('chantiers').select('*, chef_secondaire').neq('type', 'interne'),
    supabase.from('factures').select('*'),
    supabase.from('devis').select('id,total,produits,discount,type_pose')
  ]);

  const chantiers = ch.data || [];
  const factures = fa.data || [];
  const devisData = dv.data || [];

  // Filtra come fa mesChantiersPrimes
  const mesChantiers = chantiers.filter(c =>
    c.capocantiere === email || c.chef_secondaire === email
  );

  console.log(`\nChantiers trovati per ${email}: ${mesChantiers.length}`);

  let visibili = 0;
  mesChantiers.forEach(chantier => {
    const facturesChantier = factures.filter(f => String(f.chantier_id) === String(chantier.id) && !f.is_acconto);
    const devis = devisData.find(d => d.id == chantier.devis_id);

    let heuresPrevuesDevis = 0;
    if (devis && devis.total) {
      const percentualeImpresa = chantier.percentuale_impresa || 30;
      const budgetMO = Number(devis.total) * (1 - percentualeImpresa / 100);
      heuresPrevuesDevis = budgetMO / 45;
    }

    const mostraIndicatori = heuresPrevuesDevis > 0;
    const hasFatture = facturesChantier.length > 0;

    let risultato;
    if (!hasFatture && !mostraIndicatori) risultato = 'ESCLUSO (no fatture, no devis)';
    else if (!hasFatture && mostraIndicatori) risultato = 'VISIBILE (in corso, solo indicatori)';
    else risultato = 'VISIBILE (con fatture)';

    if (risultato.startsWith('VISIBILE')) visibili++;

    console.log(`  [${chantier.id}] ${chantier.nom}`);
    console.log(`    devis_id: ${chantier.devis_id} | devis trovato: ${!!devis} | devis.total: ${devis?.total}`);
    console.log(`    fatture non-acconto: ${facturesChantier.length} | heuresPrevuesDevis: ${heuresPrevuesDevis.toFixed(1)}`);
    console.log(`    => ${risultato}`);
  });

  console.log(`\nTOTALE VISIBILI: ${visibili}/${mesChantiers.length}`);

  // Controlla anche la tabella chefdechantiers per Daniele
  const { data: chefData } = await supabase
    .from('chefdechantiers')
    .select('nom, prenom, email')
    .eq('email', email)
    .single();
  console.log('\nDati chefdechantiers:', chefData);
}

debug().catch(console.error);
