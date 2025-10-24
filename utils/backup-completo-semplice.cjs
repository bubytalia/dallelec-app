// BACKUP COMPLETO SEMPLICE - Compatibile Node.js
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('======================================')
console.log('   BACKUP COMPLETO DALLELEC SU DISCO D:\\')
console.log('========================================')

// Scanner automatico VERO - trova tutte le tabelle
async function scanAllTables() {
  console.log('🔍 Scanner automatico tabelle...')
  
  try {
    // Prova prima con query SQL diretta per ottenere tutte le tabelle
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
    
    if (!error && tables) {
      const tableNames = tables.map(t => t.table_name)
      console.log(`✅ Scanner SQL: ${tableNames.length} tabelle trovate`)
      return tableNames
    }
  } catch (err) {
    console.log('⚠️ Scanner SQL non disponibile, uso metodo alternativo...')
  }
  
  // Fallback: testa tabelle conosciute + prova tabelle comuni
  const knownTables = [
    'clients', 'chantiers', 'devis', 'produits', 'supplements', 
    'familles', 'sousfamilles', 'techniciens', 'conditions', 'paiements',
    'admins', 'chefdechantiers', 'collaborateurs', 'interimaires',
    'factures', 'metrages', 'absences', 'configuration', 
    'resoconti_percentuali', 'zone_convertite',
    // Tabelle ore
    'heures_ouvriers', 'heures_chef_propres', 'heures_chef_interim',
    // Altre possibili tabelle
    'users', 'profiles', 'settings', 'logs', 'audit_log'
  ]
  
  const existingTables = []
  
  for (const table of knownTables) {
    try {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (!error) {
        existingTables.push(table)
      }
    } catch (err) {
      // Skip silenzioso
    }
  }
  
  console.log(`✅ Scanner fallback: ${existingTables.length} tabelle trovate`)
  return existingTables
}

// Backup dati
async function backupData() {
  console.log('\n[1/3] Backup dati Supabase...')
  
  const tables = await scanAllTables()
  // Timestamp con ora locale italiana
  const now = new Date()
  const localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
  const timestamp = localTime.toISOString().replace(/[:.]/g, '-').replace('Z', '')
  const backup = { timestamp, tables: {} }
  
  let totalRecords = 0
  
  for (const table of tables) {
    try {
      console.log(`📦 Backup tabella: ${table}`)
      const { data, error } = await supabase.from(table).select('*')
      
      if (!error) {
        backup.tables[table] = { count: data.length, data: data }
        totalRecords += data.length
        console.log(`✅ ${table}: ${data.length} record`)
      }
    } catch (err) {
      console.log(`⚠️ Errore ${table}: ${err.message}`)
    }
  }
  
  // Salva
  const filename = `dallelec-backup-${timestamp}.json`
  const filepath = `D:\\backup\\backup_dati\\${filename}`
  
  if (!fs.existsSync('D:\\backup\\backup_dati')) {
    fs.mkdirSync('D:\\backup\\backup_dati', { recursive: true })
  }
  
  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2))
  
  // Pulisci vecchi
  cleanOldBackups('D:\\backup\\backup_dati', 'dallelec-backup-', 5)
  
  console.log(`✅ Backup completato: ${filepath}`)
  console.log(`📊 Totale record: ${totalRecords}`)
  console.log(`📁 Dimensione: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`)
  
  return filepath
}

// Backup sistema
async function backupSystem() {
  console.log('\n[2/3] Backup sistema...')
  
  const sourceDir = 'C:\\Users\\bubyt\\Desktop\\gestionalequater\\Dallelec_app_new'
  // Timestamp con ora locale italiana
  const now = new Date()
  const localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
  const timestamp = localTime.toISOString().replace(/[:.]/g, '-').replace('Z', '').substring(0, 16)
  const backupDir = `D:\\backup\\backup_sistema\\dallelec-sistema-${timestamp}`
  
  if (!fs.existsSync('D:\\backup\\backup_sistema')) {
    fs.mkdirSync('D:\\backup\\backup_sistema', { recursive: true })
  }
  
  console.log(`📁 Creando cartella: ${backupDir}`)
  fs.mkdirSync(backupDir, { recursive: true })
  
  console.log(`📋 Copiando da: ${sourceDir}`)
  console.log(`📋 Copiando in: ${backupDir}`)
  
  const excludeDirs = ['node_modules', '.git', 'dist', '.netlify', '.firebase']
  const robocopyCmd = `robocopy "${sourceDir}" "${backupDir}" /E /XD ${excludeDirs.join(' ')} /XF *.log *.tmp /R:1 /W:1 /NP /NFL /NDL`
  
  try {
    execSync(robocopyCmd, { stdio: 'pipe' })
    console.log('✅ Copia completata')
  } catch (err) {
    if (err.status <= 7) {
      console.log('✅ Copia completata')
    } else {
      console.log('⚠️ Errore copia sistema')
    }
  }
  
  cleanOldBackups('D:\\backup\\backup_sistema', 'dallelec-sistema-', 5)
  console.log(`✅ Backup sistema salvato: ${backupDir}`)
  
  return backupDir
}

// Pulizia vecchi backup
function cleanOldBackups(directory, prefix, maxKeep) {
  try {
    if (!fs.existsSync(directory)) return
    
    const files = fs.readdirSync(directory)
      .filter(file => file.startsWith(prefix))
      .map(file => ({
        name: file,
        path: path.join(directory, file),
        time: fs.statSync(path.join(directory, file)).mtime
      }))
      .sort((a, b) => b.time - a.time)

    if (files.length > maxKeep) {
      const toDelete = files.slice(maxKeep)
      toDelete.forEach(file => {
        if (fs.statSync(file.path).isDirectory()) {
          fs.rmSync(file.path, { recursive: true, force: true })
        } else {
          fs.unlinkSync(file.path)
        }
        console.log(`🗑️ Eliminato backup vecchio: ${file.name}`)
      })
    }
  } catch (error) {
    console.log('⚠️ Errore pulizia backup:', error.message)
  }
}

// Esecuzione
async function main() {
  try {
    const dataBackup = await backupData()
    const systemBackup = await backupSystem()
    
    console.log('\n[3/3] Pulizia vecchi backup...')
    console.log('Mantenuti solo gli ultimi 5 backup per tipo')
    
    console.log('\n🎯 BACKUP COMPLETO TERMINATO CON SUCCESSO!')
    console.log(`📊 Dati: ${dataBackup}`)
    console.log(`💾 Sistema: ${systemBackup}`)
    
  } catch (error) {
    console.error('❌ Errore backup:', error.message)
  }
}

main()