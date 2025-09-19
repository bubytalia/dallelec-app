import { supabase } from './src/supabase.js';

async function testSupabaseConnection() {
  console.log('🔍 Test connessione Supabase...');
  
  try {
    // Test 1: Connessione base
    const { data: testData, error: testError } = await supabase
      .from('clients')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Errore connessione:', testError);
      return;
    }
    
    console.log('✅ Connessione Supabase OK');
    
    // Test 2: Lettura dati
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);
    
    if (clientsError) {
      console.error('❌ Errore lettura clients:', clientsError);
      return;
    }
    
    console.log(`✅ Lettura OK - ${clients?.length || 0} clients trovati`);
    if (clients?.length > 0) {
      console.log('📋 Primo client:', clients[0]);
    }
    
    // Test 3: Test inserimento (e cancellazione immediata)
    const testClient = {
      nom: 'TEST_CLIENT_' + Date.now(),
      adresse: 'Test Address',
      ville: 'Test City',
      telephone: '123456789',
      email_contact: 'test@test.com',
      email_compta: 'compta@test.com'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('clients')
      .insert(testClient)
      .select();
    
    if (insertError) {
      console.error('❌ Errore inserimento:', insertError);
      return;
    }
    
    console.log('✅ Inserimento OK');
    
    // Cancella il record di test
    if (insertData && insertData[0]) {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.error('⚠️ Errore cancellazione test:', deleteError);
      } else {
        console.log('✅ Cancellazione test OK');
      }
    }
    
    console.log('🎉 TUTTI I TEST SUPABASE SUPERATI!');
    
  } catch (error) {
    console.error('💥 Errore generale:', error);
  }
}

testSupabaseConnection();