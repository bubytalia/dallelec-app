import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAnagrafiche() {
  console.log('🔍 Controllo anagrafiche per ruoli...\n')
  
  try {
    // Controlla admins
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
    
    if (!adminsError && admins) {
      console.log('✅ ADMINS:')
      admins.forEach(admin => {
        console.log(`   ${admin.email} - ${admin.nom} ${admin.prenom}`)
      })
    } else {
      console.log('❌ Errore admins:', adminsError?.message)
    }
    
    // Controlla chef de chantiers
    const { data: chefs, error: chefsError } = await supabase
      .from('chefdechantiers')
      .select('*')
    
    if (!chefsError && chefs) {
      console.log('\n✅ CHEF DE CHANTIERS:')
      chefs.forEach(chef => {
        console.log(`   ${chef.email} - ${chef.nom} ${chef.prenom}`)
      })
    } else {
      console.log('\n❌ Errore chefs:', chefsError?.message)
    }
    
    // Controlla collaborateurs (ouvriers)
    const { data: ouvriers, error: ouvriersError } = await supabase
      .from('collaborateurs')
      .select('*')
    
    if (!ouvriersError && ouvriers) {
      console.log('\n✅ COLLABORATEURS (OUVRIERS):')
      ouvriers.forEach(ouvrier => {
        console.log(`   ${ouvrier.email} - ${ouvrier.nom} ${ouvrier.prenom}`)
      })
    } else {
      console.log('\n❌ Errore ouvriers:', ouvriersError?.message)
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
  }
}

checkAnagrafiche()