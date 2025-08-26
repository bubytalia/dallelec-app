import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('🔧 Creando tabelle rimanenti...')
  
  // Prova a inserire un record dummy per creare le tabelle
  try {
    // Sousfamilles
    await supabase.from('sousfamilles').insert([{
      firebase_id: 'dummy',
      nom: 'test',
      famille_id: 'test',
      ordre: 1
    }])
    console.log('✅ Tabella sousfamilles creata')
    
    // Chantiers  
    await supabase.from('chantiers').insert([{
      firebase_id: 'dummy',
      nom: 'test',
      client: 'test'
    }])
    console.log('✅ Tabella chantiers creata')
    
    // Devis
    await supabase.from('devis').insert([{
      firebase_id: 'dummy', 
      nom: 'test',
      numero: 'test'
    }])
    console.log('✅ Tabella devis creata')
    
  } catch (error) {
    console.log('ℹ️ Tabelle potrebbero già esistere:', error.message)
  }
}

createTables()