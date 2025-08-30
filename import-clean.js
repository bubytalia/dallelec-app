import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'

const supabase = createClient(supabaseUrl, supabaseKey)

const backupData = JSON.parse(fs.readFileSync('../dallelec-backup-2025-08-26-23-58-14.json', 'utf8'))

async function importClean() {
  console.log('🚀 Importazione pulita...')
  
  try {
    // Rimuovi duplicati dal backup
    const uniqueSupplements = backupData.data.supplements.filter((item, index, self) => 
      index === self.findIndex(t => t.firebase_id === item.firebase_id)
    )
    
    const uniqueFamilles = backupData.data.familles.filter((item, index, self) => 
      index === self.findIndex(t => t.firebase_id === item.firebase_id)
    )
    
    const uniqueSousFamilles = backupData.data.sousfamilles.filter((item, index, self) => 
      index === self.findIndex(t => t.firebase_id === item.firebase_id)
    )

    console.log('📊 Dati unici:')
    console.log('  - Supplements:', uniqueSupplements.length)
    console.log('  - Familles:', uniqueFamilles.length)
    console.log('  - SousFamilles:', uniqueSousFamilles.length)

    // Supplements
    console.log('📋 Importazione supplements...')
    const { error: supplementsError } = await supabase
      .from('supplements')
      .insert(uniqueSupplements.map(supplement => ({
        firebase_id: supplement.firebase_id,
        nom: supplement.nom,
        valeur: supplement.valeur,
        ordre: supplement.ordre
      })))
    
    if (supplementsError) console.error('❌ Errore supplements:', supplementsError)
    else console.log('✅ Supplements importati:', uniqueSupplements.length)

    // Familles
    console.log('📋 Importazione familles...')
    const { error: famillesError } = await supabase
      .from('familles')
      .insert(uniqueFamilles.map(famille => ({
        firebase_id: famille.firebase_id,
        nom: famille.nom,
        ordre: famille.ordre,
        visible_pdf: famille.visible_pdf || false,
        ordre_pdf: famille.ordre_pdf || 0
      })))
    
    if (famillesError) console.error('❌ Errore familles:', famillesError)
    else console.log('✅ Familles importate:', uniqueFamilles.length)

    // SousFamilles
    console.log('📋 Importazione sousfamilles...')
    const { error: sousfamillesError } = await supabase
      .from('sousfamilles')
      .insert(uniqueSousFamilles.map(sousfamille => ({
        firebase_id: sousfamille.firebase_id,
        nom: sousfamille.nom,
        famille_id: sousfamille.famille_id,
        ordre: sousfamille.ordre || 0,
        pourcentage: sousfamille.pourcentage || 0
      })))
    
    if (sousfamillesError) console.error('❌ Errore sousfamilles:', sousfamillesError)
    else console.log('✅ SousFamilles importate:', uniqueSousFamilles.length)

    console.log('🎉 Importazione completata!')
    
  } catch (error) {
    console.error('💥 Errore:', error)
  }
}

importClean()