// Controlla se la tabella factures esiste in Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aumhdoiwtichjlvbrnrl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function checkFacturesTable() {
    console.log('🔍 Controllo tabella factures...');
    
    try {
        const { data, error } = await supabase
            .from('factures')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌ Tabella factures NON esiste:', error.message);
            console.log('📋 Devo creare la tabella in Supabase');
        } else {
            console.log('✅ Tabella factures esiste');
            console.log('Dati esempio:', data);
        }
    } catch (err) {
        console.log('❌ Errore controllo tabella:', err);
    }
}

checkFacturesTable();