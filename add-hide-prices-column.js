import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carica le variabili d'ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente Supabase mancanti')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addHidePricesColumn() {
  console.log('🔧 Aggiunta colonna hide_prices alla tabella devis...')
  
  try {
    // Esegue la query SQL per aggiungere la colonna
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE devis 
        ADD COLUMN IF NOT EXISTS hide_prices BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN devis.hide_prices IS 'Se true, nasconde i prezzi nel PDF del devis';
      `
    })
    
    if (error) {
      // Se la funzione RPC non esiste, proviamo con una query diretta
      console.log('⚠️ Tentativo con query diretta...')
      
      const { error: directError } = await supabase
        .from('devis')
        .select('hide_prices')
        .limit(1)
      
      if (directError && directError.message.includes('column "hide_prices" does not exist')) {
        console.log('✅ La colonna hide_prices deve essere aggiunta manualmente tramite dashboard Supabase')
        console.log('📋 SQL da eseguire:')
        console.log('ALTER TABLE devis ADD COLUMN IF NOT EXISTS hide_prices BOOLEAN DEFAULT false;')
        return
      }
    }
    
    console.log('✅ Colonna hide_prices aggiunta con successo!')
    
    // Verifica che la colonna sia stata aggiunta
    const { data: testData, error: testError } = await supabase
      .from('devis')
      .select('id, hide_prices')
      .limit(1)
    
    if (testError) {
      console.error('❌ Errore nella verifica:', testError.message)
    } else {
      console.log('✅ Verifica completata - colonna hide_prices disponibile')
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
  }
}

// Esegue la funzione
addHidePricesColumn()