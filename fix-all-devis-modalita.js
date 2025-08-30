// Correzione modalità prezzi per tutti i devis basandosi sul backup originale
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAllDevisModalita() {
  console.log('🔧 Correzione modalità prezzi per tutti i devis...');
  
  try {
    // Carica backup originale
    const backupData = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-10-40.json', 'utf8'));
    const devisBackup = backupData.data.devis;
    
    // Carica devis da Supabase
    const { data: supabaseDevis, error } = await supabase
      .from('devis')
      .select('*');
    
    if (error) throw error;
    
    let updated = 0;
    
    for (const supaDevis of supabaseDevis) {
      // Trova il devis corrispondente nel backup
      const backupDevis = Object.values(devisBackup).find(d => d.numero === supaDevis.numero);
      
      if (!backupDevis) {
        console.log(`⚠️ ${supaDevis.numero}: Non trovato nel backup`);
        continue;
      }
      
      const originalModalita = backupDevis.modalitaPrezzi;
      const currentModalita = supaDevis.modalita_prezzi;
      
      console.log(`\n📋 ${supaDevis.numero}:`);
      console.log(`   Backup originale: "${originalModalita}"`);
      console.log(`   Supabase attuale: "${currentModalita}"`);
      
      if (originalModalita !== currentModalita) {
        console.log(`   🔄 Correzione necessaria: "${currentModalita}" → "${originalModalita}"`);
        
        const updateData = {
          modalita_prezzi: originalModalita
        };
        
        // Se era prezziFissi, svuota le remises
        if (originalModalita === 'prezziFissi') {
          updateData.remises = {};
        }
        
        const { error: updateError } = await supabase
          .from('devis')
          .update(updateData)
          .eq('id', supaDevis.id);
        
        if (updateError) {
          console.error(`   ❌ Errore:`, updateError);
        } else {
          console.log(`   ✅ Aggiornato con successo`);
          updated++;
        }
      } else {
        console.log(`   ✅ Già corretto`);
      }
    }
    
    console.log(`\n🎉 Correzione completata! ${updated} devis aggiornati`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixAllDevisModalita();