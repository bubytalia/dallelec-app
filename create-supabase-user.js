import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createUser() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@dallelec.ch',
      password: 'Admin123!'
    })
    
    if (error) {
      console.error('Errore creazione utente:', error)
    } else {
      console.log('Utente creato:', data)
    }
  } catch (error) {
    console.error('Errore:', error)
  }
}

createUser()