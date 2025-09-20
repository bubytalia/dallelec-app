// Test per verificare calcoli fattura
console.log('🧮 TEST CALCOLI FATTURA');

// Esempio calcolo con régies
const montantTravauxHT = 25950.54;
const heuresRegies = 24;
const prixRegieHeure = 75; // Prezzo corretto
const montantRegiesHT = heuresRegies * prixRegieHeure;
const totalHT = montantTravauxHT + montantRegiesHT;
const tva = totalHT * 0.081; // TVA Suisse 8.1%
const totalTTC = totalHT + tva;

console.log('📊 CALCOLI:');
console.log(`Travaux HT: ${montantTravauxHT.toFixed(2)} CHF`);
console.log(`Régies: ${heuresRegies}h × ${prixRegieHeure} CHF = ${montantRegiesHT.toFixed(2)} CHF`);
console.log(`Total HT: ${totalHT.toFixed(2)} CHF`);
console.log(`TVA (8.1%): ${tva.toFixed(2)} CHF`);
console.log(`Total TTC: ${totalTTC.toFixed(2)} CHF`);

// Test con acconti
const accontiHT = 9250;
const imponibileResiduoHT = totalHT - accontiHT;
const tvaResiduo = imponibileResiduoHT * 0.081;
const soldeAPayer = imponibileResiduoHT + tvaResiduo;

console.log('\n💰 CON ACCONTI:');
console.log(`Acconti HT: ${accontiHT.toFixed(2)} CHF`);
console.log(`Imponibile residuo: ${imponibileResiduoHT.toFixed(2)} CHF`);
console.log(`TVA residuo: ${tvaResiduo.toFixed(2)} CHF`);
console.log(`Solde à payer: ${soldeAPayer.toFixed(2)} CHF`);

console.log('\n✅ Test completato!');