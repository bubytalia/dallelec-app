import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testando connessione Supabase...')
  
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .limit(3)
    
    if (error) {
      console.error('❌ Errore:', error)
    } else {
      console.log('✅ Connessione OK!')
      console.log(`📊 Trovati ${data.length} clients`)
      if (data.length > 0) {
        console.log('📋 Primo client:', data[0])
      }
    }
  } catch (err) {
    console.error('❌ Errore connessione:', err)
  }
}

testConnection()