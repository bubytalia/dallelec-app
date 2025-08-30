import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'

const supabase = createClient(supabaseUrl, supabaseKey)

const backupData = JSON.parse(fs.readFileSync('../dallelec-backup-2025-08-26-23-58-14.json', 'utf8'))

async function importWithUpsert() {
  console.log('🚀 Importazione con UPSERT...')
  
  try {
    // Supplements
    console.log('📋 UPSERT supplements...')
    const { error: supplementsError } = await supabase
      .from('supplements')
      .upsert(backupData.data.supplements.map(supplement => ({
        firebase_id: supplement.firebase_id,
        nom: supplement.nom,
        valeur: supplement.valeur,
        ordre: supplement.ordre
      })), { onConflict: 'firebase_id' })
    
    if (supplementsError) console.error('❌ Errore supplements:', supplementsError)
    else console.log('✅ Supplements:', backupData.data.supplements.length)

    // Familles
    console.log('📋 UPSERT familles...')
    const { error: famillesError } = await supabase
      .from('familles')
      .upsert(backupData.data.familles.map(famille => ({
        firebase_id: famille.firebase_id,
        nom: famille.nom,
        ordre: famille.ordre,
        visible_pdf: famille.visible_pdf || false,
        ordre_pdf: famille.ordre_pdf || 0
      })), { onConflict: 'firebase_id' })
    
    if (famillesError) console.error('❌ Errore familles:', famillesError)
    else console.log('✅ Familles:', backupData.data.familles.length)

    // SousFamilles
    console.log('📋 UPSERT sousfamilles...')
    const { error: sousfamillesError } = await supabase
      .from('sousfamilles')
      .upsert(backupData.data.sousfamilles.map(sousfamille => ({
        firebase_id: sousfamille.firebase_id,
        nom: sousfamille.nom,
        famille_id: sousfamille.famille_id,
        ordre: sousfamille.ordre || 0,
        pourcentage: sousfamille.pourcentage || 0
      })), { onConflict: 'firebase_id' })
    
    if (sousfamillesError) console.error('❌ Errore sousfamilles:', sousfamillesError)
    else console.log('✅ SousFamilles:', backupData.data.sousfamilles.length)

    console.log('🎉 UPSERT completato!')
    
  } catch (error) {
    console.error('💥 Errore:', error)
  }
}

importWithUpsert()