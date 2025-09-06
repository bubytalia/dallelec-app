// Backup reale dati Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configurazione Supabase
const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Configurazione backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const oneDriveBackupDir = path.join(process.env.USERPROFILE, 'OneDrive', 'Backup_Dallelec_Dati');
const backupDir = path.join(oneDriveBackupDir, `backup-dati-${timestamp}`);

// Tabelle da salvare
const tables = [
    'clients', 'chantiers', 'devis', 'produits', 'supplements', 
    'familles', 'sousfamilles', 'techniciens', 'collaborateurs', 'users'
];

async function backupTable(tableName) {
    try {
        console.log(`📊 Backup ${tableName}...`);
        
        const { data, error } = await supabase
            .from(tableName)
            .select('*');
            
        if (error) {
            console.log(`❌ Errore ${tableName}: ${error.message}`);
            return { table: tableName, error: error.message, count: 0 };
        }
        
        const fileName = path.join(backupDir, `${tableName}.json`);
        fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
        
        console.log(`✅ ${tableName}: ${data.length} record`);
        return { table: tableName, count: data.length, success: true };
        
    } catch (err) {
        console.log(`❌ Errore ${tableName}: ${err.message}`);
        return { table: tableName, error: err.message, count: 0 };
    }
}

async function main() {
    console.log('=== BACKUP REALE SUPABASE ===');
    console.log(`Timestamp: ${timestamp}`);
    
    // Crea directory
    if (!fs.existsSync(oneDriveBackupDir)) {
        fs.mkdirSync(oneDriveBackupDir, { recursive: true });
    }
    fs.mkdirSync(backupDir, { recursive: true });
    
    const results = [];
    let totalRecords = 0;
    
    // Backup di tutte le tabelle
    for (const table of tables) {
        const result = await backupTable(table);
        results.push(result);
        if (result.success) totalRecords += result.count;
    }
    
    // Crea file info
    const backupInfo = {
        timestamp,
        type: 'real_supabase_backup',
        tables_count: tables.length,
        total_records: totalRecords,
        results,
        status: 'completed'
    };
    
    fs.writeFileSync(
        path.join(backupDir, 'BACKUP_INFO.txt'), 
        JSON.stringify(backupInfo, null, 2)
    );
    
    // Pulizia backup vecchi (mantiene ultimi 4)
    const allBackups = fs.readdirSync(oneDriveBackupDir)
        .filter(name => name.startsWith('backup-dati-'))
        .map(name => ({
            name,
            path: path.join(oneDriveBackupDir, name),
            time: fs.statSync(path.join(oneDriveBackupDir, name)).birthtime
        }))
        .sort((a, b) => b.time - a.time);
        
    if (allBackups.length > 4) {
        const toDelete = allBackups.slice(4);
        toDelete.forEach(backup => {
            fs.rmSync(backup.path, { recursive: true, force: true });
            console.log(`🗑️ Eliminato: ${backup.name}`);
        });
    }
    
    console.log('\n✅ BACKUP COMPLETATO!');
    console.log(`📁 Cartella: ${backupDir}`);
    console.log(`📊 Totale record: ${totalRecords}`);
    console.log(`📋 Tabelle: ${results.filter(r => r.success).length}/${tables.length}`);
}

main().catch(console.error);