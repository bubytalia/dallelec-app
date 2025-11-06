import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU2NTk5MSwiZXhwIjoyMDcyMTQxOTkxfQ.Ej6YJdJJqJGJqJGJqJGJqJGJqJGJqJGJqJGJqJGJqJG'; // Service role key needed

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addModalitePaiementColumn() {
  try {
    console.log('🔧 Tentativo di aggiungere colonna modalite_paiement...');
    
    // Prima verifica se la colonna esiste già
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'factures')
      .eq('column_name', 'modalite_paiement');
    
    if (columnError) {
      console.log('⚠️ Non posso verificare le colonne, procedo con aggiornamento diretto...');
    } else if (columns && columns.length > 0) {
      console.log('✅ Colonna modalite_paiement già esistente!');
      return;
    }
    
    console.log('📝 Aggiorno le fatture esistenti con modalità di default...');
    
    // Aggiorna tutte le fatture esistenti aggiungendo il campo modalite_paiement
    const { data: factures, error: fetchError } = await supabase
      .from('factures')
      .select('id, notes');
    
    if (fetchError) {
      console.error('❌ Errore nel recuperare le fatture:', fetchError);
      return;
    }
    
    console.log(`📊 Trovate ${factures.length} fatture da aggiornare...`);
    
    // Aggiorna ogni fattura aggiungendo modalite_paiement nelle notes se non presente
    for (const facture of factures) {
      const notes = facture.notes || '';
      if (!notes.includes('Modalité:')) {
        const newNotes = notes + (notes ? '\n' : '') + 'Modalité: 30 jours net';
        
        const { error: updateError } = await supabase
          .from('factures')
          .update({ notes: newNotes })
          .eq('id', facture.id);
        
        if (updateError) {
          console.error(`❌ Errore aggiornamento fattura ${facture.id}:`, updateError);
        }
      }
    }
    
    console.log('✅ Fatture aggiornate con modalità di pagamento nelle notes!');
    console.log('💡 La modalità di pagamento sarà gestita tramite il campo notes fino alla prossima migrazione DB');
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

addModalitePaiementColumn();