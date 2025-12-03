import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDevisColumns() {
  try {
    const { data, error } = await supabase
      .from('devis')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Errore:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('🔍 Colonne disponibili nella tabella devis:');
      console.log(Object.keys(data[0]));
    }
    
  } catch (error) {
    console.error('Errore:', error);
  }
}

checkDevisColumns();