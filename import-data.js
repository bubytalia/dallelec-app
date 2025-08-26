import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function importData() {
  try {
    console.log('📖 Leggendo backup...\n')
    const backup = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-31-34.json', 'utf8'))
    const data = backup.data

    // Importa clients
    console.log('📦 Importando clients...')
    const clientsData = data.clients.map(client => ({
      firebase_id: client.id,
      nom: client.nom,
      adresse: client.adresse,
      ville: client.ville,
      telephone: client.telephone,
      email_contact: client.email_contact || client.email,
      email_compta: client.email_compta,
      conditions_paiement: client.conditionsPaiement
    }))
    
    const { error: clientsError } = await supabase
      .from('clients')
      .insert(clientsData)
    
    if (clientsError) throw clientsError
    console.log(`✅ ${clientsData.length} clients importati`)

    // Importa techniciens
    console.log('📦 Importando techniciens...')
    const techniciensData = data.techniciens.map(tech => ({
      firebase_id: tech.id,
      nom: tech.nom,
      prenom: tech.prenom,
      email: tech.email,
      telephone: tech.telephone,
      client_id: tech.clientId
    }))
    
    const { error: techError } = await supabase
      .from('techniciens')
      .insert(techniciensData)
    
    if (techError) throw techError
    console.log(`✅ ${techniciensData.length} techniciens importati`)

    // Importa produits
    console.log('📦 Importando produits...')
    const produitsData = data.produits.map(prod => ({
      firebase_id: prod.id,
      article: prod.article,
      description: prod.description,
      prix: prod.prix,
      unite: prod.unite,
      taille: prod.taille,
      prezzo_netto: prod.prezzoNetto
    }))
    
    const { error: prodError } = await supabase
      .from('produits')
      .insert(produitsData)
    
    if (prodError) throw prodError
    console.log(`✅ ${produitsData.length} produits importati`)

    // Importa supplements
    console.log('📦 Importando supplements...')
    const supplementsData = data.supplements.map(supp => ({
      firebase_id: supp.id,
      nom: supp.nom,
      valeur: supp.valeur,
      ordre: supp.ordre
    }))
    
    const { error: suppError } = await supabase
      .from('supplements')
      .insert(supplementsData)
    
    if (suppError) throw suppError
    console.log(`✅ ${supplementsData.length} supplements importati`)

    // Importa familles
    console.log('📦 Importando familles...')
    const famillesData = data.familles.map(fam => ({
      firebase_id: fam.id,
      nom: fam.nom,
      ordre: fam.ordre,
      ordre_pdf: fam.ordrePDF,
      visible_pdf: fam.visiblePDF,
      visible_in_pdf: fam.visibleInPdf
    }))
    
    const { error: famError } = await supabase
      .from('familles')
      .insert(famillesData)
    
    if (famError) throw famError
    console.log(`✅ ${famillesData.length} familles importati`)

    console.log('\n🎉 Importazione completata!')
    
  } catch (error) {
    console.error('❌ Errore:', error)
  }
}

importData()