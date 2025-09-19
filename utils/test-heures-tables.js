// Test rapido tabelle ore
import { supabase } from './src/supabase.js';

async function testTables() {
  console.log('🔍 Test tabelle ore...');
  
  const tables = [
    'heures_ouvriers',
    'heures_chef_propres', 
    'heures_chef_interim'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK`);
      }
    } catch (err) {
      console.log(`💥 ${table}: ${err.message}`);
    }
  }
}

testTables();