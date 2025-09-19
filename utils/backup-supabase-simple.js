// BACKUP SEMPLICE SUPABASE - Esporta tutto in JSON
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'

const supabase = createClient(supabaseUrl, supabaseKey)

// Lista delle tabelle da salvare
const tables = [
  'clients', 'chantiers', 'devis', 'produits', 'supplements', 
  'familles', 'sousfamilles', 'collaborateurs', 'admins', 
  'chefdechantiers', 'techniciens', 'metrages', 'factures',
  'heures', 'heures_chef', 'configuration'
]

async function backupSupabase() {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const backup = { timestamp, data: {} }
  
  console.log('🔄 Inizio backup Supabase...')
  
  for (const table of tables) {
    try {
      console.log(`📊 Backup tabella: ${table}`)
      const { data, error } = await supabase.from(table).select('*')
      
      if (error) {
        console.log(`⚠️ Errore ${table}:`, error.message)
        backup.data[table] = { error: error.message }
      } else {
        backup.data[table] = data
        console.log(`✅ ${table}: ${data.length} record`)
      }
    } catch (err) {
      console.log(`❌ Errore ${table}:`, err.message)
      backup.data[table] = { error: err.message }
    }
  }
  
  // Salva il backup
  const filename = `backup-supabase-${timestamp}.json`
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2))
  
  console.log(`✅ Backup completato: ${filename}`)
  console.log(`📁 Dimensione: ${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB`)
}

backupSupabase().catch(console.error)