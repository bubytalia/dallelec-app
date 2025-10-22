// VERIFICA DATI SUPABASE - Controllo completo
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 VERIFICA COMPLETA DATI SUPABASE')
console.log('=====================================')

async function verificaDati() {
  const tabelle = [
    'clients', 'chantiers', 'devis', 'produits', 'supplements', 
    'familles', 'sousfamilles', 'techniciens', 'conditions', 'paiements',
    'admins', 'chefdechantiers', 'collaborateurs', 'interimaires',
    'factures', 'metrages', 'absences', 'configuration', 
    'resoconti_percentuali', 'zone_convertite'
  ]
  
  let totalRecords = 0
  let tabelleVuote = 0
  let tabelleConDati = 0
  
  console.log('\n📊 CONTEGGIO RECORD PER TABELLA:')
  console.log('-'.repeat(40))
  
  for (const tabella of tabelle) {
    try {
      const { data, error, count } = await supabase
        .from(tabella)
        .select('*', { count: 'exact' })
      
      if (error) {
        console.log(`❌ ${tabella}: ERRORE - ${error.message}`)
        continue
      }
      
      const numRecord = data ? data.length : 0
      totalRecords += numRecord
      
      if (numRecord === 0) {
        tabelleVuote++
        console.log(`⚪ ${tabella.padEnd(20)}: ${numRecord} record (VUOTA)`)
      } else {
        tabelleConDati++
        console.log(`✅ ${tabella.padEnd(20)}: ${numRecord} record`)
        
        // Mostra primi 2 record per verifica
        if (data && data.length > 0) {
          console.log(`   📋 Esempio: ${Object.keys(data[0]).slice(0, 3).join(', ')}...`)
        }
      }
      
    } catch (err) {
      console.log(`❌ ${tabella}: ERRORE - ${err.message}`)
    }
  }
  
  console.log('\n📈 RIEPILOGO FINALE:')
  console.log('='.repeat(40))
  console.log(`📊 Totale record: ${totalRecords}`)
  console.log(`✅ Tabelle con dati: ${tabelleConDati}`)
  console.log(`⚪ Tabelle vuote: ${tabelleVuote}`)
  console.log(`📋 Tabelle totali: ${tabelle.length}`)
  
  if (totalRecords < 100) {
    console.log('\n⚠️  ATTENZIONE: Pochi dati trovati!')
    console.log('   Possibili cause:')
    console.log('   - Dati non migrati completamente')
    console.log('   - Database diverso da quello in produzione')
    console.log('   - Credenziali errate')
  } else {
    console.log('\n✅ Quantità dati normale per sistema aziendale')
  }
  
  // Verifica connessione
  console.log('\n🔗 VERIFICA CONNESSIONE:')
  console.log(`📡 URL: ${supabaseUrl}`)
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`)
}

verificaDati().catch(console.error)