// BACKUP SUPABASE DIRETTO - Salva su D:\backup\backup_dati\
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'

const supabase = createClient(supabaseUrl, supabaseKey)

// Testa quali tabelle esistono
async function getExistingTables() {
  const possibleTables = [
    'clients', 'chantiers', 'devis', 'produits', 'supplements', 
    'familles', 'sousfamilles', 'admins', 'chefdechantiers', 
    'collaborateurs', 'techniciens', 'interimaires'
  ]
  
  const existingTables = []
  
  for (const table of possibleTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1)
      if (!error) {
        existingTables.push(table)
        console.log(`✅ Tabella trovata: ${table}`)
      }
    } catch {
      console.log(`❌ Tabella non esiste: ${table}`)
    }
  }
  
  return existingTables
}

// Pulisce vecchi backup
function cleanOldBackups() {
  const backupDir = 'D:\\backup\\backup_dati'
  
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('dallelec-backup-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time)

    if (files.length > 5) {
      const toDelete = files.slice(5)
      toDelete.forEach(file => {
        fs.unlinkSync(file.path)
        console.log(`🗑️ Eliminato backup vecchio: ${file.name}`)
      })
    }
  } catch (error) {
    console.log('⚠️ Errore pulizia backup:', error.message)
  }
}

async function backupSupabase() {
  console.log('🔍 Scoprendo tabelle esistenti...')
  
  const tables = await getExistingTables()
  console.log(`📊 Trovate ${tables.length} tabelle`)
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = {
    timestamp,
    version: '1.0',
    source: 'Supabase',
    database_url: supabaseUrl,
    tables: {}
  }
  
  let totalRecords = 0
  
  for (const table of tables) {
    try {
      console.log(`📦 Backup tabella: ${table}`)
      const { data, error } = await supabase.from(table).select('*')
      
      if (error) {
        console.log(`⚠️ Errore ${table}:`, error.message)
        backup.tables[table] = { error: error.message, status: 'failed' }
      } else {
        backup.tables[table] = {
          count: data.length,
          data: data,
          status: 'success'
        }
        totalRecords += data.length
        console.log(`✅ ${table}: ${data.length} record`)
      }
    } catch (err) {
      console.log(`❌ Errore ${table}:`, err.message)
      backup.tables[table] = { error: err.message, status: 'failed' }
    }
  }
  
  // Salva su D:\
  const filename = `dallelec-backup-${timestamp}.json`
  const filepath = `D:\\backup\\backup_dati\\${filename}`
  
  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2))
  
  // Pulisci vecchi backup
  cleanOldBackups()
  
  console.log(`✅ Backup completato: ${filepath}`)
  console.log(`📊 Totale record: ${totalRecords}`)
  console.log(`📁 Dimensione: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`)
}

backupSupabase().catch(console.error)