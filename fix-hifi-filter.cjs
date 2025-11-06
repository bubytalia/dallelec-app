const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixHifiFilter() {
  try {
    console.log('🔧 Correggendo Hifi Filter...');
    
    // 1. Trova il cantiere Hifi Filter
    const { data: cantiere } = await supabase
      .from('chantiers')
      .select('*')
      .eq('id', 18)
      .single();
    
    console.log('🏗️ Cantiere:', cantiere.nom, '- Gruppo:', cantiere.gruppo_devis_id);
    
    // 2. Trova il devis supplementare DEV-256952
    const { data: devisSupplementare } = await supabase
      .from('devis')
      .select('*')
      .eq('numero', 'DEV-256952')
      .single();
    
    if (!devisSupplementare) {
      console.log('❌ Devis DEV-256952 non trovato');
      return;
    }
    
    console.log('📋 Devis supplementare:', {
      id: devisSupplementare.id,
      numero: devisSupplementare.numero,
      nome: devisSupplementare.nom,
      gruppo_attuale: devisSupplementare.gruppo_devis_id || 'NESSUNO',
      prodotti: devisSupplementare.produits?.length || 0
    });
    
    // 3. Assegna il devis al gruppo del cantiere
    const { error } = await supabase
      .from('devis')
      .update({ gruppo_devis_id: cantiere.gruppo_devis_id })
      .eq('id', devisSupplementare.id);
    
    if (error) {
      console.error('❌ Errore aggiornamento:', error);
    } else {
      console.log(`✅ Devis ${devisSupplementare.numero} aggiunto al gruppo ${cantiere.gruppo_devis_id}`);
    }
    
    // 4. Verifica risultato
    const { data: devisGruppo } = await supabase
      .from('devis')
      .select('*')
      .eq('gruppo_devis_id', cantiere.gruppo_devis_id);
    
    console.log('\n📋 Devis nel gruppo dopo correzione:');
    devisGruppo?.forEach(d => {
      console.log(`- ${d.numero}: ${d.produits?.length || 0} prodotti`);
    });
    
    console.log('\n🎉 Correzione completata! Ora prova il resoconto finale.');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixHifiFilter();