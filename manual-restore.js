// Script per ripristino manuale tramite interfacce web
import fs from 'fs';

const backup = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-31-34.json', 'utf8'));
const data = backup.data;

console.log('🎯 PIANO DI RIPRISTINO MANUALE');
console.log('===============================\n');

console.log('📊 DATI DA RIPRISTINARE:');
console.log(`• Clienti: ${data.clients.length}`);
console.log(`• Chantiers: ${data.chantiers.length}`);
console.log(`• Devis: ${data.devis.length}`);
console.log(`• Produits: ${data.produits.length}`);
console.log(`• Techniciens: ${data.techniciens.length}`);
console.log(`• Supplements: ${data.supplements.length}`);
console.log(`• Familles: ${data.familles.length}`);
console.log(`• Sousfamilles: ${data.sousfamilles.length}\n`);

console.log('🚀 PROCEDURA RIPRISTINO:');
console.log('1. Vai su http://localhost:5173/admin');
console.log('2. Inserisci i dati nell\'ordine seguente:\n');

console.log('📋 ORDINE DI INSERIMENTO:');
console.log('1️⃣ CLIENTI (7 records)');
data.clients.forEach((client, i) => {
  console.log(`   ${i+1}. ${client.nom} - ${client.ville}`);
});

console.log('\n2️⃣ TECHNICIENS (10 records)');
data.techniciens.forEach((tech, i) => {
  console.log(`   ${i+1}. ${tech.prenom} ${tech.nom} - ${tech.email}`);
});

console.log('\n3️⃣ FAMILLES (15 records)');
data.familles.forEach((fam, i) => {
  console.log(`   ${i+1}. ${fam.nom}`);
});

console.log('\n4️⃣ SOUSFAMILLES (45 records)');
console.log('   [Inserire dopo le familles]');

console.log('\n5️⃣ SUPPLEMENTS (7 records)');
data.supplements.forEach((supp, i) => {
  console.log(`   ${i+1}. ${supp.nom} - valeur: ${supp.valeur}`);
});

console.log('\n6️⃣ PRODUITS (89 records)');
console.log('   [Inserire tramite interfaccia prodotti]');

console.log('\n7️⃣ CHANTIERS (12 records)');
data.chantiers.forEach((chant, i) => {
  console.log(`   ${i+1}. ${chant.nom} - ${chant.client}`);
});

console.log('\n8️⃣ DEVIS (6 records)');
data.devis.forEach((dev, i) => {
  console.log(`   ${i+1}. ${dev.nom} - ${dev.numero}`);
});

console.log('\n💡 SUGGERIMENTO:');
console.log('Inizia con clienti e techniciens, poi continua con l\'ordine indicato.');
console.log('I file di dettaglio sono salvati in files separati per facilità.');