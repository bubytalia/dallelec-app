import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function importRemainingData() {
  try {
    console.log('Leggendo backup...')
    const backup = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-10-40.json', 'utf8'))
    const data = backup.data

    // Supplements
    if (data.supplements) {
      console.log('Importando supplements...')
      const suppData = data.supplements.map(s => ({
        firebase_id: s.id,
        nom: s.nom,
        valeur: s.valeur,
        ordre: s.ordre
      }))
      
      const { error } = await supabase.from('supplements').insert(suppData)
      if (error) console.error('Errore supplements:', error)
      else console.log(`${suppData.length} supplements importati`)
    }

    // Familles
    if (data.familles) {
      console.log('Importando familles...')
      const famData = data.familles.map(f => ({
        firebase_id: f.id,
        nom: f.nom,
        ordre: f.ordre,
        visible_pdf: f.visiblePDF || false,
        visible_in_pdf: f.visibleInPdf || false,
        ordre_pdf: f.ordrePDF || 0
      }))
      
      const { error } = await supabase.from('familles').insert(famData)
      if (error) console.error('Errore familles:', error)
      else console.log(`${famData.length} familles importati`)
    }

    // Sous-familles
    if (data.sousfamilles) {
      console.log('Importando sousfamilles...')
      const sousFamData = data.sousfamilles.map(sf => ({
        firebase_id: sf.id,
        nom: sf.nom,
        ordre: sf.ordre,
        pourcentage: sf.pourcentage,
        famille_id: sf.familleId
      }))
      
      const { error } = await supabase.from('sousfamilles').insert(sousFamData)
      if (error) console.error('Errore sousfamilles:', error)
      else console.log(`${sousFamData.length} sousfamilles importati`)
    }

    // Chantiers
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
        modalita_resoconto: ch.modalitaResoconto,
        devis_id: ch.devisId
      }))
      
      const { error } = await supabase.from('chantiers').insert(chantierData)
      if (error) console.error('Errore chantiers:', error)
      else console.log(`${chantierData.length} chantiers importati`)
    }

    console.log('Importazione dati rimanenti completata!')
    
  } catch (error) {
    console.error('Errore:', error)
  }
}

importRemainingData()