const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDevisCoupling() {
  try {
    // Trova tutti i devis Mikron
    const { data: devisMikron } = await supabase
      .from('devis')
      .select('*')
      .ilike('nom', '%Mikron%');
    
    console.log('📋 Devis Mikron trovati:');
    devisMikron?.forEach(d => {
      console.log(`- ID: ${d.id}, Numero: ${d.numero}, Nome: "${d.nom}"`);
      console.log(`  Indirizzo: "${d.adresse}"`);
      console.log(`  Cantiere ID: ${d.cantiere_id || 'NON IMPOSTATO'}`);
      console.log(`  Prodotti: ${d.produits?.length || 0}`);
      console.log('---');
    });
    
    // Trova il cantiere Mikron
    const { data: cantiere } = await supabase
      .from('chantiers')
      .select('*')
      .eq('id', 2)
      .single();
    
    console.log('🏗️ Cantiere ID 2:', cantiere);
    
    // Cerca devis collegati al cantiere tramite cantiere_id
    const { data: devisCollegati } = await supabase
      .from('devis')
      .select('*')
      .eq('cantiere_id', 2);
    
    console.log('🔗 Devis collegati al cantiere ID 2 tramite cantiere_id:');
    devisCollegati?.forEach(d => {
      console.log(`- ${d.numero}: ${d.nom} (${d.produits?.length || 0} prodotti)`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

checkDevisCoupling();