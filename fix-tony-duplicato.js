import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTonyDuplicato() {
  console.log('🔧 FIX TONY DUPLICATO\n');

  try {
    // 1. Verifica situazione attuale
    const { data: chefs } = await supabase.from('chefdechantiers').select('*').eq('email', 'tony.maullier@dallelec.com');
    const { data: ouvriers } = await supabase.from('collaborateurs').select('*').eq('email', 'tony.maullier@dallelec.com');
    
    console.log('Tony come chef:', chefs);
    console.log('Tony come ouvrier:', ouvriers);
    
    // 2. Verifica ore
    const { data: heuresChef } = await supabase.from('heures_chef_propres').select('*').eq('chef_id', 'tony.maullier@dallelec.com');
    const { data: heuresOuvrier } = await supabase.from('heures_ouvriers').select('*').eq('ouvrier_id', 'tony.maullier@dallelec.com');
    
    console.log('Ore Tony come chef:', heuresChef?.length || 0);
    console.log('Ore Tony come ouvrier:', heuresOuvrier?.length || 0);
    
    // 3. Decisione: Tony ha più ore come ouvrier, quindi rimuoviamo da chefs
    if (chefs && chefs.length > 0 && heuresOuvrier && heuresOuvrier.length > 0) {
      console.log('\n🎯 Tony ha ore come ouvrier, rimuovo da chefdechantiers...');
      
      const { error } = await supabase
        .from('chefdechantiers')
        .delete()
        .eq('email', 'tony.maullier@dallelec.com');
        
      if (error) {
        console.error('❌ Errore rimozione:', error);
      } else {
        console.log('✅ Tony rimosso da chefdechantiers');
      }
    }
    
    // 4. Verifica finale
    const { data: chefsFinale } = await supabase.from('chefdechantiers').select('*').eq('email', 'tony.maullier@dallelec.com');
    console.log('\n📊 Situazione finale:');
    console.log('Tony in chefdechantiers:', chefsFinale?.length || 0);
    console.log('Tony rimane solo come ouvrier ✅');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixTonyDuplicato();