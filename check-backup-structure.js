// Script per verificare la struttura del backup
import fs from 'fs';

function checkBackupStructure() {
  console.log('🔍 Verifica struttura backup...');
  
  try {
    const backupFile = 'dallelec-backup-2025-08-26-19-10-40.json';
    
    if (!fs.existsSync(backupFile)) {
      console.error('❌ File backup non trovato:', backupFile);
      return;
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log('📄 Chiavi principali nel backup:');
    Object.keys(backupData).forEach(key => {
      const value = backupData[key];
      if (Array.isArray(value)) {
        console.log(`   ${key}: Array con ${value.length} elementi`);
      } else if (typeof value === 'object') {
        console.log(`   ${key}: Oggetto con chiavi:`, Object.keys(value).slice(0, 5));
      } else {
        console.log(`   ${key}: ${typeof value}`);
      }
    });
    
    // Se esiste la chiave devis, mostra la struttura
    if (backupData.devis) {
      console.log('\n📋 Struttura devis:');
      if (backupData.devis.length > 0) {
        const firstDevis = backupData.devis[0];
        console.log('   Chiavi primo devis:', Object.keys(firstDevis));
        console.log('   Esempio devis:', JSON.stringify(firstDevis).substring(0, 200) + '...');
      }
    }
    
    // Cerca altre possibili chiavi per i devis
    const possibleKeys = Object.keys(backupData).filter(key => 
      key.toLowerCase().includes('devis') || 
      key.toLowerCase().includes('preventiv') ||
      (Array.isArray(backupData[key]) && backupData[key].length > 0 && backupData[key][0].numero)
    );
    
    console.log('\n🔍 Possibili chiavi per devis:', possibleKeys);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

checkBackupStructure();