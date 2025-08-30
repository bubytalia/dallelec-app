// Script per verificare i prodotti nei devis e nel backup originale
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDevisProduits() {
  console.log('🔍 Verifica prodotti nei devis...');
  
  try {
    // Carica tutti i devis da Supabase
    const { data: devis, error } = await supabase
      .from('devis')
      .select('*');
    
    if (error) throw error;
    
    console.log(`📋 Devis in Supabase: ${devis.length}`);
    
    // Verifica prodotti in ogni devis
    for (const d of devis) {
      console.log(`\n🔍 Devis ${d.numero} (${d.nom})`);
      console.log(`   Firebase ID: ${d.firebase_id}`);
      console.log(`   Produits: ${d.produits ? JSON.stringify(d.produits).substring(0, 100) + '...' : 'NULL'}`);
      console.log(`   Total: ${d.total}`);
    }
    
    // Cerca file di backup per recuperare i prodotti originali
    console.log('\n📁 Ricerca file di backup...');
    const backupFiles = [
      'dallelec-backup-2025-08-26-19-10-40.json',
      'dallelec-backup-2025-08-26-19-31-34.json'
    ];
    
    for (const filename of backupFiles) {
      if (fs.existsSync(filename)) {
        console.log(`\n📄 Trovato backup: ${filename}`);
        
        try {
          const backupData = JSON.parse(fs.readFileSync(filename, 'utf8'));
          
          if (backupData.devis) {
            console.log(`   Devis nel backup: ${backupData.devis.length}`);
            
            // Mostra primi 2 devis del backup per vedere la struttura
            backupData.devis.slice(0, 2).forEach((d, i) => {
              console.log(`\n   Devis ${i + 1}:`);
              console.log(`     ID: ${d.id}`);
              console.log(`     Numero: ${d.numero}`);
              console.log(`     Nome: ${d.nom}`);
              console.log(`     Ha produits: ${d.produits ? 'SÌ (' + d.produits.length + ' items)' : 'NO'}`);
              if (d.produits && d.produits.length > 0) {
                console.log(`     Primo prodotto: ${JSON.stringify(d.produits[0]).substring(0, 150)}...`);
              }
            });
          }
        } catch (e) {
          console.error(`   ❌ Errore lettura backup: ${e.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

checkDevisProduits();