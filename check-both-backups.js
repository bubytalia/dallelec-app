import fs from 'fs'

console.log('🔍 Controllo ENTRAMBI i file di backup...\n')

// File 1
console.log('📁 dallelec-backup-2025-08-26-19-10-40.json:')
const backup1 = JSON.parse(fs.readFileSync('./dallelec-backup-2025-08-26-19-10-40.json', 'utf8'))
Object.keys(backup1.data).forEach(key => {
  const count = backup1.data[key]?.length || 0
  console.log(`  - ${key}: ${count}`)
})

console.log('\n📁 dallelec-backup-2025-08-26-19-31-34.json:')
const backup2 = JSON.parse(fs.readFileSync('./dallelec-backup-2025-08-26-19-31-34.json', 'utf8'))
Object.keys(backup2.data).forEach(key => {
  const count = backup2.data[key]?.length || 0
  console.log(`  - ${key}: ${count}`)
})

// Cerca collaborateurs in entrambi
console.log('\n🔍 Ricerca collaborateurs:')
console.log('File 1 - collaborateurs:', backup1.data.collaborateurs ? backup1.data.collaborateurs.length : 'NON PRESENTE')
console.log('File 2 - collaborateurs:', backup2.data.collaborateurs ? backup2.data.collaborateurs.length : 'NON PRESENTE')

// Cerca altre possibili collezioni simili
console.log('\n🔍 Ricerca collezioni simili:')
const allKeys1 = Object.keys(backup1.data)
const allKeys2 = Object.keys(backup2.data)
const similarKeys = [...new Set([...allKeys1, ...allKeys2])].filter(key => 
  key.toLowerCase().includes('collab') || 
  key.toLowerCase().includes('employ') || 
  key.toLowerCase().includes('user') ||
  key.toLowerCase().includes('staff')
)
console.log('Collezioni simili trovate:', similarKeys.length > 0 ? similarKeys : 'NESSUNA')