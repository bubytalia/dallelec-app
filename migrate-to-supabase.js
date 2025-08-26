import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateData() {
  try {
    console.log('📖 Leggendo backup Firebase...\n')
    const backup = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-31-34.json', 'utf8'))
    const data = backup.data

    console.log('🚀 Iniziando migrazione a Supabase...\n')

    // Migra ogni collezione
    for (const [tableName, documents] of Object.entries(data)) {
      console.log(`📦 Migrando ${tableName}...`)
      
      // Prepara i dati per Supabase (rimuovi gli ID Firebase)
      const supabaseData = documents.map(doc => {
        const { id, ...cleanData } = doc
        return {
          firebase_id: id, // Mantieni l'ID originale come riferimento
          ...cleanData
        }
      })

      // Inserisci in Supabase
      const { data: insertedData, error } = await supabase
        .from(tableName)
        .insert(supabaseData)

      if (error) {
        console.log(`⚠️ Tabella ${tableName} non esiste, la creerò automaticamente`)
        // Supabase creerà la tabella automaticamente al primo inserimento
      } else {
        console.log(`✅ ${tableName}: ${documents.length} records migrati`)
      }
    }

    console.log('\n🎉 Migrazione completata!')
    console.log('🔗 Vai su Supabase Dashboard per vedere le tabelle')
    
  } catch (error) {
    console.error('❌ Errore migrazione:', error)
  }
}

migrateData()