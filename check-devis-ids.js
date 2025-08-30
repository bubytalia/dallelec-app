// Script per verificare gli ID dei devis nel backup vs Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDevisIds() {
  console.log('🔍 Confronto ID devis...');
  
  try {
    // Carica devis da Supabase
    const { data: supabaseDevis, error } = await supabase
      .from('devis')
      .select('*');
    
    if (error) throw error;
    
    // Carica backup
    const backupData = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-10-40.json', 'utf8'));
    const devisBackup = backupData.data.devis;
    
    console.log('📋 Devis in Supabase:');
    supabaseDevis.forEach(d => {
      console.log(`   ${d.numero}: Firebase ID = ${d.firebase_id}`);
    });
    
    console.log('\\n📄 Devis nel backup:');
    Object.keys(devisBackup).forEach(id => {
      const d = devisBackup[id];
      console.log(`   ${d.numero}: ID = ${id}, Prodotti = ${d.produits ? d.produits.length : 0}`);
    });
    
    console.log('\\n🔍 Tentativo match per numero:');
    supabaseDevis.forEach(supaD => {
      const matchByNumber = Object.values(devisBackup).find(backupD => 
        backupD.numero === supaD.numero
      );
      
      if (matchByNumber) {
        const backupId = Object.keys(devisBackup).find(id => devisBackup[id] === matchByNumber);
        console.log(`   ✅ ${supaD.numero}: Supabase ID=${supaD.firebase_id} → Backup ID=${backupId}`);
        console.log(`      Prodotti nel backup: ${matchByNumber.produits ? matchByNumber.produits.length : 0}`);
      } else {
        console.log(`   ❌ ${supaD.numero}: Non trovato nel backup`);
      }
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

checkDevisIds();