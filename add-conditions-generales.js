// Aggiunge condizioni generali di esempio
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aumhdoiwtichjlvbrnrl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function addConditionsGenerales() {
    console.log('=== AGGIUNTA CONDIZIONI GENERALI ===');
    
    const conditionsGenerales = [
        {
            nom: 'Tous les montants sont HT',
            description: 'Tous les montants sont HT',
            type: 'generales',
            active: true,
            ordre: 1
        },
        {
            nom: 'La facturation sera faite uniquement pour les matériaux posés',
            description: 'La facturation sera faite uniquement pour les matériaux posés',
            type: 'generales',
            active: true,
            ordre: 2
        },
        {
            nom: 'TVA 7.7% en sus',
            description: 'TVA 7.7% en sus',
            type: 'generales',
            active: true,
            ordre: 3
        }
    ];
    
    try {
        const { data, error } = await supabase
            .from('conditions')
            .insert(conditionsGenerales);
            
        if (error) {
            console.log('❌ Errore inserimento:', error.message);
            return;
        }
        
        console.log('✅ Condizioni generali aggiunte con successo!');
        console.log(`✅ Inserite ${conditionsGenerales.length} condizioni generali`);
        
        // Verifica
        const { data: verify } = await supabase
            .from('conditions')
            .select('*')
            .eq('type', 'generales');
        console.log(`✅ Verifica: ${verify.length} condizioni generali totali`);
        
    } catch (err) {
        console.log('❌ Errore:', err.message);
    }
}

addConditionsGenerales();