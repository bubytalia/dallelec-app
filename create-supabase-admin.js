import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdmin() {
  try {
    console.log('👤 Creando utente admin...')
    
    // Crea utente
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@dallelec.com',
      password: 'admin123',
      options: {
        data: {
          role: 'admin',
          nome: 'Admin',
          cognome: 'Dallelec'
        }
      }
    })

    if (error) {
      console.error('❌ Errore:', error.message)
    } else {
      console.log('✅ Admin creato!')
      console.log('📧 Email: admin@dallelec.com')
      console.log('🔑 Password: admin123')
      console.log('⚠️ Controlla email per conferma (se richiesta)')
    }
    
  } catch (error) {
    console.error('❌ Errore:', error)
  }
}

createAdmin()