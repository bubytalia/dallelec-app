import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQoqa() {
  const { data: devis } = await supabase
    .from('devis')
    .select('*')
    .ilike('nom', '%QOQA%')
    .single();
  
  console.log('DEVIS QOQA COMPLETO:');
  console.log('Total:', devis.total);
  console.log('Remises:', JSON.stringify(devis.remises, null, 2));
  console.log('Discount:', devis.discount);
  
  // Calcola totale prodotti per zona
  const totaliZone = {};
  devis.produits.forEach(p => {
    if (!totaliZone[p.zone]) totaliZone[p.zone] = 0;
    totaliZone[p.zone] += Number(p.total || 0);
  });
  
  console.log('TOTALI PER ZONA (senza remise):');
  Object.entries(totaliZone).forEach(([zona, totale]) => {
    console.log(`${zona}: ${totale.toFixed(2)} CHF`);
  });
  
  console.log('TOTALE GENERALE PRODOTTI:', Object.values(totaliZone).reduce((a,b) => a+b, 0));
}

debugQoqa();