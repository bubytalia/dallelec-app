import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugResocontiRecenti() {
  console.log('🔍 Verifica resoconti recenti...\n');
  
  try {
    // Tutti i resoconti ordinati per data
    const { data: resoconti, error } = await supabase
      .from('resoconti_percentuali')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`📋 Trovati ${resoconti.length} resoconti totali:\n`);
    
    resoconti.forEach((resoconto, index) => {
      console.log(`--- RESOCONTO ${index + 1} ---`);
      console.log('ID:', resoconto.id);
      console.log('Chantier ID:', resoconto.chantier_id);
      console.log('Capocantiere:', resoconto.capocantiere);
      console.log('Période:', resoconto.periode_month);
      console.log('Status:', resoconto.status);
      console.log('Draft:', resoconto.draft);
      console.log('Created:', resoconto.created_at);
      console.log('Avancementi:', resoconto.avancementi);
      console.log('Régies:', resoconto.regies);
      console.log('Régies length:', resoconto.regies?.length || 0);
      
      if (resoconto.regies?.length > 0) {
        console.log('DÉTAIL RÉGIES:');
        resoconto.regies.forEach((regie, i) => {
          console.log(`  ${i + 1}. Zone: ${regie.zone}, Heures: ${regie.heures}, Prix: ${regie.prixHeure}, Description: ${regie.description}`);
        });
      }
      console.log('');
    });
    
    // Verifica anche chantiers per danielemaggi
    console.log('\n🏗️ Chantiers per danielemaggi@dallelec.com:');
    const { data: chantiers, error: errorChantiers } = await supabase
      .from('chantiers')
      .select('id, nom, numero_cantiere')
      .eq('capocantiere', 'danielemaggi@dallelec.com');
    
    if (chantiers) {
      chantiers.forEach(c => {
        console.log(`- ID ${c.id}: ${c.numero_cantiere ? `N° ${c.numero_cantiere} - ` : ''}${c.nom}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

debugResocontiRecenti();