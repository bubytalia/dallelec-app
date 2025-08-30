import fs from 'fs'

const backup = JSON.parse(fs.readFileSync('./dallelec-backup-2025-08-26-19-10-40.json', 'utf8'))

console.log('📊 TUTTE le collezioni nel backup:')
Object.keys(backup.data).forEach(key => {
  const count = backup.data[key]?.length || 0
  console.log(`  - ${key}: ${count}`)
})

// Mostra esempi di collaborateurs se esistono
if (backup.data.collaborateurs && backup.data.collaborateurs.length > 0) {
  console.log('\n👥 Esempi collaborateurs:')
  backup.data.collaborateurs.slice(0, 3).forEach((collab, i) => {
    console.log(`  ${i+1}. ${collab.nom} ${collab.prenom} - ${collab.email}`)
  })
}