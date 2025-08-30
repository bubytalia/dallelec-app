import fs from 'fs'

console.log('🔍 Controllo file di backup...\n')

// File 1
const backup1 = JSON.parse(fs.readFileSync('./dallelec-backup-2025-08-26-19-10-40.json', 'utf8'))
console.log('📁 dallelec-backup-2025-08-26-19-10-40.json:')
console.log('  - Clients:', backup1.data?.clients?.length || 0)
console.log('  - Produits:', backup1.data?.produits?.length || 0)
console.log('  - Techniciens:', backup1.data?.techniciens?.length || 0)
console.log('  - Chantiers:', backup1.data?.chantiers?.length || 0)
console.log('  - Supplements:', backup1.data?.supplements?.length || 0)
console.log('  - Familles:', backup1.data?.familles?.length || 0)
console.log('  - SousFamilles:', backup1.data?.sousfamilles?.length || 0)

console.log('\n📁 dallelec-backup-2025-08-26-19-31-34.json:')
// File 2
const backup2 = JSON.parse(fs.readFileSync('./dallelec-backup-2025-08-26-19-31-34.json', 'utf8'))
console.log('  - Clients:', backup2.data?.clients?.length || 0)
console.log('  - Produits:', backup2.data?.produits?.length || 0)
console.log('  - Techniciens:', backup2.data?.techniciens?.length || 0)
console.log('  - Chantiers:', backup2.data?.chantiers?.length || 0)
console.log('  - Supplements:', backup2.data?.supplements?.length || 0)
console.log('  - Familles:', backup2.data?.familles?.length || 0)
console.log('  - SousFamilles:', backup2.data?.sousfamilles?.length || 0)

console.log('\n✅ Controllo completato!')