// Script per rinumerare le fatture da F2026-001
// Esegui con: node RINUMERA_FATTURE.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MTU5NzAsImV4cCI6MjA1MTQ5MTk3MH0.s_CtbBXKHN_zqXqJqLqy-5Uw7Ry3Uw_6vJYqGqJqGqI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function rinumeraFatture() {
  try {
    // 1. Carica tutte le fatture 2026 ordinate per data
    const { data: fatture, error } = await supabase
      .from('factures')
      .select('*')
      .like('numero', 'F2026-%')
      .order('date_facture', { ascending: true });
    
    if (error) throw error;
    
    console.log(`📋 Trovate ${fatture.length} fatture da rinumerare`);
    
    // 2. Rinumera partendo da 001
    for (let i = 0; i < fatture.length; i++) {
      const nuovoNumero = `F2026-${String(i + 1).padStart(3, '0')}`;
      const vecchioNumero = fatture[i].numero;
      
      const { error: updateError } = await supabase
        .from('factures')
        .update({ numero: nuovoNumero })
        .eq('id', fatture[i].id);
      
      if (updateError) {
        console.error(`❌ Errore aggiornamento ${vecchioNumero}:`, updateError);
      } else {
        console.log(`✅ ${vecchioNumero} → ${nuovoNumero}`);
      }
    }
    
    console.log('\n🎉 Rinumerazione completata!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

rinumeraFatture();
