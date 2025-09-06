// Test completo del sistema convertito
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aumhdoiwtichjlvbrnrl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function testTables() {
    console.log('🧪 === TEST SISTEMA CONVERTITO ===\n');
    
    const tables = [
        'clients',
        'techniciens', 
        'produits',
        'familles',
        'sousfamilles',
        'conditions',
        'paiements',
        'supplements',
        'devis',
        'heures_ouvriers',
        'chantiers',
        'factures',
        'absences',
        'configuration'
    ];
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
            } else {
                console.log(`✅ ${table}: OK (${data?.length || 0} records)`);
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
        }
    }
}

async function testAuth() {
    console.log('\n🔐 === TEST AUTENTICAZIONE ===');
    
    try {
        // Test login con credenziali di prova
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'admin@dallelec.com',
            password: 'password123'
        });
        
        if (error) {
            console.log('❌ Login test fallito:', error.message);
        } else {
            console.log('✅ Login test OK');
            
            // Test logout
            await supabase.auth.signOut();
            console.log('✅ Logout test OK');
        }
    } catch (err) {
        console.log('❌ Errore test auth:', err.message);
    }
}

async function testCRUD() {
    console.log('\n📝 === TEST CRUD OPERATIONS ===');
    
    // Test Configuration (Regies)
    try {
        const { data, error } = await supabase
            .from('configuration')
            .upsert({
                type: 'regies',
                prix_default: 70.0
            });
        
        if (error) {
            console.log('❌ Test Configuration:', error.message);
        } else {
            console.log('✅ Test Configuration: OK');
        }
    } catch (err) {
        console.log('❌ Test Configuration:', err.message);
    }
    
    // Test Factures
    try {
        const testFacture = {
            numero: 'TEST-001',
            chantier_id: 1,
            date_facture: '2024-01-15',
            montant_ht: 1000.00,
            taux_tva: 7.7,
            montant_ttc: 1077.00,
            statut: 'emise',
            client_nom: 'Client Test'
        };
        
        const { data, error } = await supabase
            .from('factures')
            .insert([testFacture])
            .select();
        
        if (error) {
            console.log('❌ Test Factures:', error.message);
        } else {
            console.log('✅ Test Factures: OK');
            
            // Cleanup
            if (data?.[0]?.id) {
                await supabase.from('factures').delete().eq('id', data[0].id);
            }
        }
    } catch (err) {
        console.log('❌ Test Factures:', err.message);
    }
}

async function runAllTests() {
    await testTables();
    await testAuth();
    await testCRUD();
    
    console.log('\n🎯 === RISULTATO TEST ===');
    console.log('Se tutti i test sono ✅, il sistema è pronto!');
    console.log('Se ci sono ❌, controllare le tabelle mancanti in Supabase.');
}

runAllTests();