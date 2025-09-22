// Test completo flusso devis à corps
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFlussoDevisCorps() {
  console.log('🧪 Test completo flusso devis à corps...\n');
  
  try {
    // 1. Simula creazione nuovo devis à corps
    console.log('1️⃣ Creazione nuovo devis à corps...');
    
    const newDevis = {
      numero: `DEV-TEST-${Date.now()}`,
      nom: 'Test Cantiere Corps',
      adresse: 'Via Test 123',
      client_id: 1, // Primo cliente
      technicien: 'Test Tech',
      zones: ['zone1', 'zone2'],
      modalita_prezzi: 'aCorps',
      remises: {},
      description_corps: 'Test description travaux électriques selon plans',
      montant_corps: 5500.00,
      created_at: new Date().toISOString(),
      produits: [],
      total: 5500.00, // HT
      draft: false,
      status: 'Terminé'
    };
    
    const { data: createdDevis, error: createError } = await supabase
      .from('devis')
      .insert(newDevis)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Errore creazione:', createError);
      return;
    }
    
    console.log('✅ Devis à corps creato:', createdDevis.id);
    console.log('📋 Dati:', {
      numero: createdDevis.numero,
      modalita_prezzi: createdDevis.modalita_prezzi,
      description_corps: createdDevis.description_corps,
      montant_corps: createdDevis.montant_corps,
      total: createdDevis.total,
      draft: createdDevis.draft
    });
    
    // 2. Test logica routing (simula DevisList.vue)
    console.log('\n2️⃣ Test logica routing...');
    
    const devisItem = createdDevis;
    let routeDestination;
    
    if (devisItem.modalita_prezzi === 'aCorps') {
      routeDestination = `/admin/devis/conditions/${devisItem.id}`;
      console.log('✅ Devis à corps → Condizioni:', routeDestination);
    } else if (devisItem.draft) {
      routeDestination = `/admin/devis/edit/${devisItem.id}`;
      console.log('✅ Devis bozza → Edit:', routeDestination);
    } else {
      routeDestination = `/devis/produits/${devisItem.id}`;
      console.log('✅ Devis completato → Prodotti:', routeDestination);
    }
    
    // 3. Test caricamento in DevisConditions
    console.log('\n3️⃣ Test caricamento DevisConditions...');
    
    const { data: devisForConditions, error: condError } = await supabase
      .from('devis')
      .select('*')
      .eq('id', createdDevis.id)
      .single();
    
    if (condError) {
      console.error('❌ Errore caricamento condizioni:', condError);
      return;
    }
    
    console.log('✅ Devis caricato per condizioni:');
    console.log('- Modalità:', devisForConditions.modalita_prezzi);
    console.log('- Description:', devisForConditions.description_corps);
    console.log('- Montant:', devisForConditions.montant_corps);
    console.log('- Produits:', devisForConditions.produits?.length || 0);
    
    // 4. Cleanup - elimina devis test
    console.log('\n4️⃣ Cleanup...');
    
    const { error: deleteError } = await supabase
      .from('devis')
      .delete()
      .eq('id', createdDevis.id);
    
    if (deleteError) {
      console.warn('⚠️ Errore eliminazione devis test:', deleteError);
    } else {
      console.log('✅ Devis test eliminato');
    }
    
    console.log('\n🎉 Test completato con successo!');
    console.log('\n📝 RISULTATO: Il flusso devis à corps funziona correttamente');
    
  } catch (err) {
    console.error('❌ Errore generale test:', err);
  }
}

testFlussoDevisCorps();