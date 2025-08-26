import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateChantiers() {
  try {
    const backup = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-10-40.json', 'utf8'))
    const data = backup.data

    if (data.chantiers) {
      console.log('Aggiornando chantiers...')
      
      for (const ch of data.chantiers) {
        const { error } = await supabase
          .from('chantiers')
          .update({
            capocantiere: ch.capocantiere,
            modalita_resoconto: ch.modalitaResoconto
          })
          .eq('firebase_id', ch.id)
        
        if (error) console.error(`Errore aggiornamento ${ch.id}:`, error)
      }
      
      console.log(`${data.chantiers.length} chantiers aggiornati`)
    }
    
  } catch (error) {
    console.error('Errore:', error)
  }
}

updateChantiers()