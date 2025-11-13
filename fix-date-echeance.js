import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const calculateDateEcheance = (dateFacture, conditionsPaiement) => {
  const date = new Date(dateFacture);
  
  // Estrai i giorni dalle condizioni di pagamento
  const match = conditionsPaiement?.match(/(\d+)\s*jours?/i);
  const giorni = match ? parseInt(match[1]) : 30; // Default 30 giorni
  
  // Aggiungi i giorni alla data fattura
  date.setDate(date.getDate() + giorni);
  
  return date.toISOString().split('T')[0];
};

const fixDateEcheance = async () => {
  try {
    console.log('🔍 Caricamento fatture...');
    
    const { data: factures, error } = await supabase
      .from('factures')
      .select('*');
    
    if (error) throw error;
    
    console.log(`📊 Trovate ${factures.length} fatture`);
    
    let corrette = 0;
    
    for (const facture of factures) {
      // Estrai condizioni dalle note
      let condizioni = '30 jours net'; // Default
      if (facture.notes?.includes('Conditions:')) {
        condizioni = facture.notes.split('Conditions: ')[1]?.split('\n')[0] || '30 jours net';
      }
      
      // Calcola la data corretta
      const dataCorretta = calculateDateEcheance(facture.date_facture, condizioni);
      
      // Se è diversa, aggiorna
      if (facture.date_echeance !== dataCorretta) {
        console.log(`🔧 Correzione F${facture.numero}:`);
        console.log(`   Data fattura: ${facture.date_facture}`);
        console.log(`   Condizioni: ${condizioni}`);
        console.log(`   Scadenza PRIMA: ${facture.date_echeance}`);
        console.log(`   Scadenza DOPO: ${dataCorretta}`);
        
        const { error: updateError } = await supabase
          .from('factures')
          .update({ date_echeance: dataCorretta })
          .eq('id', facture.id);
        
        if (updateError) {
          console.error(`❌ Errore aggiornamento ${facture.numero}:`, updateError);
        } else {
          corrette++;
        }
      }
    }
    
    console.log(`✅ Correzione completata: ${corrette} fatture aggiornate`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
};

fixDateEcheance();