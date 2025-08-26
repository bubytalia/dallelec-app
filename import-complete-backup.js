import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function importCompleteBackup() {
  try {
    console.log('📖 Leggendo backup completo...')
    const backup = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-10-40.json', 'utf8'))
    const data = backup.data

    console.log('🔍 Dati trovati nel backup:')
    console.log(`- Clients: ${data.clients?.length || 0}`)
    console.log(`- Chantiers: ${data.chantiers?.length || 0}`)
    console.log(`- Devis: ${data.devis?.length || 0}`)
    console.log(`- Produits: ${data.produits?.length || 0}`)
    console.log(`- Techniciens: ${data.techniciens?.length || 0}`)
    console.log(`- Supplements: ${data.supplements?.length || 0}`)
    console.log(`- Familles: ${data.familles?.length || 0}`)
    console.log(`- Sous-familles: ${data.sousfamilles?.length || 0}`)

    // 1. Importa Clients
    if (data.clients && data.clients.length > 0) {
      console.log('\\n📦 Importando clients...')
      
      // Prima elimina i dati esistenti
      await supabase.from('clients').delete().neq('id', 0)
      
      const clientsData = data.clients.map(c => ({
        firebase_id: c.id,
        nom: c.nom || '',
        adresse: c.adresse || '',
        ville: c.ville || '',
        telephone: c.telephone || '',
        email_contact: c.email_contact || c.email || '',
        email_compta: c.email_compta || ''
      }))
      
      const { error: clientsError } = await supabase.from('clients').insert(clientsData)
      if (clientsError) {
        console.error('❌ Errore clients:', clientsError)
      } else {
        console.log(`✅ ${clientsData.length} clients importati`)
      }
    }

    // 2. Importa Produits
    if (data.produits && data.produits.length > 0) {
      console.log('\\n📦 Importando produits...')
      
      // Prima elimina i dati esistenti
      await supabase.from('produits').delete().neq('id', 0)
      
      const produitsData = data.produits.map(p => ({
        firebase_id: p.id,
        article: p.article || '',
        taille: p.taille || '',
        description: p.description || '',
        unite: p.unite || 'm',
        prix: parseFloat(p.prix) || 0,
        prezzo_netto: p.prezzoNetto || false
      }))
      
      const { error: produitsError } = await supabase.from('produits').insert(produitsData)
      if (produitsError) {
        console.error('❌ Errore produits:', produitsError)
      } else {
        console.log(`✅ ${produitsData.length} produits importati`)
      }
    }

    // 3. Importa Techniciens
    if (data.techniciens && data.techniciens.length > 0) {
      console.log('\\n📦 Importando techniciens...')
      
      // Prima elimina i dati esistenti
      await supabase.from('techniciens').delete().neq('id', 0)
      
      const techniciensData = data.techniciens.map(t => ({
        firebase_id: t.id,
        nom: t.nom || '',
        prenom: t.prenom || '',
        telephone: t.telephone || '',
        email: t.email || '',
        client_id: t.clientId || null
      }))
      
      const { error: techniciensError } = await supabase.from('techniciens').insert(techniciensData)
      if (techniciensError) {
        console.error('❌ Errore techniciens:', techniciensError)
      } else {
        console.log(`✅ ${techniciensData.length} techniciens importati`)
      }
    }

    // 4. Importa Supplements
    if (data.supplements && data.supplements.length > 0) {
      console.log('\\n📦 Importando supplements...')
      
      // Prima elimina i dati esistenti
      await supabase.from('supplements').delete().neq('id', 0)
      
      const supplementsData = data.supplements.map(s => ({
        firebase_id: s.id,
        nom: s.nom || '',
        valeur: parseFloat(s.valeur) || 0,
        ordre: parseInt(s.ordre) || 0
      }))
      
      const { error: supplementsError } = await supabase.from('supplements').insert(supplementsData)
      if (supplementsError) {
        console.error('❌ Errore supplements:', supplementsError)
      } else {
        console.log(`✅ ${supplementsData.length} supplements importati`)
      }
    }

    // 5. Importa Familles
    if (data.familles && data.familles.length > 0) {
      console.log('\\n📦 Importando familles...')
      
      // Prima elimina i dati esistenti
      await supabase.from('familles').delete().neq('id', 0)
      
      const famillesData = data.familles.map(f => ({
        firebase_id: f.id,
        nom: f.nom || '',
        ordre: parseInt(f.ordre) || 0,
        visible_pdf: f.visiblePDF || false,
        visible_in_pdf: f.visibleInPdf || false,
        ordre_pdf: parseInt(f.ordrePDF) || 0
      }))
      
      const { error: famillesError } = await supabase.from('familles').insert(famillesData)
      if (famillesError) {
        console.error('❌ Errore familles:', famillesError)
      } else {
        console.log(`✅ ${famillesData.length} familles importate`)
      }
    }

    // 6. Importa Sous-familles
    if (data.sousfamilles && data.sousfamilles.length > 0) {
      console.log('\\n📦 Importando sous-familles...')
      
      // Prima elimina i dati esistenti
      await supabase.from('sousfamilles').delete().neq('id', 0)
      
      const sousfamillesData = data.sousfamilles.map(sf => ({
        firebase_id: sf.id,
        nom: sf.nom || '',
        famille_id: sf.familleId || null,
        pourcentage: parseFloat(sf.pourcentage) || 0,
        ordre: parseInt(sf.ordre) || 0
      }))
      
      const { error: sousfamillesError } = await supabase.from('sousfamilles').insert(sousfamillesData)
      if (sousfamillesError) {
        console.error('❌ Errore sous-familles:', sousfamillesError)
      } else {
        console.log(`✅ ${sousfamillesData.length} sous-familles importate`)
      }
    }

    // 7. Importa Chantiers
    if (data.chantiers && data.chantiers.length > 0) {
      console.log('\\n📦 Importando chantiers...')
      
      // Prima elimina i dati esistenti
      await supabase.from('chantiers').delete().neq('id', 0)
      
      const chantiersData = data.chantiers.map(ch => ({
        firebase_id: ch.id,
        nom: ch.nom || '',
        adresse: ch.adresse || '',
        ville: ch.ville || '',
        client: ch.client || '',
        technicien: ch.technicien || '',
        capocantiere: ch.capocantiere || '',
        numero_cantiere: ch.numeroCantiere || '',
        prix_regie: parseFloat(ch.prixRegie) || 0,
        percentuale_impresa: parseFloat(ch.percentualeImpresa) || 0,
        modalita_resoconto: ch.modalitaResoconto || 'metrages',
        devis_id: ch.devisId || null
      }))
      
      const { error: chantiersError } = await supabase.from('chantiers').insert(chantiersData)
      if (chantiersError) {
        console.error('❌ Errore chantiers:', chantiersError)
      } else {
        console.log(`✅ ${chantiersData.length} chantiers importati`)
      }
    }

    console.log('\\n🎉 Importazione completa terminata!')
    console.log('\\n📋 Riepilogo:')
    console.log('✅ Tutti i dati principali sono stati importati')
    console.log('⚠️  I devis richiedono una struttura più complessa e saranno importati separatamente')
    
  } catch (error) {
    console.error('❌ Errore durante l\\'importazione:', error)
  }
}

importCompleteBackup()