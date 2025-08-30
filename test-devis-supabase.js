// Test per verificare il caricamento dei devis da Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDevis() {
  console.log('🧪 Test caricamento devis da Supabase...');
  
  try {
    // Test 1: Carica tutti i devis
    console.log('\n📋 Caricamento tutti i devis...');
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select('*');
    
    if (devisError) {
      console.error('❌ Errore caricamento devis:', devisError);
    } else {
      console.log(`✅ Trovati ${devis.length} devis`);
      devis.forEach(d => {
        console.log(`  - ID: ${d.id}, Numero: ${d.numero}, Nome: ${d.nom}`);
      });
    }
    
    // Test 2: Carica clients per mappatura
    console.log('\n👥 Caricamento clients...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');
    
    if (clientsError) {
      console.error('❌ Errore caricamento clients:', clientsError);
    } else {
      console.log(`✅ Trovati ${clients.length} clients`);
    }
    
    // Test 3: Verifica struttura tabella devis
    console.log('\n🔍 Verifica struttura tabella devis...');
    if (devis.length > 0) {
      const firstDevis = devis[0];
      console.log('Campi disponibili:', Object.keys(firstDevis));
      
      // Verifica campi necessari
      const requiredFields = ['zones', 'modalita_prezzi', 'remises', 'produits', 'discount', 'draft'];
      const missingFields = requiredFields.filter(field => !(field in firstDevis));
      
      if (missingFields.length > 0) {
        console.log('⚠️ Campi mancanti:', missingFields);
        console.log('📝 Eseguire manualmente nel dashboard Supabase:');
        missingFields.forEach(field => {
          let sqlType = 'JSONB';
          if (field === 'modalita_prezzi') sqlType = 'TEXT DEFAULT \'scontistica\'';
          if (field === 'discount') sqlType = 'DECIMAL(5,2) DEFAULT 0';
          if (field === 'draft') sqlType = 'BOOLEAN DEFAULT true';
          console.log(`   ALTER TABLE devis ADD COLUMN ${field} ${sqlType};`);
        });
      } else {
        console.log('✅ Tutti i campi necessari sono presenti');
      }
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

testDevis();