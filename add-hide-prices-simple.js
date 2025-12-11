import { createClient } from '@supabase/supabase-js'

// Credenziali dirette (da documentazione)
const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addHidePricesColumn() {
  console.log('🔧 Tentativo di aggiungere colonna hide_prices...')
  
  try {
    // Prima verifichiamo se la colonna esiste già
    const { data: testData, error: testError } = await supabase
      .from('devis')
      .select('hide_prices')
      .limit(1)
    
    if (!testError) {
      console.log('✅ La colonna hide_prices esiste già!')
      return
    }
    
    if (testError.message.includes('column "hide_prices" does not exist')) {
      console.log('❌ Colonna hide_prices non esiste, deve essere aggiunta manualmente')
      console.log('📋 Vai su https://supabase.com/dashboard/project/aumhdoiwtichjlvbrnrl')
      console.log('📋 Tabella: devis')
      console.log('📋 SQL da eseguire:')
      console.log('ALTER TABLE devis ADD COLUMN hide_prices BOOLEAN DEFAULT false;')
      
      // Proviamo comunque con una query diretta
      console.log('🔄 Tentativo con query SQL diretta...')
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE devis ADD COLUMN IF NOT EXISTS hide_prices BOOLEAN DEFAULT false;'
      })
      
      if (error) {
        console.log('❌ Query RPC fallita:', error.message)
        console.log('⚠️ Devi aggiungere la colonna manualmente dal dashboard Supabase')
      } else {
        console.log('✅ Colonna aggiunta con successo!')
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
  }
}

addHidePricesColumn()