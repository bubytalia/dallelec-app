import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Configurazione Supabase
const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'

const supabase = createClient(supabaseUrl, supabaseKey)

// Leggi il backup
const backupData = JSON.parse(fs.readFileSync('./dallelec-backup-2025-08-26-19-10-40.json', 'utf8'))

async function importData() {
  console.log('🚀 Inizio importazione dati in Supabase...')
  
  try {
    // 1. Importa Clients
    console.log('📋 Importazione clients...')
    const { error: clientsError } = await supabase
      .from('clients')
      .insert(backupData.data.clients.map(client => ({
        firebase_id: client.id,
        nom: client.nom,
        adresse: client.adresse,
        ville: client.ville,
        telephone: client.telephone,
        email_contact: client.email_contact,
        email_compta: client.email_compta || ''
      })))
    
    if (clientsError) console.error('❌ Errore clients:', clientsError)
    else console.log('✅ Clients importati:', backupData.data.clients.length)

    // 2. Importa Produits
    console.log('📋 Importazione produits...')
    const { error: produitsError } = await supabase
      .from('produits')
      .insert(backupData.data.produits.map(produit => ({
        firebase_id: produit.id,
        article: produit.article,
        description: produit.description,
        taille: produit.taille || '',
        unite: produit.unite,
        prix: produit.prix,
        prezzo_netto: produit.prezzoNetto || false
      })))
    
    if (produitsError) console.error('❌ Errore produits:', produitsError)
    else console.log('✅ Produits importati:', backupData.data.produits.length)

    // 3. Importa Techniciens
    console.log('📋 Importazione techniciens...')
    const { error: techniciensError } = await supabase
      .from('techniciens')
      .insert(backupData.data.techniciens.map(tech => ({
        firebase_id: tech.id,
        nom: tech.nom,
        prenom: tech.prenom,
        email: tech.email,
        telephone: tech.telephone,
        client_id: tech.clientId || null
      })))
    
    if (techniciensError) console.error('❌ Errore techniciens:', techniciensError)
    else console.log('✅ Techniciens importati:', backupData.data.techniciens.length)

    // 4. Importa Chantiers
    console.log('📋 Importazione chantiers...')
    const { error: chantiersError } = await supabase
      .from('chantiers')
      .insert(backupData.data.chantiers.map(chantier => ({
        firebase_id: chantier.id,
        numero_cantiere: chantier.numeroCantiere,
        nom: chantier.nom,
        adresse: chantier.adresse,
        ville: chantier.ville,
        client: chantier.client,
        technicien: chantier.technicien,
        modalita_resoconto: chantier.modalitaResoconto,
        capocantiere: chantier.capocantiere,
        prix_regie: chantier.prixRegie,
        percentuale_impresa: chantier.percentualeImpresa,
        devis_id: chantier.devisId || null
      })))
    
    if (chantiersError) console.error('❌ Errore chantiers:', chantiersError)
    else console.log('✅ Chantiers importati:', backupData.data.chantiers.length)

    // 5. Importa Supplements
    console.log('📋 Importazione supplements...')
    const { error: supplementsError } = await supabase
      .from('supplements')
      .insert(backupData.data.supplements.map(supplement => ({
        firebase_id: supplement.id,
        nom: supplement.nom,
        valeur: supplement.valeur,
        ordre: supplement.ordre
      })))
    
    if (supplementsError) console.error('❌ Errore supplements:', supplementsError)
    else console.log('✅ Supplements importati:', backupData.data.supplements.length)

    // 6. Importa Familles
    console.log('📋 Importazione familles...')
    const { error: famillesError } = await supabase
      .from('familles')
      .insert(backupData.data.familles.map(famille => ({
        firebase_id: famille.id,
        nom: famille.nom,
        ordre: famille.ordre,
        visible_pdf: famille.visiblePDF || false,
        ordre_pdf: famille.ordrePDF || 0
      })))
    
    if (famillesError) console.error('❌ Errore familles:', famillesError)
    else console.log('✅ Familles importate:', backupData.data.familles.length)

    // 7. Importa SousFamilles
    console.log('📋 Importazione sousfamilles...')
    const { error: sousfamillesError } = await supabase
      .from('sousfamilles')
      .insert(backupData.data.sousfamilles.map(sousfamille => ({
        firebase_id: sousfamille.id,
        nom: sousfamille.nom,
        famille_id: sousfamille.familleId,
        ordre: sousfamille.ordre || 0,
        pourcentage: sousfamille.pourcentage || 0
      })))
    
    if (sousfamillesError) console.error('❌ Errore sousfamilles:', sousfamillesError)
    else console.log('✅ SousFamilles importate:', backupData.data.sousfamilles.length)

    // 8. Importa Devis
    console.log('📋 Importazione devis...')
    const { error: devisError } = await supabase
      .from('devis')
      .insert(backupData.data.devis.map(devis => ({
        firebase_id: devis.id,
        numero: devis.numero,
        nom: devis.nom || devis.nomChantier,
        client_id: devis.clientId,
        technicien: devis.technicien,
        adresse: devis.adresse,
        total: devis.total,
        status: devis.status || 'draft'
      })))
    
    if (devisError) console.error('❌ Errore devis:', devisError)
    else console.log('✅ Devis importati:', backupData.data.devis.length)

    console.log('🎉 Importazione completata!')
    
  } catch (error) {
    console.error('💥 Errore generale:', error)
  }
}

// Avvia importazione
importData()