// Script per ripristino via interfaccia web
import fs from 'fs';

const backup = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-31-34.json', 'utf8'));

console.log('📊 DATI NEL BACKUP:');
Object.keys(backup).forEach(collection => {
  console.log(`${collection}: ${backup[collection].length} records`);
});

console.log('\n🚀 ISTRUZIONI RIPRISTINO:');
console.log('1. Vai su http://localhost:5173/admin');
console.log('2. Per ogni sezione, inserisci manualmente i dati dal backup');
console.log('3. Oppure usa la funzione import se disponibile');

// Mostra primi 3 clienti come esempio
console.log('\n📋 ESEMPIO CLIENTI:');
backup.clients.slice(0, 3).forEach((client, i) => {
  console.log(`${i+1}. ${client.nom} - ${client.email || 'N/A'}`);
});