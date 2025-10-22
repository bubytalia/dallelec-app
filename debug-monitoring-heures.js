import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMonitoringHeures() {
  console.log('🔍 DEBUG MONITORING HEURES\n');

  try {
    // 1. Verifica dipendenti
    console.log('1️⃣ DIPENDENTI REGISTRATI:');
    const { data: collaborateurs } = await supabase.from('collaborateurs').select('*');
    const { data: chefs } = await supabase.from('chefdechantiers').select('*');
    
    console.log('Collaborateurs:', collaborateurs?.map(c => `${c.nom} ${c.prenom} (${c.email})`));
    console.log('Chefs:', chefs?.map(c => `${c.nom} ${c.prenom} (${c.email})`));

    // 2. Verifica ore nelle tabelle
    console.log('\n2️⃣ ORE NEL DATABASE:');
    
    const { data: heuresChef } = await supabase.from('heures_chef_propres').select('*');
    const { data: heuresInterim } = await supabase.from('heures_chef_interim').select('*');
    const { data: heuresOuvriers } = await supabase.from('heures_ouvriers').select('*');
    
    console.log(`heures_chef_propres: ${heuresChef?.length || 0} record`);
    console.log(`heures_chef_interim: ${heuresInterim?.length || 0} record`);
    console.log(`heures_ouvriers: ${heuresOuvriers?.length || 0} record`);

    // 3. Analisi specifica Junior e Tony
    console.log('\n3️⃣ ANALISI JUNIOR E TONY:');
    
    // Junior
    const juniorChef = heuresChef?.filter(h => h.chef_id === 'junior.repellin@dallelec.ch') || [];
    const juniorOuvrier = heuresOuvriers?.filter(h => h.ouvrier_id === 'junior.repellin@dallelec.ch') || [];
    
    console.log(`Junior (chef): ${juniorChef.length} record`);
    if (juniorChef.length > 0) {
      console.log('  Mesi:', [...new Set(juniorChef.map(h => h.date.substring(0, 7)))]);
      console.log('  Esempio:', juniorChef[0]);
    }
    
    console.log(`Junior (ouvrier): ${juniorOuvrier.length} record`);
    if (juniorOuvrier.length > 0) {
      console.log('  Mesi:', [...new Set(juniorOuvrier.map(h => h.date.substring(0, 7)))]);
      console.log('  Esempio:', juniorOuvrier[0]);
    }
    
    // Tony
    const tonyOuvrier = heuresOuvriers?.filter(h => h.ouvrier_id === 'tony.maullier@dallelec.com') || [];
    
    console.log(`Tony (ouvrier): ${tonyOuvrier.length} record`);
    if (tonyOuvrier.length > 0) {
      console.log('  Mesi:', [...new Set(tonyOuvrier.map(h => h.date.substring(0, 7)))]);
      console.log('  Esempio:', tonyOuvrier[0]);
    }

    // 4. Verifica email nei dipendenti
    console.log('\n4️⃣ VERIFICA EMAIL DIPENDENTI:');
    
    const allEmployees = [
      ...(chefs || []).map(c => ({ email: c.email, nome: `${c.nom} ${c.prenom}`, tipo: 'chef' })),
      ...(collaborateurs || []).map(c => ({ email: c.email, nome: `${c.nom} ${c.prenom}`, tipo: 'ouvrier' }))
    ];
    
    console.log('Tutti i dipendenti:');
    allEmployees.forEach(emp => {
      console.log(`  ${emp.nome} - ${emp.email} (${emp.tipo})`);
    });
    
    // Verifica se Junior e Tony sono nei dipendenti
    const juniorInList = allEmployees.find(e => e.email === 'junior.repellin@dallelec.ch');
    const tonyInList = allEmployees.find(e => e.email === 'tony.maullier@dallelec.com');
    
    console.log('\nPresenza nella lista dipendenti:');
    console.log(`Junior: ${juniorInList ? '✅ Presente' : '❌ Mancante'}`);
    console.log(`Tony: ${tonyInList ? '✅ Presente' : '❌ Mancante'}`);

    // 5. Test mese corrente
    console.log('\n5️⃣ TEST MESE CORRENTE (2025-02):');
    
    const currentMonth = '2025-02';
    const juniorOreCorrente = [...juniorChef, ...juniorOuvrier].filter(h => h.date.startsWith(currentMonth));
    const tonyOreCorrente = tonyOuvrier.filter(h => h.date.startsWith(currentMonth));
    
    console.log(`Junior ore febbraio 2025: ${juniorOreCorrente.length}`);
    console.log(`Tony ore febbraio 2025: ${tonyOreCorrente.length}`);

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

debugMonitoringHeures();