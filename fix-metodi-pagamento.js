import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMetodiPagamento() {
  console.log('🔧 FIX METODI DI PAGAMENTO\n');

  try {
    // 1. Aggiorna tabella paiements con giorni corretti
    console.log('1️⃣ AGGIORNAMENTO TABELLA PAIEMENTS:');
    
    const metodiPagamento = [
      { nom: 'Comptant', jours_echeance: 0, description: 'Paiement immédiat' },
      { nom: '30 jours net', jours_echeance: 30, description: 'Paiement à 30 jours' },
      { nom: '60 jours net', jours_echeance: 60, description: 'Paiement à 60 jours' },
      { nom: 'Virement bancaire', jours_echeance: 30, description: 'Virement bancaire à 30 jours' },
      { nom: 'Chèque', jours_echeance: 30, description: 'Paiement par chèque à 30 jours' }
    ];

    for (const metodo of metodiPagamento) {
      const { error } = await supabase
        .from('paiements')
        .update({
          jours_echeance: metodo.jours_echeance,
          description: metodo.description
        })
        .eq('nom', metodo.nom);
      
      if (error) {
        console.log(`❌ Errore aggiornamento ${metodo.nom}:`, error.message);
      } else {
        console.log(`✅ ${metodo.nom}: ${metodo.jours_echeance} giorni`);
      }
    }

    // 2. Correggi fatture con date sbagliate
    console.log('\n2️⃣ CORREZIONE FATTURE ESISTENTI:');
    
    const { data: fattureProblematiche } = await supabase
      .from('factures')
      .select('*')
      .in('numero', ['F2025-054', 'F2025-055', 'F2025-053']);

    for (const fattura of fattureProblematiche || []) {
      if (fattura.date_facture) {
        const dataFattura = new Date(fattura.date_facture);
        
        // Estrai giorni dalle note o usa 30 di default
        let giorniScadenza = 30;
        if (fattura.notes?.includes('30 jours')) giorniScadenza = 30;
        else if (fattura.notes?.includes('60 jours')) giorniScadenza = 60;
        else if (fattura.notes?.includes('Comptant')) giorniScadenza = 0;
        
        const scadenzaCorretta = new Date(dataFattura);
        scadenzaCorretta.setDate(scadenzaCorretta.getDate() + giorniScadenza);
        
        const { error } = await supabase
          .from('factures')
          .update({
            date_echeance: scadenzaCorretta.toISOString().split('T')[0]
          })
          .eq('id', fattura.id);
        
        if (error) {
          console.log(`❌ Errore correzione ${fattura.numero}:`, error.message);
        } else {
          console.log(`✅ ${fattura.numero}: ${fattura.date_echeance} → ${scadenzaCorretta.toISOString().split('T')[0]}`);
        }
      }
    }

    // 3. Verifica risultati
    console.log('\n3️⃣ VERIFICA FINALE:');
    
    const { data: paiementsAggiornati } = await supabase.from('paiements').select('*');
    console.log('Metodi di pagamento aggiornati:');
    paiementsAggiornati?.forEach(p => {
      console.log(`  ${p.nom}: ${p.jours_echeance} giorni - ${p.description}`);
    });

    const { data: fattureCorrette } = await supabase
      .from('factures')
      .select('numero, date_facture, date_echeance')
      .in('numero', ['F2025-054', 'F2025-055', 'F2025-053']);
    
    console.log('\nFatture corrette:');
    fattureCorrette?.forEach(f => {
      const dataFattura = new Date(f.date_facture);
      const dataScadenza = new Date(f.date_echeance);
      const giorniDiff = Math.round((dataScadenza - dataFattura) / (1000 * 60 * 60 * 24));
      console.log(`  ${f.numero}: ${f.date_facture} → ${f.date_echeance} (${giorniDiff} giorni)`);
    });

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixMetodiPagamento();