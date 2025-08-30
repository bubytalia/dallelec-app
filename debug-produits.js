import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugProduits() {
  console.log('🔍 Debug Produits...')
  
  const { data, error } = await supabase
    .from('produits')
    .select('*')
    .limit(3)
  
  console.log('📊 Errore:', error)
  console.log('📦 Primi 3 produits:', data)
  
  if (data && data.length > 0) {
    console.log('🔑 Campi disponibili:', Object.keys(data[0]))
  }
}

debugProduits()