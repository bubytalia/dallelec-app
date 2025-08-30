// ========================================
// BACKUP DATI DIRETTO - SENZA VARIABILI ENV
// ========================================

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configurazione diretta (temporanea per backup)
const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

const BACKUP_DIR = `./backup-dati-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}`;

// Lista tabelle critiche - AGGIORNA QUANDO AGGIUNGI NUOVE TABELLE
const TABELLE = [
    'clients', 'chantiers', 'devis', 'produits', 'supplements', 
    'metrages', 'factures', 'collaborateurs', 'techniciens',
    'familles', 'sousfamilles', 'conditions', 'heures', 'heuresChef'
    // AGGIUNGI QUI NUOVE TABELLE:
    // 'fornitori', 'magazzino', 'progetti', etc.
];

async function backupDati() {
    console.log('🚀 Avvio backup dati Supabase...');
    
    // Crea cartella
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const backup = {
        timestamp: new Date().toISOString(),
        database: 'supabase',
        tables: {}
    };
    
    let totaleRecord = 0;
    
    for (const tabella of TABELLE) {
        try {
            console.log(`📊 Backup ${tabella}...`);
            
            const { data, error } = await supabase
                .from(tabella)
                .select('*');
                
            if (error) {
                console.log(`⚠️  ${tabella}: ${error.message}`);
                backup.tables[tabella] = [];
                continue;
            }
            
            backup.tables[tabella] = data || [];
            totaleRecord += data?.length || 0;
            
            // Salva file separato
            fs.writeFileSync(
                `${BACKUP_DIR}/${tabella}.json`, 
                JSON.stringify(data, null, 2)
            );
            
            console.log(`✅ ${tabella}: ${data?.length || 0} record`);
            
        } catch (err) {
            console.log(`❌ Errore ${tabella}:`, err.message);
            backup.tables[tabella] = [];
        }
    }
    
    // Salva backup completo
    fs.writeFileSync(
        `${BACKUP_DIR}/backup-completo.json`, 
        JSON.stringify(backup, null, 2)
    );
    
    // Crea info leggibile
    const info = `BACKUP DALLELEC DATI
========================
Data: ${new Date().toLocaleString('it-IT')}
Database: Supabase
Totale record: ${totaleRecord}
Tabelle salvate: ${Object.keys(backup.tables).length}

DETTAGLIO TABELLE:
${Object.entries(backup.tables)
    .map(([nome, dati]) => `- ${nome}: ${dati.length} record`)
    .join('\n')}

FILE CREATI:
- backup-completo.json (backup principale)
${TABELLE.map(t => `- ${t}.json`).join('\n')}
`;
    
    fs.writeFileSync(`${BACKUP_DIR}/BACKUP_INFO.txt`, info);
    
    console.log(`\n🎉 BACKUP COMPLETATO!`);
    console.log(`📁 Cartella: ${BACKUP_DIR}`);
    console.log(`📊 Totale record: ${totaleRecord}`);
    console.log(`📄 File info: BACKUP_INFO.txt`);
}

backupDati().catch(console.error);