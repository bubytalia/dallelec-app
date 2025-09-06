// Backup automatico Supabase - Rileva tutte le tabelle automaticamente
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurazione
const SUPABASE_URL = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getAllTables() {
  try {
    // Query per ottenere tutte le tabelle dal database
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations');
    
    if (error) {
      // Fallback: lista manuale se query non funziona
      console.log('⚠️ Usando lista tabelle manuale');
      return [
        'absences', 'admins', 'chantiers', 'chefdechantiers', 'clients',
        'collaborateurs', 'conditions', 'configuration', 'devis', 'factures',
        'familles', 'heures_chef_interim', 'heures_chef_propres', 'heures_ouvriers',
        'interimaires', 'metrages', 'paiements', 'produits', 'resoconti_percentuali',
        'sousfamilles', 'supplements', 'techniciens'
      ];
    }
    
    return data.map(row => row.table_name);
  } catch (error) {
    console.error('Errore rilevamento tabelle:', error);
    return [];
  }
}

async function backupTable(tableName) {
  try {
    console.log(`📊 Backup ${tableName}...`);
    
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });
    
    if (error) {
      console.log(`❌ Errore ${tableName}: ${error.message}`);
      return { table: tableName, status: 'error', error: error.message, count: 0 };
    }
    
    console.log(`✅ ${tableName}: ${count || data?.length || 0} righe`);
    return { 
      table: tableName, 
      status: 'success', 
      count: count || data?.length || 0,
      data: data 
    };
    
  } catch (error) {
    console.log(`💥 Errore ${tableName}: ${error.message}`);
    return { table: tableName, status: 'error', error: error.message, count: 0 };
  }
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Usa lo stesso percorso del backup della domenica
  const possiblePaths = [
    'c:\\Users\\TestQ\\OneDrive\\DallelecBackups',
    'c:\\Users\\TestQ\\Desktop\\DallelecBackups'
  ];
  
  let backupDir = null;
  for (const basePath of possiblePaths) {
    try {
      if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
      }
      backupDir = path.join(basePath, `backup-auto-${timestamp}`);
      console.log(`✅ Usando percorso: ${backupDir}`);
      break;
    } catch (error) {
      console.log(`❌ Percorso non disponibile: ${basePath}`);
    }
  }
  
  if (!backupDir) {
    console.error('❌ Nessun percorso backup disponibile!');
    return;
  }
  
  console.log('🚀 BACKUP AUTOMATICO DALLELEC');
  console.log('================================');
  console.log(`📁 Cartella: ${backupDir}`);
  console.log('');
  
  // Crea cartella backup
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Rileva tutte le tabelle
  console.log('🔍 Rilevamento tabelle...');
  const tables = await getAllTables();
  console.log(`📋 Trovate ${tables.length} tabelle`);
  console.log('');
  
  // Backup di ogni tabella
  const results = [];
  for (const table of tables) {
    const result = await backupTable(table);
    results.push(result);
    
    // Salva dati tabella
    if (result.status === 'success' && result.data) {
      const tableFile = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(tableFile, JSON.stringify(result.data, null, 2));
    }
  }
  
  // Crea report backup
  const report = {
    timestamp: new Date().toISOString(),
    database_url: SUPABASE_URL,
    total_tables: tables.length,
    successful_backups: results.filter(r => r.status === 'success').length,
    failed_backups: results.filter(r => r.status === 'error').length,
    total_records: results.reduce((sum, r) => sum + (r.count || 0), 0),
    tables: results
  };
  
  const reportFile = path.join(backupDir, 'BACKUP_REPORT.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  // Crea file leggibile
  const summaryFile = path.join(backupDir, 'BACKUP_SUMMARY.txt');
  const summary = `
BACKUP DALLELEC - ${new Date().toLocaleString('it-IT')}
================================================

📊 STATISTICHE:
- Tabelle totali: ${report.total_tables}
- Backup riusciti: ${report.successful_backups}
- Backup falliti: ${report.failed_backups}
- Record totali: ${report.total_records}

📋 DETTAGLIO TABELLE:
${results.map(r => `- ${r.table}: ${r.count} righe (${r.status})`).join('\n')}

🔗 DATABASE: ${SUPABASE_URL}
📁 BACKUP: ${backupDir}
`;
  
  fs.writeFileSync(summaryFile, summary);
  
  console.log('');
  console.log('✅ BACKUP COMPLETATO!');
  console.log(`📊 ${report.successful_backups}/${report.total_tables} tabelle salvate`);
  console.log(`📈 ${report.total_records} record totali`);
  console.log(`📁 Salvato in: ${backupDir}`);
  
  return report;
}

// Esegui backup
createBackup().catch(console.error);