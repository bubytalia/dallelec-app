import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function importFinalData() {
  try {
    console.log('📖 Leggendo backup...')
    const backup = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-31-34.json', 'utf8'))
    const data = backup.data

    // Collaborateurs (se esistono nel backup)
    if (data.collaborateurs) {
      console.log('📦 Importando collaborateurs...')
      const collabData = data.collaborateurs.map(c => ({
        firebase_id: c.id,
        nom: c.nom,
        prenom: c.prenom,
        telephone: c.telephone,
        email: c.email,
        etat: c.etat,
        cout_horaire: c.coutHoraire,
        exclude_from_report: c.excludeFromReport
      }))
      
      const { error } = await supabase.from('collaborateurs').insert(collabData)
      if (!error) console.log(`✅ ${collabData.length} collaborateurs importati`)
    }

    // Chef de chantiers (se esistono)
    if (data.chefdechantiers) {
      console.log('📦 Importando chef de chantiers...')
      const chefData = data.chefdechantiers.map(c => ({
        firebase_id: c.id,
        nom: c.nom,
        prenom: c.prenom,
        telephone: c.telephone,
        email: c.email
      }))
      
      const { error } = await supabase.from('chefdechantiers').insert(chefData)
      if (!error) console.log(`✅ ${chefData.length} chef de chantiers importati`)
    }

    console.log('🎉 Importazione finale completata!')
    
  } catch (error) {
    console.error('❌ Errore:', error)
  }
}

importFinalData()