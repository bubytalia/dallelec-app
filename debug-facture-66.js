const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aumhdoiwtichjlvbrnrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjI4NzQsImV4cCI6MjA1MDUzODg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
);

async function debugFacture66() {
  try {
    // 1. Controlla fattura 66
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('*')
      .eq('numero', 'F2025-066')
      .single();
    
    if (factureError) throw factureError;
    
    console.log('=== FATTURA 66 ===');
    console.log('Numero:', facture.numero);
    console.log('Data fattura:', facture.date_facture);
    console.log('Data scadenza:', facture.date_echeance);
    console.log('Notes:', facture.notes);
    
    // 2. Controlla modalità pagamento
    const { data: paiements, error: paiementsError } = await supabase
      .from('paiements')
      .select('*');
    
    if (paiementsError) throw paiementsError;
    
    console.log('\n=== MODALITÀ PAGAMENTO ===');
    paiements.forEach(p => {
      console.log(`${p.nom}: ${p.giorni_calcolo || 'N/A'} giorni`);
    });
    
    // 3. Estrai modalità dalle notes
    const modalitaMatch = facture.notes?.match(/Conditions:\s*([^\n]+)/);
    const modalitaPagamento = modalitaMatch ? modalitaMatch[1].trim() : 'Non trovata';
    
    console.log('\n=== ANALISI ===');
    console.log('Modalità estratta dalle notes:', modalitaPagamento);
    
    // 4. Trova modalità corrispondente
    const modalitaTrovata = paiements.find(p => p.nom === modalitaPagamento);
    console.log('Modalità trovata nel DB:', modalitaTrovata);
    
    // 5. Calcola data scadenza corretta
    if (modalitaTrovata) {
      const dataFattura = new Date(facture.date_facture);
      const giorniCorretti = modalitaTrovata.giorni_calcolo || 30;
      dataFattura.setDate(dataFattura.getDate() + giorniCorretti);
      const dataScadenzaCorretta = dataFattura.toISOString().split('T')[0];
      
      console.log('Data scadenza corretta dovrebbe essere:', dataScadenzaCorretta);
      console.log('Data scadenza attuale:', facture.date_echeance);
      console.log('Differenza:', facture.date_echeance !== dataScadenzaCorretta ? 'ERRORE!' : 'OK');
    }
    
  } catch (error) {
    console.error('Errore:', error);
  }
}

debugFacture66();