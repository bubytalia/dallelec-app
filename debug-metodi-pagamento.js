import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMetodiPagamento() {
  console.log('🔍 DEBUG METODI DI PAGAMENTO\n');

  try {
    // 1. Verifica tabella paiements
    console.log('1️⃣ TABELLA PAIEMENTS:');
    const { data: paiements, error: paiementsError } = await supabase.from('paiements').select('*');
    
    if (paiementsError) {
      console.log('❌ Errore paiements:', paiementsError.message);
    } else {
      console.log('✅ Paiements trovati:', paiements?.length || 0);
      paiements?.forEach(p => {
        console.log(`  - ${p.nom}: ${p.jours_echeance} giorni, ${p.description || 'N/A'}`);
      });
    }

    // 2. Verifica configurazione fatture
    console.log('\n2️⃣ CONFIGURAZIONE FATTURE:');
    const { data: config, error: configError } = await supabase.from('configurazione_fatture').select('*');
    
    if (configError) {
      console.log('❌ Errore config:', configError.message);
    } else {
      console.log('✅ Configurazione:', config?.[0] || 'Nessuna');
    }

    // 3. Verifica fattura specifica F2025-054
    console.log('\n3️⃣ FATTURA F2025-054:');
    const { data: fattura, error: fatturaError } = await supabase
      .from('factures')
      .select('*')
      .eq('numero', 'F2025-054')
      .single();
    
    if (fatturaError) {
      console.log('❌ Errore fattura:', fatturaError.message);
    } else {
      console.log('✅ Fattura trovata:');
      console.log('  Data fattura:', fattura.date_facture);
      console.log('  Data scadenza:', fattura.date_echeance);
      console.log('  Notes:', fattura.notes);
      console.log('  Metodo pagamento:', fattura.metodo_pagamento || 'Non specificato');
      
      // Calcola scadenza corretta
      if (fattura.date_facture) {
        const dataFattura = new Date(fattura.date_facture);
        const scadenzaCalcolata = new Date(dataFattura);
        scadenzaCalcolata.setDate(scadenzaCalcolata.getDate() + 30);
        
        console.log('  Scadenza calcolata (+30 giorni):', scadenzaCalcolata.toISOString().split('T')[0]);
        console.log('  Scadenza attuale:', fattura.date_echeance);
        console.log('  ❌ DISCREPANZA:', fattura.date_echeance !== scadenzaCalcolata.toISOString().split('T')[0]);
      }
    }

    // 4. Verifica altre fatture con problemi simili
    console.log('\n4️⃣ VERIFICA ALTRE FATTURE:');
    const { data: tutteFacture, error: tutteError } = await supabase
      .from('factures')
      .select('numero, date_facture, date_echeance, notes')
      .order('date_facture', { ascending: false })
      .limit(10);
    
    if (tutteError) {
      console.log('❌ Errore:', tutteError.message);
    } else {
      console.log('✅ Ultime 10 fatture:');
      tutteFacture?.forEach(f => {
        if (f.date_facture && f.date_echeance) {
          const dataFattura = new Date(f.date_facture);
          const dataScadenza = new Date(f.date_echeance);
          const giorniDiff = Math.round((dataScadenza - dataFattura) / (1000 * 60 * 60 * 24));
          
          const condizioni = f.notes?.includes('Conditions:') ? 
            f.notes.split('Conditions: ')[1]?.split('\n')[0] || 'N/A' : 'N/A';
          
          console.log(`  ${f.numero}: ${f.date_facture} → ${f.date_echeance} (${giorniDiff} giorni) - ${condizioni}`);
          
          if (giorniDiff !== 30) {
            console.log(`    ⚠️ ANOMALIA: ${giorniDiff} giorni invece di 30`);
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

debugMetodiPagamento();