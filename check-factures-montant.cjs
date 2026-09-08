const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function check() {
  // Carica tutto
  const [{ data: factures }, { data: resoconti }, { data: chantiers }, { data: devis }] = await Promise.all([
    supabase.from('factures').select('*').not('resoconto_id', 'is', null),
    supabase.from('resoconti_percentuali').select('*'),
    supabase.from('chantiers').select('id, nom, devis_id, prix_regie'),
    supabase.from('devis').select('id, total, produits, remises')
  ]);

  console.log(`Fatture da resoconto: ${factures.length}`);
  console.log('');

  const problemi = [];

  for (const factura of factures) {
    const resoconto = resoconti.find(r => r.id === factura.resoconto_id);
    if (!resoconto) continue;

    const chantier = chantiers.find(c => c.id === factura.chantier_id);
    if (!chantier) continue;

    const devisDoc = devis.find(d => d.id == chantier.devis_id);
    if (!devisDoc || !devisDoc.produits) continue;

    // Calcola il montant corretto
    let totalHT = 0;
    Object.entries(resoconto.avancementi || {}).forEach(([zona, percentuale]) => {
      const totaleZona = devisDoc.produits
        .filter(p => p.zone === zona)
        .reduce((sum, p) => sum + Number(p.total || 0), 0);

      let montantZona = totaleZona * percentuale / 100;

      // Applica remise solo se è un numero
      const remise = typeof devisDoc.remises === 'number' ? devisDoc.remises : 0;
      if (remise > 0) montantZona = montantZona * (1 - remise / 100);

      totalHT += montantZona;
    });

    // Aggiungi régies
    const prixRegie = chantier.prix_regie || 75;
    const totalRegies = (resoconto.regies || []).reduce((sum, r) => sum + (r.heures * (r.prixHeure || prixRegie)), 0);
    totalHT += totalRegies;

    // Sottrai acconti
    const acconti = Number(factura.acconti_precedenti || 0);
    const nettoHT = totalHT - acconti;
    const totalTTC = Math.round(nettoHT * 1.081 * 100) / 100;

    const ttcSalvato = Number(factura.montant_ttc || 0);
    const differenza = Math.abs(totalTTC - ttcSalvato);

    if (differenza > 1) { // Differenza > 1 CHF = problema
      problemi.push({
        id: factura.id,
        numero: factura.numero,
        chantier: chantier.nom,
        ttcSalvato: ttcSalvato.toFixed(2),
        ttcCorretto: totalTTC.toFixed(2),
        htCorretto: Math.round(totalHT * 100) / 100,
        differenza: differenza.toFixed(2)
      });
    }
  }

  if (problemi.length === 0) {
    console.log('✅ Nessuna fattura con montant sbagliato trovata!');
  } else {
    console.log(`⚠️  ${problemi.length} fatture con montant sbagliato:\n`);
    problemi.forEach(p => {
      console.log(`  ${p.numero} | ${p.chantier}`);
      console.log(`    Salvato: ${p.ttcSalvato} CHF → Corretto: ${p.ttcCorretto} CHF (diff: ${p.differenza} CHF)`);
    });
  }

  return problemi;
}

check().catch(console.error);
