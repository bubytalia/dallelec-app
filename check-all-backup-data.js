import fs from 'fs'

console.log('🔍 Controllo COMPLETO file di backup...\n')

const backup = JSON.parse(fs.readFileSync('./dallelec-backup-2025-08-26-19-10-40.json', 'utf8'))

console.log('📊 TUTTE le collezioni nel backup:')
Object.keys(backup.data).forEach(key => {
  const count = backup.data[key]?.length || 0
  console.log(`  - ${key}: ${count}`)
})

// Mostra alcuni esempi di devis se esistono
if (backup.data.devis && backup.data.devis.length > 0) {
  console.log('\n📋 Esempi devis:')
  backup.data.devis.slice(0, 3).forEach((devis, i) => {
    console.log(`  ${i+1}. ${devis.numero} - ${devis.nom || devis.nomChantier}`)
  })
}

console.log('\n✅ Controllo completato!')