import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'

const supabase = createClient(supabaseUrl, supabaseKey)

// Leggi il backup completo
const backupData = JSON.parse(fs.readFileSync('../dallelec-backup-2025-08-26-23-58-14.json', 'utf8'))

async function importCompleteData() {
  console.log('🚀 Importazione backup COMPLETO...')
  
  try {
    // Pulisci tabelle esistenti
    console.log('🧹 Pulizia dati esistenti...')
    await supabase.from('sousfamilles').delete().neq('id', 0)
    await supabase.from('familles').delete().neq('id', 0)
    await supabase.from('supplements').delete().neq('id', 0)
    
    // 1. Supplements (35 vs 7)
    console.log('📋 Importazione supplements completi...')
    const { error: supplementsError } = await supabase
      .from('supplements')
      .insert(backupData.data.supplements.map(supplement => ({
        firebase_id: supplement.firebase_id,
        nom: supplement.nom,
        valeur: supplement.valeur,
        ordre: supplement.ordre
      })))
    
    if (supplementsError) console.error('❌ Errore supplements:', supplementsError)
    else console.log('✅ Supplements importati:', backupData.data.supplements.length)

    // 2. Familles (75 vs 15)
    console.log('📋 Importazione familles complete...')
    const { error: famillesError } = await supabase
      .from('familles')
      .insert(backupData.data.familles.map(famille => ({
        firebase_id: famille.firebase_id,
        nom: famille.nom,
        ordre: famille.ordre,
        visible_pdf: famille.visible_pdf || false,
        ordre_pdf: famille.ordre_pdf || 0
      })))
    
    if (famillesError) console.error('❌ Errore familles:', famillesError)
    else console.log('✅ Familles importate:', backupData.data.familles.length)

    // 3. SousFamilles (188 vs 47)
    console.log('📋 Importazione sousfamilles complete...')
    const { error: sousfamillesError } = await supabase
      .from('sousfamilles')
      .insert(backupData.data.sousfamilles.map(sousfamille => ({
        firebase_id: sousfamille.firebase_id,
        nom: sousfamille.nom,
        famille_id: sousfamille.famille_id,
        ordre: sousfamille.ordre || 0,
        pourcentage: sousfamille.pourcentage || 0
      })))
    
    if (sousfamillesError) console.error('❌ Errore sousfamilles:', sousfamillesError)
    else console.log('✅ SousFamilles importate:', backupData.data.sousfamilles.length)

    console.log('🎉 Importazione backup COMPLETO terminata!')
    
  } catch (error) {
    console.error('💥 Errore generale:', error)
  }
}

importCompleteData()