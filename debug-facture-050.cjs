const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function check() {
  const { data: facture } = await supabase
    .from('factures')
    .select('*')
    .eq('numero', 'F2026-050')
    .single();

  console.log('Fattura F2026-050:');
  console.log('  montant_ht:', facture.montant_ht);
  console.log('  montant_ttc:', facture.montant_ttc);
  console.log('  acconti_precedenti:', facture.acconti_precedenti);
  console.log('  metrage_id:', facture.metrage_id);
  console.log('  resoconto_id:', facture.resoconto_id);
  console.log('  chantier_id:', facture.chantier_id);
  console.log('  type:', facture.type);

  // Controlla il metrage associato
  if (facture.metrage_id) {
    const { data: metrage } = await supabase
      .from('metrages')
      .select('id, chantier_id, total_ml, items')
      .eq('id', facture.metrage_id)
      .single();
    console.log('\nMetrage associato:', metrage?.id, '| total_ml:', metrage?.total_ml, '| items:', metrage?.items?.length);
  }

  // Controlla il chantier e devis
  const { data: chantier } = await supabase
    .from('chantiers')
    .select('id, nom, devis_id')
    .eq('id', facture.chantier_id)
    .single();
  console.log('\nChantier:', chantier?.nom, '| devis_id:', chantier?.devis_id);

  if (chantier?.devis_id) {
    const { data: devis } = await supabase
      .from('devis')
      .select('id, total, produits')
      .eq('id', chantier.devis_id)
      .single();
    console.log('Devis:', devis?.id, '| total:', devis?.total, '| produits:', devis?.produits?.length);
  }
}

check().catch(console.error);
