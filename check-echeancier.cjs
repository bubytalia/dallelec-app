const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function check() {
  const numeri = ['F2026-029', 'F2026-040', 'F2026-039'];
  
  const { data: factures } = await supabase
    .from('factures')
    .select('*')
    .in('numero', numeri);

  factures.forEach(f => {
    const acconti = Number(f.acconti_precedenti || 0);
    const ht = Number(f.montant_ht || 0);
    const ttcSalvato = Number(f.montant_ttc || 0);
    const ttcCalcolato = acconti > 0 ? (ht - acconti) * 1.081 : ht * 1.081;
    
    console.log(`\n${f.numero} | ${f.client_nom}`);
    console.log(`  montant_ht: ${ht}`);
    console.log(`  montant_ttc: ${ttcSalvato}`);
    console.log(`  acconti_precedenti: ${acconti}`);
    console.log(`  resoconto_id: ${f.resoconto_id}`);
    console.log(`  metrage_id: ${f.metrage_id}`);
    console.log(`  type: ${f.type}`);
    console.log(`  TTC calcolato correttamente: ${ttcCalcolato.toFixed(2)}`);
    console.log(`  Differenza: ${Math.abs(ttcSalvato - ttcCalcolato).toFixed(2)} CHF`);
  });
}

check().catch(console.error);
