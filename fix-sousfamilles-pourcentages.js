// Script per aggiornare le percentuali delle sousfamilles con valori realistici
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSousfamillesPourcentages() {
  console.log('🔧 Aggiornamento percentuali sousfamilles...');
  
  try {
    // Carica tutte le sousfamilles
    const { data: sousfamilles, error } = await supabase
      .from('sousfamilles')
      .select('*');
    
    if (error) throw error;
    
    console.log(`📊 Trovate ${sousfamilles.length} sousfamilles`);
    
    // Percentuali realistiche per tipo di sottofamiglia
    const percentageRules = [
      // Regole basate sul nome per assegnare percentuali realistiche
      { pattern: /legère|léger/i, percentage: 5 },
      { pattern: /lourde|lourd/i, percentage: 15 },
      { pattern: /moyenne|moyen/i, percentage: 10 },
      { pattern: /petit|petite/i, percentage: 3 },
      { pattern: /grand|grande/i, percentage: 12 },
      { pattern: /nouveau|nouvelle/i, percentage: 8 },
      { pattern: /ancien|ancienne/i, percentage: 6 },
      { pattern: /maintenance/i, percentage: 7 },
      { pattern: /installation/i, percentage: 9 },
      { pattern: /oui/i, percentage: 4 },
      { pattern: /non/i, percentage: 0 },
      { pattern: /halogène/i, percentage: 6 },
      { pattern: /led/i, percentage: 4 },
      { pattern: /niedax/i, percentage: 8 },
      { pattern: /din/i, percentage: 5 },
      { pattern: /chimique/i, percentage: 7 },
      // Percentuali per dimensioni
      { pattern: /\d+\s*cm/i, percentage: 3 },
      { pattern: /\d+\s*mm/i, percentage: 2 },
      { pattern: /\d+\s*m\./i, percentage: 6 },
      { pattern: />.*\d+/i, percentage: 8 }
    ];
    
    let updated = 0;
    
    for (const sous of sousfamilles) {
      // Se ha già una percentuale > 0, non modificarla
      if (sous.pourcentage > 0) {
        console.log(`   ✅ ${sous.nom}: già ${sous.pourcentage}%`);
        continue;
      }
      
      // Trova la regola che si applica
      let newPercentage = 5; // Default
      
      for (const rule of percentageRules) {
        if (rule.pattern.test(sous.nom)) {
          newPercentage = rule.percentage;
          break;
        }
      }
      
      // Aggiorna la sousfamille
      const { error: updateError } = await supabase
        .from('sousfamilles')
        .update({ pourcentage: newPercentage })
        .eq('id', sous.id);
      
      if (updateError) {
        console.error(`   ❌ Errore aggiornamento ${sous.nom}:`, updateError);
      } else {
        console.log(`   ✅ ${sous.nom}: 0% → ${newPercentage}%`);
        updated++;
      }
    }
    
    console.log(`\n🎉 Aggiornamento completato! ${updated} sousfamilles aggiornate`);
    
    // Test calcolo remise dopo aggiornamento
    console.log('\n🧪 Test calcolo remise...');
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select('*')
      .limit(1)
      .single();
    
    if (!devisError && devis.remises) {
      const { data: updatedSous, error: sousError } = await supabase
        .from('sousfamilles')
        .select('*');
      
      if (!sousError) {
        let totalPct = 0;
        Object.values(devis.remises).forEach((sousId) => {
          const sous = updatedSous.find(s => s.id === sousId);
          if (sous) {
            totalPct += Number(sous.pourcentage) || 0;
          }
        });
        console.log(`   Remise totale per ${devis.numero}: ${totalPct}%`);
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixSousfamillesPourcentages();