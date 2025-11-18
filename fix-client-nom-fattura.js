// Script per aggiornare la ragione sociale nelle fatture esistenti
// Esegui con: node fix-client-nom-fattura.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixClientNomFactures() {
  try {
    console.log('🔍 Caricamento dati...');
    
    // 1. Carica tutte le fatture
    const { data: factures, error: facturesError } = await supabase
      .from('factures')
      .select('*');
    
    if (facturesError) throw facturesError;
    
    // 2. Carica tutti i cantieri
    const { data: chantiers, error: chantiersError } = await supabase
      .from('chantiers')
      .select('*');
    
    if (chantiersError) throw chantiersError;
    
    // 3. Carica tutti i clienti
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');
    
    if (clientsError) throw clientsError;
    
    console.log(`📊 Trovate ${factures.length} fatture, ${chantiers.length} cantieri, ${clients.length} clienti`);
    
    // 4. Per ogni fattura, aggiorna client_nom con i dati attuali
    let aggiornate = 0;
    
    for (const facture of factures) {
      // Trova il cantiere associato
      const chantier = chantiers.find(c => c.id === facture.chantier_id);
      if (!chantier) {
        console.log(`⚠️ Cantiere non trovato per fattura ${facture.numero}`);
        continue;
      }
      
      // Trova il cliente dal nome nel cantiere
      const clienteAttuale = clients.find(c => c.nom === chantier.client);
      if (!clienteAttuale) {
        console.log(`⚠️ Cliente non trovato per cantiere ${chantier.nom}`);
        continue;
      }
      
      // Controlla se il nome è diverso
      if (facture.client_nom !== clienteAttuale.nom) {
        console.log(`🔄 Aggiornamento fattura ${facture.numero}:`);
        console.log(`   Da: "${facture.client_nom}"`);
        console.log(`   A:  "${clienteAttuale.nom}"`);
        
        // Aggiorna la fattura
        const { error: updateError } = await supabase
          .from('factures')
          .update({ client_nom: clienteAttuale.nom })
          .eq('id', facture.id);
        
        if (updateError) {
          console.error(`❌ Errore aggiornamento fattura ${facture.numero}:`, updateError);
        } else {
          aggiornate++;
          console.log(`✅ Fattura ${facture.numero} aggiornata`);
        }
      }
    }
    
    console.log(`\n🎯 COMPLETATO: ${aggiornate} fatture aggiornate`);
    
    if (aggiornate === 0) {
      console.log('ℹ️ Tutte le fatture hanno già la ragione sociale corretta');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

// Esegui lo script
fixClientNomFactures();