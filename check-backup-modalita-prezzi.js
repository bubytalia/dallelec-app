// Verifica modalità prezzi nel backup originale
import fs from 'fs';

function checkBackupModalitaPrezzi() {
  console.log('🔍 Verifica modalità prezzi nel backup...');
  
  try {
    const backupData = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-10-40.json', 'utf8'));
    const devisBackup = backupData.data.devis;
    
    console.log(`📄 Devis nel backup: ${Object.keys(devisBackup).length}`);
    
    Object.entries(devisBackup).forEach(([id, devis]) => {
      console.log(`\n📋 ${devis.numero} (${devis.nom}):`);
      
      // Cerca tutti i possibili campi per modalità prezzi
      const possibleFields = [
        'modalitaPrezzi',
        'modalita_prezzi', 
        'modalitePrezzi',
        'pricingMode',
        'priceMode'
      ];
      
      let found = false;
      possibleFields.forEach(field => {
        if (devis[field] !== undefined) {
          console.log(`   ${field}: "${devis[field]}"`);
          found = true;
        }
      });
      
      if (!found) {
        console.log('   ❌ Nessun campo modalità prezzi trovato');
      }
      
      // Mostra anche le remises per capire il tipo
      if (devis.remises) {
        const remisesCount = Object.keys(devis.remises).length;
        console.log(`   remises: ${remisesCount} famiglie configurate`);
        if (remisesCount === 0) {
          console.log('   → Probabilmente Prix Fixes (nessuna remise)');
        } else {
          console.log('   → Probabilmente Remise Standard (ha remises)');
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

checkBackupModalitaPrezzi();