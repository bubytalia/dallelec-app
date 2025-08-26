import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function importData() {
  try {
    console.log('Leggendo backup...')
    const backup = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-10-40.json', 'utf8'))
    const data = backup.data

    // Svuota tabelle esistenti
    console.log('Pulendo tabelle esistenti...')
    await supabase.from('clients').delete().neq('id', 0)
    await supabase.from('produits').delete().neq('id', 0)
    await supabase.from('techniciens').delete().neq('id', 0)

    // Clients
    if (data.clients) {
      console.log('Importando clients...')
      const clientData = data.clients.map(c => ({
        firebase_id: c.id,
        nom: c.nom,
        adresse: c.adresse,
        ville: c.ville,
        telephone: c.telephone,
        email_contact: c.email_contact || c.email,
        email_compta: c.email_compta
      }))
      
      const { error } = await supabase.from('clients').insert(clientData)
      if (error) console.error('Errore clients:', error)
      else console.log(`${clientData.length} clients importati`)
    }

    // Produits
    if (data.produits) {
      console.log('Importando produits...')
      const produitData = data.produits.map(p => ({
        firebase_id: p.id,
        article: p.article,
        taille: p.taille,
        description: p.description,
        unite: p.unite,
        prix: p.prix,
        prezzo_netto: p.prezzoNetto || false
      }))
      
      const { error } = await supabase.from('produits').insert(produitData)
      if (error) console.error('Errore produits:', error)
      else console.log(`${produitData.length} produits importati`)
    }

    // Techniciens
    if (data.techniciens) {
      console.log('Importando techniciens...')
      const techData = data.techniciens.map(t => ({
        firebase_id: t.id,
        nom: t.nom,
        prenom: t.prenom,
        telephone: t.telephone,
        email: t.email,
        client_id: t.clientId
      }))
      
      const { error } = await supabase.from('techniciens').insert(techData)
      if (error) console.error('Errore techniciens:', error)
      else console.log(`${techData.length} techniciens importati`)
    }

    console.log('Importazione completata!')
    
  } catch (error) {
    console.error('Errore:', error)
  }
}

importData()