// Debug specifico per Projet Alegria
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProjetAlegria() {
  console.log('🔍 Debug Projet Alegria...');
  
  try {
    // Trova il devis Projet Alegria
    const { data: devis, error } = await supabase
      .from('devis')
      .select('*')
      .ilike('nom', '%alegria%');
    
    if (error) throw error;
    
    if (devis.length === 0) {
      console.log('❌ Projet Alegria non trovato');
      return;
    }
    
    const alegria = devis[0];
    console.log('📋 Projet Alegria trovato:');
    console.log('   ID:', alegria.id);
    console.log('   Numero:', alegria.numero);
    console.log('   Nome:', alegria.nom);
    console.log('   modalita_prezzi:', `"${alegria.modalita_prezzi}"`);
    console.log('   modalita_prezzi type:', typeof alegria.modalita_prezzi);
    console.log('   modalita_prezzi length:', alegria.modalita_prezzi?.length);
    
    // Verifica caratteri nascosti
    if (alegria.modalita_prezzi) {
      console.log('   Caratteri:', [...alegria.modalita_prezzi].map(c => `"${c}" (${c.charCodeAt(0)})`));
    }
    
    console.log('   remises:', alegria.remises);
    console.log('   produits count:', alegria.produits ? alegria.produits.length : 'NULL');
    
    // Test confronti
    console.log('\n🧪 Test confronti:');
    console.log('   === "scontistica":', alegria.modalita_prezzi === 'scontistica');
    console.log('   === "prezziFissi":', alegria.modalita_prezzi === 'prezziFissi');
    console.log('   === "prezzi_fissi":', alegria.modalita_prezzi === 'prezzi_fissi');
    console.log('   === "prix_fixes":', alegria.modalita_prezzi === 'prix_fixes');
    
    // Correggi se necessario
    if (alegria.modalita_prezzi !== 'prezziFissi' && alegria.modalita_prezzi !== 'scontistica') {
      console.log('\n🔧 Correzione necessaria...');
      
      // Basandoci sui prodotti, determiniamo se dovrebbe essere prezzi fissi
      // Se ha pochi prodotti o prodotti con prezzi personalizzati, probabilmente è prezzi fissi
      let shouldBePriceFixed = false;
      
      if (alegria.produits && alegria.produits.length > 0) {
        // Se i prodotti hanno prezzi molto diversi dal listino, probabilmente è prezzi fissi
        shouldBePriceFixed = true; // Assumiamo che sia prezzi fissi come dici tu
      }
      
      const correctValue = shouldBePriceFixed ? 'prezziFissi' : 'scontistica';
      console.log(`   Dovrebbe essere: "${correctValue}"`);
      
      const { error: updateError } = await supabase
        .from('devis')
        .update({ modalita_prezzi: correctValue })
        .eq('id', alegria.id);
      
      if (updateError) {
        console.error('   ❌ Errore aggiornamento:', updateError);
      } else {
        console.log('   ✅ Aggiornato con successo');
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

debugProjetAlegria();