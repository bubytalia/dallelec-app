// Script per recuperare i prodotti dei devis dal backup e aggiornarli in Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreDevisProduits() {
  console.log('🔄 Recupero prodotti devis dal backup...');
  
  try {
    // Carica devis da Supabase
    const { data: supabaseDevis, error } = await supabase
      .from('devis')
      .select('*');
    
    if (error) throw error;
    
    // Carica backup
    const backupFile = 'dallelec-backup-2025-08-26-19-10-40.json';
    if (!fs.existsSync(backupFile)) {
      console.error('❌ File backup non trovato:', backupFile);
      return;
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const devisBackup = backupData.data.devis;
    console.log(`📄 Backup caricato: ${Object.keys(devisBackup).length} devis`);
    
    let updated = 0;
    
    // Per ogni devis in Supabase, cerca il corrispondente nel backup
    for (const supaDevis of supabaseDevis) {
      console.log(`\n🔍 Processando ${supaDevis.numero} (${supaDevis.nom})`);
      
      // Trova il devis corrispondente nel backup usando il numero
      const backupDevis = Object.values(devisBackup).find(d => d.numero === supaDevis.numero);
      
      if (!backupDevis) {
        console.log(`   ⚠️ Non trovato nel backup`);
        continue;
      }
      
      console.log(`   ✅ Trovato nel backup`);
      console.log(`   📦 Prodotti nel backup: ${backupDevis.produits ? backupDevis.produits.length : 0}`);
      
      if (backupDevis.produits && backupDevis.produits.length > 0) {
        // Aggiorna il devis in Supabase con i prodotti dal backup
        const updateData = {
          produits: backupDevis.produits
        };
        
        // Aggiungi anche altri campi se mancanti
        if (backupDevis.discount !== undefined) {
          updateData.discount = backupDevis.discount;
        }
        
        const { error: updateError } = await supabase
          .from('devis')
          .update(updateData)
          .eq('id', supaDevis.id);
        
        if (updateError) {
          console.error(`   ❌ Errore aggiornamento:`, updateError);
        } else {
          console.log(`   ✅ Prodotti aggiornati: ${backupDevis.produits.length} items`);
          updated++;
        }
      } else {
        console.log(`   ⚠️ Nessun prodotto nel backup`);
      }
    }
    
    console.log(`\n🎉 Recupero completato! ${updated} devis aggiornati`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

restoreDevisProduits();