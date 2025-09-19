// Debug configurazione Supabase
console.log('🔍 DEBUG SUPABASE CONFIG');
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// Test connessione
import { supabase } from './src/supabase.js';

async function testConnection() {
  try {
    const { data, error } = await supabase.from('clients').select('count').single();
    console.log('✅ Connessione OK');
    console.log('Clients count:', data);
  } catch (error) {
    console.error('❌ Errore connessione:', error);
  }
}

testConnection();