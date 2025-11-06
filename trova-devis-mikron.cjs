const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function trovaEAccoppiaDevis() {
  try {
    // 1. Trova il cantiere Mikron
    const { data: cantiere } = await supabase
      .from('chantiers')
      .select('*')
      .ilike('nom', '%Mikron%')
      .single();
    
    console.log('🏗️ Cantiere trovato:', cantiere);
    
    // 2. Trova tutti i devis che potrebbero essere del cantiere Mikron
    const { data: allDevis } = await supabase
      .from('devis')
      .select('*')
      .or('nom.ilike.%Mikron%,adresse.ilike.%Vignoble%');
    
    console.log('📋 Devis trovati:', allDevis?.length || 0);
    allDevis?.forEach(d => {
      console.log(`- ${d.numero}: "${d.nom}" - "${d.adresse}" (${d.produits?.length || 0} prodotti)`);
    });
    
    // 3. Trova devis non accoppiati
    const { data: cantieri } = await supabase
      .from('chantiers')
      .select('devis_id');
    
    const devisAccoppiati = cantieri.map(c => c.devis_id).filter(id => id);
    const devisNonAccoppiati = allDevis?.filter(d => !devisAccoppiati.includes(d.id)) || [];
    
    console.log('🔗 Devis già accoppiati:', devisAccoppiati);
    console.log('❌ Devis NON accoppiati:', devisNonAccoppiati.map(d => `${d.numero} (ID: ${d.id})`));
    
    // 4. Accoppia tutti i devis non accoppiati
    for (let i = 0; i < devisNonAccoppiati.length; i++) {
      const devisDaAccoppiare = devisNonAccoppiati[i];
      const suffisso = i === 0 ? '-BIS' : `-BIS${i+1}`;
      
      console.log(`🔗 Accoppiando devis ${devisDaAccoppiare.numero} al cantiere ${cantiere.nom}`);
      
      // Crea un nuovo cantiere per ogni devis supplementare
      const { data: nuovoCantiere, error } = await supabase
        .from('chantiers')
        .insert({
          nom: cantiere.nom,
          adresse: cantiere.adresse,
          devis_id: devisDaAccoppiare.id,
          capocantiere: cantiere.capocantiere,
          numero_cantiere: cantiere.numero_cantiere + suffisso
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Errore creazione cantiere per devis ${devisDaAccoppiare.numero}:`, error);
      } else {
        console.log(`✅ Nuovo cantiere creato per devis ${devisDaAccoppiare.numero}:`, nuovoCantiere.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

trovaEAccoppiaDevis();