import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('🔧 Creando tabelle Supabase...')
  
  // Crea tabella clients
  const { error: clientsError } = await supabase.rpc('create_clients_table')
  
  if (clientsError) {
    console.log('⚠️ Usa SQL Editor per creare le tabelle')
    console.log('📋 SQL da eseguire:')
    console.log(`
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT,
  nom TEXT,
  adresse TEXT,
  ville TEXT,
  telephone TEXT,
  email_contact TEXT,
  email_compta TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
    `)
  }
}

createTables()