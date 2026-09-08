const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

const numeri = ['F2026-003','F2025-067','F2025-057','F2025-053','F2025-065','F2026-002','F2026-001','F2026-014','F2026-008'];

async function analyze() {
  const [{ data: factures }, { data: resoconti }, { data: chantiers }, { data: devis }] = await Promise.all([
    supabase.from('factures').select('*').in('numero', numeri),
    supabase.from('resoconti_percentuali').select('*'),
    supabase.from('chantiers').select('id, nom, devis_id, prix_regie'),
    supabase.from('devis').select('id, total, produits, remises')
  ]);

  for (const factura of factures) {
    const resoconto = resoconti.find(r => r.id === factura.resoconto_id);
    const chantier = chantiers.find(c => c.id === factura.chantier_id);
    const devisDoc = devis.find(d => d.id == chantier?.devis_id);

    console.log(`\n=== ${factura.numero} | ${chantier?.nom} ===`);
    console.log(`  Salvato: HT=${factura.montant_ht} | TTC=${factura.montant_ttc} | acconti=${factura.acconti_precedenti}`);
    console.log(`  Resoconto ID: ${factura.resoconto_id} | avancementi: ${JSON.stringify(resoconto?.avancementi)}`);
    console.log(`  Devis ID: ${chantier?.devis_id} | total devis: ${devisDoc?.total}`);

    if (devisDoc?.produits) {
      // Totali per zona dal devis attuale
      const zoneMap = {};
      devisDoc.produits.forEach(p => {
        if (!zoneMap[p.zone]) zoneMap[p.zone] = 0;
        zoneMap[p.zone] += Number(p.total || 0);
      });
      console.log(`  Zone nel devis attuale:`, JSON.stringify(zoneMap));
    }

    // Calcolo corretto
    let totalHT = 0;
    Object.entries(resoconto?.avancementi || {}).forEach(([zona, pct]) => {
      const totaleZona = (devisDoc?.produits || [])
        .filter(p => p.zone === zona)
        .reduce((sum, p) => sum + Number(p.total || 0), 0);
      const montant = totaleZona * pct / 100;
      totalHT += montant;
      if (pct > 0) console.log(`    ${zona}: ${totaleZona.toFixed(2)} × ${pct}% = ${montant.toFixed(2)}`);
    });

    const acconti = Number(factura.acconti_precedenti || 0);
    const netto = totalHT - acconti;
    console.log(`  → HT calcolato: ${totalHT.toFixed(2)} | netto: ${netto.toFixed(2)} | TTC: ${(netto * 1.081).toFixed(2)}`);
  }
}

analyze().catch(console.error);
