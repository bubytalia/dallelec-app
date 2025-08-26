import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseUsers() {
  console.log('🔍 Controllo utenti Supabase...\n')
  
  try {
    // Controlla tabella users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      console.log('❌ Errore tabella users:', usersError.message)
    } else {
      console.log('✅ Utenti trovati nella tabella users:')
      users.forEach(user => {
        console.log(`   ${user.email} → ${user.role}`)
      })
    }
    
    // Test login
    console.log('\n🔐 Test login Supabase...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@dallelec.com',
      password: 'admin123'
    })
    
    if (error) {
      console.log('❌ Login fallito:', error.message)
    } else {
      console.log('✅ Login Supabase riuscito!')
      console.log('   User:', data.user.email)
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
  }
}

testSupabaseUsers()