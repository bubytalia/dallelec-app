import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificaPrezziMetrage() {
  console.log('🔍 VERIFICA PREZZI MÉTRAGE MIKRON 2\n');
  
  // 1. Trova cantiere MIKRON 2
  const { data: cantiere } = await supabase
    .from('chantiers')
    .select('*')
    .eq('nom', 'Mikron 2 Swizerland AC Boudry')
    .single();
  
  console.log('📋 CANTIERE:', cantiere.nom);
  console.log('   devis_id:', cantiere.devis_id);
  
  // 2. Carica devis
  const { data: devis } = await supabase
    .from('devis')
    .select('*')
    .eq('id', cantiere.devis_id)
    .single();
  
  console.log('\n📄 DEVIS:', devis.nom);
  console.log('   Prodotti:', devis.produits?.length || 0);
  
  // 3. Carica métrage
  const { data: metrages } = await supabase
    .from('metrages')
    .select('*')
    .eq('chantier_id', cantiere.id)
    .eq('status', 'en_attente');
  
  if (!metrages || metrages.length === 0) {
    console.log('\n❌ Nessun métrage trovato');
    return;
  }
  
  const metrage = metrages[0];
  console.log('\n📏 MÉTRAGE:');
  console.log('   Items:', metrage.items?.length || 0);
  
  // 4. Verifica corrispondenza articoli
  console.log('\n🔍 VERIFICA CORRISPONDENZA ARTICOLI:\n');
  
  metrage.items?.forEach((item, i) => {
    const prodottoDevis = devis.produits?.find(p => p.article === item.article);
    
    console.log(`${i + 1}. ${item.article} - ${item.nom}`);
    console.log(`   Nel métrage: ${item.mlPosee} ML`);
    
    if (prodottoDevis) {
      console.log(`   ✅ Trovato nel devis!`);
      console.log(`   Prezzo: ${prodottoDevis.prix} CHF/ML`);
    } else {
      console.log(`   ❌ NON TROVATO nel devis!`);
      console.log(`   Articoli simili nel devis:`);
      devis.produits?.forEach(p => {
        if (p.nom?.toLowerCase().includes(item.nom?.toLowerCase().split(' ')[0])) {
          console.log(`      - ${p.article}: ${p.nom} (${p.prix} CHF)`);
        }
      });
    }
    console.log('');
  });
  
  // 5. Mostra tutti gli articoli del devis
  console.log('\n📦 TUTTI GLI ARTICOLI NEL DEVIS:\n');
  devis.produits?.forEach((p, i) => {
    console.log(`${i + 1}. ${p.article} - ${p.nom} - ${p.prix} CHF/ML`);
  });
}

verificaPrezziMetrage().catch(console.error);
