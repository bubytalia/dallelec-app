// Controlla contenuto tabella conditions
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aumhdoiwtichjlvbrnrl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function checkConditions() {
    console.log('=== CONTROLLO TABELLA CONDITIONS ===');
    
    try {
        const { data, error } = await supabase
            .from('conditions')
            .select('*')
            .order('ordre');
            
        if (error) {
            console.log('❌ Errore:', error.message);
            return;
        }
        
        console.log(`✅ Trovate ${data.length} condizioni:`);
        data.forEach((cond, index) => {
            console.log(`${index + 1}. ${cond.nom} (${cond.type}) - Attiva: ${cond.active}`);
        });
        
    } catch (err) {
        console.log('❌ Errore:', err.message);
    }
}

checkConditions();