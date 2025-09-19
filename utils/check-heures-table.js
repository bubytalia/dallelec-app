// Controlla se la tabella heures_ouvriers esiste in Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aumhdoiwtichjlvbrnrl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function checkHeuresTable() {
    console.log('🔍 Controllo tabella heures_ouvriers...');
    
    try {
        const { data, error } = await supabase
            .from('heures_ouvriers')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌ Tabella heures_ouvriers NON esiste:', error.message);
            console.log('📋 Devo creare la tabella in Supabase');
        } else {
            console.log('✅ Tabella heures_ouvriers esiste');
            console.log('Dati esempio:', data);
        }
    } catch (err) {
        console.log('❌ Errore controllo tabella:', err);
    }
}

checkHeuresTable();