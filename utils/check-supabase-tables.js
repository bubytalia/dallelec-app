import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'clients', 'chantiers', 'devis', 'produits', 'supplements', 
  'familles', 'sousfamilles', 'techniciens', 'admins', 
  'collaborateurs', 'interimaires', 'chefdechantiers',
  'conditions', 'paiements', 'factures', 'metrages',
  'heures', 'absences', 'regies'
];

async function checkTables() {
  console.log('📊 Controllo tabelle Supabase...\n');
  
  let totalRecords = 0;
  let existingTables = 0;
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} records`);
        totalRecords += count || 0;
        existingTables++;
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log(`\n📈 RIEPILOGO:`);
  console.log(`- Tabelle esistenti: ${existingTables}/${tables.length}`);
  console.log(`- Record totali: ${totalRecords}`);
}

checkTables();