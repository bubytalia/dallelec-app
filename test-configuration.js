// Test rapido tabella configuration
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aumhdoiwtichjlvbrnrl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function testConfiguration() {
    console.log('🧪 Test tabella configuration...');
    
    try {
        // Test lettura
        const { data: readData, error: readError } = await supabase
            .from('configuration')
            .select('*')
            .eq('type', 'regies')
            .single();
        
        if (readError) {
            console.log('❌ Lettura:', readError.message);
        } else {
            console.log('✅ Lettura OK:', readData);
        }
        
        // Test scrittura
        const { error: writeError } = await supabase
            .from('configuration')
            .upsert({
                type: 'regies',
                prix_default: 70.0
            });
        
        if (writeError) {
            console.log('❌ Scrittura:', writeError.message);
        } else {
            console.log('✅ Scrittura OK');
        }
        
    } catch (err) {
        console.log('❌ Errore:', err.message);
    }
}

testConfiguration();