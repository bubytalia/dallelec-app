// Estrazione dettagliata delle condizioni dal backup
import fs from 'fs';

function extractConditionsData() {
  console.log('📋 Estrazione condizioni dal backup...');
  
  try {
    const backupData = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-10-40.json', 'utf8'));
    
    // Cerca collezioni che potrebbero essere condizioni
    console.log('🔍 Tutte le collezioni nel backup:');
    Object.keys(backupData.data).forEach(key => {
      console.log(`   ${key}`);
    });
    
    // Controlla se esiste una collezione conditions o simile
    const conditionsCollections = Object.keys(backupData.data).filter(key =>
      key.includes('condition') || key.includes('terme') || key.includes('payment')
    );
    
    if (conditionsCollections.length > 0) {
      console.log('\n📄 Collezioni condizioni trovate:', conditionsCollections);
      conditionsCollections.forEach(collName => {
        const collection = backupData.data[collName];
        console.log(`\n${collName}:`, collection);
      });
    }
    
    // Estrai un esempio di condizioni da un devis
    const devisBackup = backupData.data.devis;
    const devisWithConditions = Object.values(devisBackup).find(d => 
      d.conditionsComprend || d.conditionsNeComprendPas || d.paiement
    );
    
    if (devisWithConditions) {
      console.log('\n📋 Esempio condizioni da devis:', devisWithConditions.numero);
      console.log('   conditionsComprend:', devisWithConditions.conditionsComprend);
      console.log('   conditionsNeComprendPas:', devisWithConditions.conditionsNeComprendPas);
      console.log('   paiement:', devisWithConditions.paiement);
    }
    
    // Controlla se ci sono riferimenti a collezioni esterne
    // Gli ID nelle condizioni potrebbero puntare a una collezione separata
    console.log('\n🔍 Possibili collezioni di riferimento...');
    
    // Cerca collezioni che potrebbero contenere i testi delle condizioni
    const possibleRefCollections = ['conditions', 'paiements', 'termes', 'clauses'];
    possibleRefCollections.forEach(name => {
      if (backupData.data[name]) {
        console.log(`✅ Trovata collezione: ${name}`);
        console.log('   Contenuto:', backupData.data[name]);
      }
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

extractConditionsData();