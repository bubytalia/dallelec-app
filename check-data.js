import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Verificando dati in Supabase...\n')
  
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
  
  if (clientsError) {
    console.error('❌ Errore clients:', clientsError)
  } else {
    console.log(`✅ Clients trovati: ${clients.length}`)
    if (clients.length > 0) {
      console.log('📋 Primo client:', clients[0].nom)
    }
  }
}

checkData()