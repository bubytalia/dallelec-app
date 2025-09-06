// Corregge i client_id dei techniciens da firebase_id a id Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aumhdoiwtichjlvbrnrl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA'
);

async function fixTechniciensClientId() {
    console.log('=== CORREZIONE CLIENT_ID TECHNICIENS ===');
    
    // Carica tutti i clienti
    const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, firebase_id, nom');
    
    if (clientsError) {
        console.error('Errore caricamento clienti:', clientsError);
        return;
    }
    
    // Carica tutti i techniciens
    const { data: techniciens, error: techError } = await supabase
        .from('techniciens')
        .select('id, nom, client_id');
    
    if (techError) {
        console.error('Errore caricamento techniciens:', techError);
        return;
    }
    
    console.log(`Trovati ${clients.length} clienti e ${techniciens.length} techniciens`);
    
    // Per ogni technicien, trova il client corrispondente e aggiorna client_id
    for (const tech of techniciens) {
        const client = clients.find(c => c.firebase_id === tech.client_id);
        
        if (client) {
            console.log(`Aggiornando ${tech.nom}: ${tech.client_id} → ${client.id}`);
            
            const { error } = await supabase
                .from('techniciens')
                .update({ client_id: client.id })
                .eq('id', tech.id);
            
            if (error) {
                console.error(`Errore aggiornamento ${tech.nom}:`, error);
            } else {
                console.log(`✅ ${tech.nom} aggiornato`);
            }
        } else {
            console.log(`⚠️ Cliente non trovato per ${tech.nom} (client_id: ${tech.client_id})`);
        }
    }
    
    console.log('=== CORREZIONE COMPLETATA ===');
}

fixTechniciensClientId();