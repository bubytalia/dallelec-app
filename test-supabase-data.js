import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testData() {
  console.log('🔍 Verifica dati Supabase...\n')
  
  // Test Clients
  const { data: clients, error: clientsError } = await supabase.from('clients').select('*')
  console.log('👥 Clients:', clients?.length || 0, clientsError ? `(Errore: ${clientsError.message})` : '')
  
  // Test Produits
  const { data: produits, error: produitsError } = await supabase.from('produits').select('*')
  console.log('📦 Produits:', produits?.length || 0, produitsError ? `(Errore: ${produitsError.message})` : '')
  
  // Test Techniciens
  const { data: techniciens, error: techniciensError } = await supabase.from('techniciens').select('*')
  console.log('👷 Techniciens:', techniciens?.length || 0, techniciensError ? `(Errore: ${techniciensError.message})` : '')
  
  // Test Chantiers
  const { data: chantiers, error: chantiersError } = await supabase.from('chantiers').select('*')
  console.log('🏗️ Chantiers:', chantiers?.length || 0, chantiersError ? `(Errore: ${chantiersError.message})` : '')
  
  // Test Supplements
  const { data: supplements, error: supplementsError } = await supabase.from('supplements').select('*')
  console.log('➕ Supplements:', supplements?.length || 0, supplementsError ? `(Errore: ${supplementsError.message})` : '')
  
  // Test Familles
  const { data: familles, error: famillesError } = await supabase.from('familles').select('*')
  console.log('👨‍👩‍👧‍👦 Familles:', familles?.length || 0, famillesError ? `(Errore: ${famillesError.message})` : '')
  
  // Test SousFamilles
  const { data: sousfamilles, error: sousfamillesError } = await supabase.from('sousfamilles').select('*')
  console.log('👶 SousFamilles:', sousfamilles?.length || 0, sousfamillesError ? `(Errore: ${sousfamillesError.message})` : '')
  
  // Test Devis
  const { data: devis, error: devisError } = await supabase.from('devis').select('*')
  console.log('📋 Devis:', devis?.length || 0, devisError ? `(Errore: ${devisError.message})` : '')
  
  console.log('\n✅ Test completato!')
}

testData()