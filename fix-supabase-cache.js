// Script per pulire cache e verificare configurazione Supabase
import { supabase } from './src/supabase.js';

console.log('🔍 Verifica configurazione Supabase...');
console.log('URL:', supabase.supabaseUrl);
console.log('Key:', supabase.supabaseKey?.substring(0, 20) + '...');

// Test connessione
async function testConnection() {
  try {
    console.log('📡 Test connessione database...');
    
    // Test semplice
    const { data, error } = await supabase
      .from('chantiers')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Errore connessione:', error);
    } else {
      console.log('✅ Connessione OK');
      console.log('📊 Dati:', data);
    }
    
    // Verifica tabelle ore chef
    console.log('🔍 Verifica tabelle ore chef...');
    
    const { data: propres, error: errorPropres } = await supabase
      .from('heures_chef_propres')
      .select('count(*)')
      .limit(1);
    
    if (errorPropres) {
      console.error('❌ Tabella heures_chef_propres mancante:', errorPropres.message);
    } else {
      console.log('✅ Tabella heures_chef_propres OK');
    }
    
    const { data: interim, error: errorInterim } = await supabase
      .from('heures_chef_interim')
      .select('count(*)')
      .limit(1);
    
    if (errorInterim) {
      console.error('❌ Tabella heures_chef_interim mancante:', errorInterim.message);
    } else {
      console.log('✅ Tabella heures_chef_interim OK');
    }
    
  } catch (error) {
    console.error('💥 Errore generale:', error);
  }
}

testConnection();