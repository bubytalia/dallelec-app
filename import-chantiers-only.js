import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function importChantiers() {
  try {
    const backup = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-10-40.json', 'utf8'))
    const data = backup.data

    if (data.chantiers) {
      console.log('Importando chantiers...')
      const chantierData = data.chantiers.map(ch => ({
        firebase_id: ch.id,
        nom: ch.nom,
        adresse: ch.adresse,
        ville: ch.ville,
        client: ch.client,
        technicien: ch.technicien,
        capocantiere: ch.capocantiere,
        numero_cantiere: ch.numeroCantiere,
        prix_regie: ch.prixRegie,
        percentuale_impresa: ch.percentualeImpresa,
        modalita_resoconto: ch.modalitaResoconto
      }))
      
      const { error } = await supabase.from('chantiers').insert(chantierData)
      if (error) console.error('Errore chantiers:', error)
      else console.log(`${chantierData.length} chantiers importati`)
    }
    
  } catch (error) {
    console.error('Errore:', error)
  }
}

importChantiers()