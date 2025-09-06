// Corregge automaticamente tutti i residui Firebase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aumhdoiwtichjlvbrnrl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

function isFirebaseId(id) {
    return typeof id === 'string' && id.length > 10 && /^[a-zA-Z0-9]{20,}$/.test(id);
}

async function correggiResiduiFirebase() {
    console.log('🔧 === CORREZIONE RESIDUI FIREBASE ===\n');
    
    let correzioni = 0;
    
    try {
        // 1. CORREGGI DEVIS client_id
        console.log('📋 Correzione DEVIS...');
        const { data: clients } = await supabase.from('clients').select('id, firebase_id, nom');
        const { data: devis } = await supabase.from('devis').select('*');
        
        for (const d of devis || []) {
            if (isFirebaseId(d.client_id)) {
                const client = clients.find(c => c.firebase_id === d.client_id);
                if (client) {
                    console.log(`   Devis ${d.numero}: ${d.client_id} → ${client.id} (${client.nom})`);
                    await supabase.from('devis').update({ client_id: client.id }).eq('id', d.id);
                    correzioni++;
                }
            }
        }
        
        // 2. CORREGGI CHANTIERS devis_id
        console.log('🏗️ Correzione CHANTIERS...');
        const { data: chantiers } = await supabase.from('chantiers').select('*');
        
        for (const c of chantiers || []) {
            if (isFirebaseId(c.devis_id)) {
                // Trova devis per firebase_id (se esiste ancora)
                const devisMatch = devis?.find(d => d.firebase_id === c.devis_id);
                if (devisMatch) {
                    console.log(`   Chantier ${c.nom}: devis_id ${c.devis_id} → ${devisMatch.id}`);
                    await supabase.from('chantiers').update({ devis_id: devisMatch.id }).eq('id', c.id);
                    correzioni++;
                } else {
                    console.log(`   ⚠️ Chantier ${c.nom}: devis Firebase non trovato, impostando NULL`);
                    await supabase.from('chantiers').update({ devis_id: null }).eq('id', c.id);
                    correzioni++;
                }
            }
        }
        
        // 3. CORREGGI SOUSFAMILLES famille_id
        console.log('📂 Correzione SOUSFAMILLES...');
        const { data: familles } = await supabase.from('familles').select('id, firebase_id, nom');
        const { data: sousfamilles } = await supabase.from('sousfamilles').select('*');
        
        for (const sf of sousfamilles || []) {
            if (isFirebaseId(sf.famille_id)) {
                const famille = familles.find(f => f.firebase_id === sf.famille_id);
                if (famille) {
                    console.log(`   Sousfamille ${sf.nom}: ${sf.famille_id} → ${famille.id} (${famille.nom})`);
                    await supabase.from('sousfamilles').update({ famille_id: famille.id }).eq('id', sf.id);
                    correzioni++;
                }
            }
        }
        
        console.log(`\n✅ CORREZIONE COMPLETATA: ${correzioni} riferimenti corretti!`);
        console.log('🔥 Ora Firebase può essere abbandonato in sicurezza!');
        
    } catch (error) {
        console.error('❌ Errore durante la correzione:', error);
    }
}

correggiResiduiFirebase();