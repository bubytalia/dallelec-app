// ========================================
// BACKUP COMPLETO DATI DALLELEC
// Esporta tutti i dati in formati multipli
// ========================================

import { supabase } from '../src/supabase.js';
import fs from 'fs';

const BACKUP_DIR = `./backup-dati-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}`;

// Lista di tutte le tabelle critiche
const TABELLE_CRITICHE = [
    'clients',
    'chantiers', 
    'devis',
    'produits',
    'supplements',
    'metrages',
    'factures',
    'collaborateurs',
    'techniciens',
    'familles',
    'sousfamilles',
    'conditions',
    'heures',
    'heuresChef'
];

async function backupCompleto() {
    console.log('🚀 Avvio backup completo dati...');
    
    // Crea cartella backup
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const backupData = {
        timestamp: new Date().toISOString(),
        database: 'supabase',
        tables: {}
    };
    
    // Backup ogni tabella
    for (const tabella of TABELLE_CRITICHE) {
        try {
            console.log(`📊 Backup tabella: ${tabella}`);
            
            const { data, error } = await supabase
                .from(tabella)
                .select('*');
                
            if (error) {
                console.error(`❌ Errore ${tabella}:`, error);
                continue;
            }
            
            backupData.tables[tabella] = data;
            
            // Salva anche file separato per tabella
            fs.writeFileSync(
                `${BACKUP_DIR}/${tabella}.json`, 
                JSON.stringify(data, null, 2)
            );
            
            // Salva anche in CSV per Excel
            if (data.length > 0) {
                const csv = convertToCSV(data);
                fs.writeFileSync(`${BACKUP_DIR}/${tabella}.csv`, csv);
            }
            
            console.log(`✅ ${tabella}: ${data.length} record salvati`);
            
        } catch (err) {
            console.error(`❌ Errore backup ${tabella}:`, err);
        }
    }
    
    // Salva backup completo
    fs.writeFileSync(
        `${BACKUP_DIR}/backup-completo.json`, 
        JSON.stringify(backupData, null, 2)
    );
    
    // Crea script di ripristino automatico
    const restoreScript = generateRestoreScript(backupData);
    fs.writeFileSync(`${BACKUP_DIR}/restore.js`, restoreScript);
    
    console.log(`🎉 Backup completo salvato in: ${BACKUP_DIR}`);
    console.log(`📁 File creati:`);
    console.log(`   - backup-completo.json (backup principale)`);
    console.log(`   - [tabella].json (file separati)`);
    console.log(`   - [tabella].csv (formato Excel)`);
    console.log(`   - restore.js (script ripristino automatico)`);
}

function convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
        headers.map(header => {
            const value = row[header];
            // Gestisci valori con virgole o virgolette
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
        }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
}

function generateRestoreScript(backupData) {
    return `// Script di ripristino automatico generato il ${backupData.timestamp}
import { supabase } from '../src/supabase.js';
import fs from 'fs';

async function ripristinaDati() {
    console.log('🔄 Avvio ripristino dati...');
    
    const backup = JSON.parse(fs.readFileSync('./backup-completo.json', 'utf8'));
    
    for (const [tabella, dati] of Object.entries(backup.tables)) {
        if (!dati.length) continue;
        
        console.log(\`📥 Ripristino \${tabella}: \${dati.length} record\`);
        
        // Svuota tabella esistente (ATTENZIONE!)
        await supabase.from(tabella).delete().neq('id', 0);
        
        // Inserisci dati in batch
        const batchSize = 100;
        for (let i = 0; i < dati.length; i += batchSize) {
            const batch = dati.slice(i, i + batchSize);
            const { error } = await supabase.from(tabella).insert(batch);
            
            if (error) {
                console.error(\`❌ Errore ripristino \${tabella}:\`, error);
            }
        }
        
        console.log(\`✅ \${tabella} ripristinata\`);
    }
    
    console.log('🎉 Ripristino completato!');
}

ripristinaDati().catch(console.error);`;
}

// Esegui backup
backupCompleto().catch(console.error);