// Verifica condizioni di vendita nel backup
import fs from 'fs';

function checkBackupConditions() {
  console.log('🔍 Ricerca condizioni di vendita nel backup...');
  
  try {
    const backupData = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-10-40.json', 'utf8'));
    
    console.log('📄 Chiavi principali nel backup:');
    Object.keys(backupData.data).forEach(key => {
      const value = backupData.data[key];
      if (typeof value === 'object') {
        const count = Array.isArray(value) ? value.length : Object.keys(value).length;
        console.log(`   ${key}: ${count} elementi`);
      }
    });
    
    // Cerca possibili chiavi per condizioni
    const possibleKeys = Object.keys(backupData.data).filter(key => 
      key.toLowerCase().includes('condition') ||
      key.toLowerCase().includes('terme') ||
      key.toLowerCase().includes('vendita') ||
      key.toLowerCase().includes('payment') ||
      key.toLowerCase().includes('paiement')
    );
    
    console.log('\n🔍 Chiavi che potrebbero contenere condizioni:', possibleKeys);
    
    // Controlla se ci sono condizioni nei devis
    const devisBackup = backupData.data.devis;
    console.log('\n📋 Condizioni nei devis:');
    
    Object.entries(devisBackup).forEach(([id, devis]) => {
      const conditionFields = Object.keys(devis).filter(key =>
        key.toLowerCase().includes('condition') ||
        key.toLowerCase().includes('terme') ||
        key.toLowerCase().includes('payment') ||
        key.toLowerCase().includes('paiement')
      );
      
      if (conditionFields.length > 0) {
        console.log(`   ${devis.numero}: ${conditionFields.join(', ')}`);
        conditionFields.forEach(field => {
          console.log(`     ${field}: ${JSON.stringify(devis[field]).substring(0, 100)}...`);
        });
      }
    });
    
    // Cerca in altre collezioni
    console.log('\n🔍 Ricerca in altre collezioni...');
    Object.entries(backupData.data).forEach(([collectionName, collection]) => {
      if (collectionName === 'devis') return; // Già controllato
      
      if (typeof collection === 'object') {
        const items = Array.isArray(collection) ? collection : Object.values(collection);
        
        items.forEach((item, index) => {
          if (typeof item === 'object') {
            const conditionFields = Object.keys(item).filter(key =>
              key.toLowerCase().includes('condition') ||
              key.toLowerCase().includes('terme') ||
              key.toLowerCase().includes('payment') ||
              key.toLowerCase().includes('paiement')
            );
            
            if (conditionFields.length > 0) {
              console.log(`   ${collectionName}[${index}]: ${conditionFields.join(', ')}`);
            }
          }
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

checkBackupConditions();