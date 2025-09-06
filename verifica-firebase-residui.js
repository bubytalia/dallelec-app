// Verifica completa residui Firebase nel database Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aumhdoiwtichjlvbrnrl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

// Funzione per identificare se un ID è di Firebase (stringa lunga) o Supabase (numero)
function isFirebaseId(id) {
    return typeof id === 'string' && id.length > 10 && /^[a-zA-Z0-9]{20,}$/.test(id);
}

async function verificaResiduiFirebase() {
    console.log('🔍 === VERIFICA RESIDUI FIREBASE ===\n');
    
    const problemi = [];
    
    try {
        // 1. VERIFICA DEVIS
        console.log('📋 Controllo DEVIS...');
        const { data: devis } = await supabase.from('devis').select('*');
        
        devis?.forEach(d => {
            if (isFirebaseId(d.client_id)) {
                problemi.push(`DEVIS ${d.numero}: client_id Firebase = ${d.client_id}`);
            }
            if (isFirebaseId(d.chantier_id)) {
                problemi.push(`DEVIS ${d.numero}: chantier_id Firebase = ${d.chantier_id}`);
            }
        });
        console.log(`   ✅ ${devis?.length || 0} devis controllati`);
        
        // 2. VERIFICA CHANTIERS
        console.log('🏗️ Controllo CHANTIERS...');
        const { data: chantiers } = await supabase.from('chantiers').select('*');
        
        chantiers?.forEach(c => {
            if (isFirebaseId(c.client_id)) {
                problemi.push(`CHANTIER ${c.nom}: client_id Firebase = ${c.client_id}`);
            }
            if (isFirebaseId(c.devis_id)) {
                problemi.push(`CHANTIER ${c.nom}: devis_id Firebase = ${c.devis_id}`);
            }
        });
        console.log(`   ✅ ${chantiers?.length || 0} chantiers controllati`);
        
        // 3. VERIFICA PRODUITS
        console.log('📦 Controllo PRODUITS...');
        const { data: produits } = await supabase.from('produits').select('*');
        
        produits?.forEach(p => {
            if (isFirebaseId(p.famille_id)) {
                problemi.push(`PRODUIT ${p.article}: famille_id Firebase = ${p.famille_id}`);
            }
            if (isFirebaseId(p.sousfamille_id)) {
                problemi.push(`PRODUIT ${p.article}: sousfamille_id Firebase = ${p.sousfamille_id}`);
            }
        });
        console.log(`   ✅ ${produits?.length || 0} produits controllati`);
        
        // 4. VERIFICA SOUSFAMILLES
        console.log('📂 Controllo SOUSFAMILLES...');
        const { data: sousfamilles } = await supabase.from('sousfamilles').select('*');
        
        sousfamilles?.forEach(sf => {
            if (isFirebaseId(sf.famille_id)) {
                problemi.push(`SOUSFAMILLE ${sf.nom}: famille_id Firebase = ${sf.famille_id}`);
            }
        });
        console.log(`   ✅ ${sousfamilles?.length || 0} sousfamilles controllate`);
        
        // 5. VERIFICA METRAGES
        console.log('📏 Controllo METRAGES...');
        const { data: metrages } = await supabase.from('metrages').select('*');
        
        metrages?.forEach(m => {
            if (isFirebaseId(m.chantier_id)) {
                problemi.push(`METRAGE ${m.id}: chantier_id Firebase = ${m.chantier_id}`);
            }
            if (isFirebaseId(m.devis_id)) {
                problemi.push(`METRAGE ${m.id}: devis_id Firebase = ${m.devis_id}`);
            }
        });
        console.log(`   ✅ ${metrages?.length || 0} métrages controllati`);
        
        // 6. VERIFICA HEURES
        console.log('⏰ Controllo HEURES...');
        const { data: heures } = await supabase.from('heures').select('*');
        
        heures?.forEach(h => {
            if (isFirebaseId(h.chantier_id)) {
                problemi.push(`HEURES ${h.id}: chantier_id Firebase = ${h.chantier_id}`);
            }
            if (isFirebaseId(h.user_id)) {
                problemi.push(`HEURES ${h.id}: user_id Firebase = ${h.user_id}`);
            }
        });
        console.log(`   ✅ ${heures?.length || 0} heures controllate`);
        
        // 7. VERIFICA HEURES CHEF
        console.log('👷 Controllo HEURES CHEF...');
        const { data: heuresChef } = await supabase.from('heures_chef').select('*');
        
        heuresChef?.forEach(hc => {
            if (isFirebaseId(hc.chantier_id)) {
                problemi.push(`HEURES_CHEF ${hc.id}: chantier_id Firebase = ${hc.chantier_id}`);
            }
            if (isFirebaseId(hc.chef_id)) {
                problemi.push(`HEURES_CHEF ${hc.id}: chef_id Firebase = ${hc.chef_id}`);
            }
        });
        console.log(`   ✅ ${heuresChef?.length || 0} heures chef controllate`);
        
        // RISULTATI
        console.log('\n🎯 === RISULTATI VERIFICA ===');
        
        if (problemi.length === 0) {
            console.log('✅ NESSUN RESIDUO FIREBASE TROVATO!');
            console.log('🎉 Il database è completamente migrato a Supabase!');
            console.log('🔥 Firebase può essere abbandonato in sicurezza!');
        } else {
            console.log(`❌ TROVATI ${problemi.length} RESIDUI FIREBASE:`);
            console.log('');
            problemi.forEach((problema, index) => {
                console.log(`${index + 1}. ${problema}`);
            });
            console.log('');
            console.log('⚠️ ATTENZIONE: Firebase NON può essere abbandonato ancora!');
            console.log('🛠️ Questi riferimenti devono essere corretti prima.');
        }
        
    } catch (error) {
        console.error('❌ Errore durante la verifica:', error);
    }
}

verificaResiduiFirebase();