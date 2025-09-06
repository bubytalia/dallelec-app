import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carica variabili ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🔍 Test connessione Supabase...');
  console.log('📡 URL:', supabaseUrl);
  
  try {
    // Test 1: Lettura dati
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
      console.log('📋 Primi clients:', clients.map(c => c.nom));
    }
    
    // Test 2: Test inserimento
    const testClient = {
      nom: 'TEST_CLIENT_' + Date.now(),
      adresse: 'Test Address',
      ville: 'Test City',
      telephone: '123456789',
      email_contact: 'test@test.com',
      email_compta: 'compta@test.com'
    };
    
    console.log('🔄 Test inserimento...');
    const { data: insertData, error: insertError } = await supabase
      .from('clients')
      .insert(testClient)
      .select();
    
    if (insertError) {
      console.error('❌ Errore inserimento:', insertError);
      return;
    }
    
    console.log('✅ Inserimento OK - ID:', insertData[0]?.id);
    
    // Test 3: Cancella il record di test
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