// Script per debuggare il calcolo delle remises
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRemisesCalculation() {
  console.log('🔍 Debug calcolo remises...');
  
  try {
    // Carica un devis di esempio
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select('*')
      .limit(1)
      .single();
    
    if (devisError) throw devisError;
    
    console.log(`📋 Devis: ${devis.numero}`);
    console.log(`   Modalità: ${devis.modalita_prezzi}`);
    console.log(`   Remises:`, devis.remises);
    
    // Carica familles e sousfamilles
    const { data: familles, error: famError } = await supabase
      .from('familles')
      .select('*');
    
    const { data: sousfamilles, error: sousError } = await supabase
      .from('sousfamilles')
      .select('*');
    
    if (famError || sousError) {
      console.error('Errore caricamento:', famError || sousError);
      return;
    }
    
    console.log(`\n📊 Familles: ${familles.length}`);
    familles.slice(0, 3).forEach(f => {
      console.log(`   ${f.id}: ${f.nom} (firebase_id: ${f.firebase_id})`);
    });
    
    console.log(`\n📊 SousFamilles: ${sousfamilles.length}`);
    sousfamilles.slice(0, 3).forEach(s => {
      console.log(`   ${s.id}: ${s.nom} (firebase_id: ${s.firebase_id}, famille_id: ${s.famille_id}, pourcentage: ${s.pourcentage}%)`);
    });
    
    // Calcola remise come nel codice attuale
    console.log(`\n🧮 Calcolo remise attuale:`);
    const remisesObj = devis.remises || {};
    let totalPct = 0;
    
    Object.entries(remisesObj).forEach(([familleId, sousId]) => {
      console.log(`   Famiglia ${familleId} → SousFamiglia ${sousId}`);
      
      // Metodo attuale (probabilmente sbagliato)
      const sous1 = sousfamilles.find(s => s.id === sousId);
      console.log(`     Metodo 1 (s.id === sousId): ${sous1 ? sous1.nom + ' (' + sous1.pourcentage + '%)' : 'NON TROVATO'}`);
      
      // Metodo alternativo
      const sous2 = sousfamilles.find(s => s.firebase_id === sousId);
      console.log(`     Metodo 2 (s.firebase_id === sousId): ${sous2 ? sous2.nom + ' (' + sous2.pourcentage + '%)' : 'NON TROVATO'}`);
      
      // Usa il metodo che funziona
      const sous = sous1 || sous2;
      if (sous && typeof sous.pourcentage !== 'undefined') {
        totalPct += Number(sous.pourcentage) || 0;
      }
    });
    
    console.log(`\n📈 Remise totale calcolata: ${totalPct}%`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

debugRemisesCalculation();