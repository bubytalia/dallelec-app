const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function fix() {
  // Carica il resoconto 52
  const { data: resoconto } = await supabase
    .from('resoconti_percentuali')
    .select('*')
    .eq('id', 52)
    .single();

  console.log('Resoconto 52:');
  console.log('  avancementi:', JSON.stringify(resoconto.avancementi));
  console.log('  regies:', resoconto.regies?.length || 0);

  // Carica il devis 131
  const { data: devis } = await supabase
    .from('devis')
    .select('id, total, produits, remises')
    .eq('id', 131)
    .single();

  console.log('\nDevis 131:');
  console.log('  total:', devis.total);
  console.log('  remises:', devis.remises);
  console.log('  produits:', devis.produits?.length);

  // Calcola il montant corretto per ogni zona
  let totalHT = 0;
  Object.entries(resoconto.avancementi || {}).forEach(([zona, percentuale]) => {
    const totaleZona = devis.produits
      .filter(p => p.zone === zona)
      .reduce((sum, p) => sum + Number(p.total || 0), 0);

    let montantZona = totaleZona * percentuale / 100;

    // Applica remise se presente
    if (devis.remises && devis.remises > 0) {
      montantZona = montantZona * (1 - devis.remises / 100);
    }

    console.log(`  Zona ${zona}: ${totaleZona.toFixed(2)} × ${percentuale}% = ${montantZona.toFixed(2)} CHF`);
    totalHT += montantZona;
  });

  // Aggiungi régies
  const chantier = await supabase.from('chantiers').select('prix_regie').eq('id', 49).single();
  const prixRegie = chantier.data?.prix_regie || 75;
  const totalRegies = (resoconto.regies || []).reduce((sum, r) => sum + (r.heures * (r.prixHeure || prixRegie)), 0);
  totalHT += totalRegies;

  const totalTTC = totalHT * 1.081;

  console.log('\n=== CALCOLO CORRETTO ===');
  console.log('  Total HT:', totalHT.toFixed(2));
  console.log('  Total TTC:', totalTTC.toFixed(2));
  console.log('  (PDF mostra:', 17502.20, ')');

  // Aggiorna la fattura
  const { error } = await supabase
    .from('factures')
    .update({
      montant_ht: Math.round(totalHT * 100) / 100,
      montant_ttc: Math.round(totalTTC * 100) / 100
    })
    .eq('numero', 'F2026-050');

  if (error) {
    console.error('Errore aggiornamento:', error);
  } else {
    console.log('\n✅ Fattura F2026-050 aggiornata con successo!');
  }
}

fix().catch(console.error);
