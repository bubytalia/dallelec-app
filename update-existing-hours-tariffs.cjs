// Script per aggiornare le ore esistenti con le tariffe attuali
// Da eseguire UNA SOLA VOLTA dopo aver aggiunto le colonne tarif_utilise

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateExistingHoursTariffs() {
  console.log('🔄 Aggiornamento tariffe ore esistenti...');

  try {
    // 1. Aggiorna heures_chef_propres
    console.log('📊 Aggiornamento heures_chef_propres...');
    const { data: heuresChef, error: errorChef } = await supabase
      .from('heures_chef_propres')
      .select('*')
      .is('tarif_utilise', null);

    if (errorChef) throw errorChef;

    for (const heure of heuresChef) {
      const { error } = await supabase
        .from('heures_chef_propres')
        .update({ tarif_utilise: 45 }) // Tariffa chef standard
        .eq('id', heure.id);
      
      if (error) console.error(`Errore aggiornamento chef ${heure.id}:`, error);
    }
    console.log(`✅ Aggiornate ${heuresChef.length} ore chef`);

    // 2. Aggiorna heures_ouvriers
    console.log('📊 Aggiornamento heures_ouvriers...');
    const { data: heuresOuvriers, error: errorOuvriers } = await supabase
      .from('heures_ouvriers')
      .select('*')
      .is('tarif_utilise', null);

    if (errorOuvriers) throw errorOuvriers;

    for (const heure of heuresOuvriers) {
      const { error } = await supabase
        .from('heures_ouvriers')
        .update({ tarif_utilise: 25 }) // Tariffa ouvrier standard
        .eq('id', heure.id);
      
      if (error) console.error(`Errore aggiornamento ouvrier ${heure.id}:`, error);
    }
    console.log(`✅ Aggiornate ${heuresOuvriers.length} ore ouvriers`);

    // 3. Aggiorna heures_chef_interim
    console.log('📊 Aggiornamento heures_chef_interim...');
    const { data: heuresInterim, error: errorInterim } = await supabase
      .from('heures_chef_interim')
      .select('*')
      .is('tarif_utilise', null);

    if (errorInterim) throw errorInterim;

    for (const heure of heuresInterim) {
      const { error } = await supabase
        .from('heures_chef_interim')
        .update({ tarif_utilise: 35 }) // Tariffa interim standard
        .eq('id', heure.id);
      
      if (error) console.error(`Errore aggiornamento interim ${heure.id}:`, error);
    }
    console.log(`✅ Aggiornate ${heuresInterim.length} ore interim`);

    console.log('🎉 Aggiornamento completato!');
    console.log('📋 Ora i bilanci storici sono protetti da modifiche retroattive');

  } catch (error) {
    console.error('❌ Errore durante aggiornamento:', error);
  }
}

// Esegui lo script
updateExistingHoursTariffs();