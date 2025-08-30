// Script per popolare modalita_prezzi e remises nei devis esistenti
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixModalitaPrezziDevis() {
  console.log('🔧 Popolamento modalità prezzi e remises devis...');
  
  try {
    // Carica tutti i devis
    const { data: devis, error } = await supabase
      .from('devis')
      .select('*');
    
    if (error) throw error;
    
    console.log(`📋 Trovati ${devis.length} devis`);
    
    // Carica familles e sousfamilles per creare remises di default
    const { data: familles, error: famError } = await supabase
      .from('familles')
      .select('*');
    
    const { data: sousfamilles, error: sousError } = await supabase
      .from('sousfamilles')
      .select('*');
    
    if (famError || sousError) {
      console.error('Errore caricamento familles/sousfamilles:', famError || sousError);
      return;
    }
    
    console.log(`📊 Trovate ${familles.length} familles e ${sousfamilles.length} sousfamilles`);
    
    for (const d of devis) {
      console.log(`\n🔍 Devis ${d.numero} (${d.nom})`);
      console.log(`   Modalità attuale:`, d.modalita_prezzi);
      console.log(`   Remises attuali:`, d.remises);
      
      let needsUpdate = false;
      const updateData = {};
      
      // Se non ha modalità prezzi, imposta scontistica
      if (!d.modalita_prezzi) {
        updateData.modalita_prezzi = 'scontistica';
        needsUpdate = true;
        console.log(`   ➕ Impostata modalità: scontistica`);
      }
      
      // Se non ha remises e modalità è scontistica, crea remises di default
      if (!d.remises && (d.modalita_prezzi === 'scontistica' || !d.modalita_prezzi)) {
        const defaultRemises = {};
        
        // Per ogni famiglia, seleziona la prima sottofamiglia disponibile
        familles.forEach(fam => {
          const firstSous = sousfamilles.find(s => s.famille_id === fam.firebase_id);
          if (firstSous) {
            defaultRemises[fam.firebase_id] = firstSous.id;
          }
        });
        
        updateData.remises = defaultRemises;
        needsUpdate = true;
        console.log(`   ➕ Aggiunte remises di default:`, Object.keys(defaultRemises).length, 'familles');
      }
      
      // Aggiorna il devis se necessario
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('devis')
          .update(updateData)
          .eq('id', d.id);
        
        if (updateError) {
          console.error(`   ❌ Errore aggiornamento:`, updateError);
        } else {
          console.log(`   ✅ Devis aggiornato con successo`);
        }
      } else {
        console.log(`   ✅ Nessun aggiornamento necessario`);
      }
    }
    
    console.log('\n🎉 Popolamento modalità prezzi completato!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixModalitaPrezziDevis();