// Crea tabella conditions in Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aumhdoiwtichjlvbrnrl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function createConditionsTable() {
    console.log('=== CREAZIONE TABELLA CONDITIONS ===');
    
    // Test se la tabella esiste già
    try {
        const { data, error } = await supabase.from('conditions').select('*').limit(1);
        
        if (!error) {
            console.log('✅ Tabella conditions già esistente');
            console.log(`Record esistenti: ${data.length}`);
            return;
        }
    } catch (err) {
        console.log('❌ Tabella conditions non trovata, creazione necessaria');
    }
    
    // Inserisci condizioni di default
    const defaultConditions = [
        {
            nom: 'Prix valable 30 jours',
            description: 'Prix valable 30 jours',
            type: 'comprend',
            active: true,
            ordre: 1
        },
        {
            nom: 'TVA 7.7% en sus',
            description: 'TVA 7.7% en sus',
            type: 'comprend',
            active: true,
            ordre: 2
        },
        {
            nom: 'Paiement 30 jours net',
            description: 'Paiement 30 jours net',
            type: 'comprend',
            active: true,
            ordre: 3
        },
        {
            nom: 'Matériel fourni par le client',
            description: 'Matériel fourni par le client',
            type: 'ne_comprend_pas',
            active: false,
            ordre: 4
        },
        {
            nom: 'Échafaudages',
            description: 'Échafaudages',
            type: 'ne_comprend_pas',
            active: false,
            ordre: 5
        }
    ];
    
    try {
        const { data, error } = await supabase
            .from('conditions')
            .insert(defaultConditions);
            
        if (error) {
            console.log('❌ Errore inserimento:', error.message);
            return;
        }
        
        console.log('✅ Tabella conditions creata con successo!');
        console.log(`✅ Inserite ${defaultConditions.length} condizioni di default`);
        
        // Verifica
        const { data: verify } = await supabase.from('conditions').select('*');
        console.log(`✅ Verifica: ${verify.length} condizioni totali`);
        
    } catch (err) {
        console.log('❌ Errore:', err.message);
    }
}

createConditionsTable();