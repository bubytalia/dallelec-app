const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAccoppiamentoMikron() {
  try {
    // 1. Trova il cantiere Mikron
    const { data: cantiere } = await supabase
      .from('chantiers')
      .select('*')
      .eq('id', 2)
      .single();
    
    console.log('🏗️ Cantiere ID 2:', cantiere);
    
    // 2. Trova devis Mikron con più prodotti
    const { data: devisMikron } = await supabase
      .from('devis')
      .select('*')
      .ilike('nom', '%Mikron%')
      .order('id');
    
    console.log('📋 Devis Mikron trovati:');
    devisMikron?.forEach(d => {
      console.log(`- ID: ${d.id}, Numero: ${d.numero}, Nome: "${d.nom}", Prodotti: ${d.produits?.length || 0}`);
    });
    
    // 3. Trova il devis con più prodotti (probabilmente quello principale)
    const devisPrincipale = devisMikron?.reduce((prev, current) => {
      return (current.produits?.length || 0) > (prev.produits?.length || 0) ? current : prev;
    });
    
    if (devisPrincipale && cantiere) {
      console.log(`🔗 Accoppiando cantiere ${cantiere.id} al devis ${devisPrincipale.id} (${devisPrincipale.produits?.length || 0} prodotti)`);
      
      const { error } = await supabase
        .from('chantiers')
        .update({ devis_id: devisPrincipale.id })
        .eq('id', cantiere.id);
      
      if (error) {
        console.error('❌ Errore aggiornamento:', error);
      } else {
        console.log('✅ Accoppiamento completato!');
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixAccoppiamentoMikron();