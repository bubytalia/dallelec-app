// Debug per verificare i dati del devis
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDevisZones() {
  try {
    // 1. Trova il cantiere
    const { data: chantier } = await supabase
      .from('chantiers')
      .select('*')
      .eq('id', 2)
      .single();
    
    console.log('🏗️ Chantier:', chantier);
    console.log('📋 Devis ID:', chantier.devis_id);
    
    // 2. Trova il devis
    const { data: devis } = await supabase
      .from('devis')
      .select('*')
      .eq('id', chantier.devis_id)
      .single();
    
    console.log('📄 Devis:', devis);
    console.log('📦 Produits:', devis.produits?.length || 0);
    
    if (devis.produits) {
      console.log('\n🔍 PRIMI 5 PRODOTTI:');
      devis.produits.slice(0, 5).forEach((p, i) => {
        console.log(`${i+1}. Zone: "${p.zone}" | Total: ${p.total} | Article: ${p.article}`);
      });
      
      // 3. Calcola totali per zona
      const totaliZone = {};
      devis.produits.forEach(p => {
        if (!totaliZone[p.zone]) totaliZone[p.zone] = 0;
        totaliZone[p.zone] += Number(p.total || 0);
      });
      
      console.log('\n💰 TOTALI PER ZONA:');
      Object.entries(totaliZone).forEach(([zona, totale]) => {
        console.log(`"${zona}": ${totale.toFixed(2)} CHF`);
      });
      
      // 4. Test calcolo con avancementi
      const avancementi = { '2 SS-1': 100, '1 SS -2': 100, '3 Mezzanine': 40 };
      console.log('\n🧮 CALCOLO CON AVANCEMENTI:');
      Object.entries(avancementi).forEach(([zona, percentuale]) => {
        const totaleZona = totaliZone[zona] || 0;
        const montantZona = totaleZona * percentuale / 100;
        console.log(`"${zona}" ${percentuale}%: ${totaleZona.toFixed(2)} × ${percentuale}% = ${montantZona.toFixed(2)} CHF`);
      });
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

debugDevisZones();