// Setup completo condizioni per Dallelec
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupConditionsComplete() {
  console.log('🔧 Setup completo condizioni Dallelec...');
  
  try {
    // 1. Verifica se le tabelle esistono
    console.log('🔍 Verifica tabelle...');
    
    const { data: conditionsTest, error: conditionsError } = await supabase
      .from('conditions')
      .select('count')
      .limit(1);
    
    if (conditionsError) {
      console.log('❌ Tabelle non esistono. Devi prima eseguire il SQL nel dashboard Supabase:');
      console.log('');
      console.log('-- ESEGUIRE NEL DASHBOARD SUPABASE:');
      console.log('CREATE TABLE conditions (');
      console.log('  id SERIAL PRIMARY KEY,');
      console.log('  nom TEXT NOT NULL,');
      console.log('  description TEXT,');
      console.log('  type TEXT,');
      console.log('  ordre INTEGER DEFAULT 0,');
      console.log('  active BOOLEAN DEFAULT true,');
      console.log('  created_at TIMESTAMP DEFAULT NOW()');
      console.log(');');
      console.log('');
      console.log('CREATE TABLE paiements (');
      console.log('  id SERIAL PRIMARY KEY,');
      console.log('  nom TEXT NOT NULL,');
      console.log('  description TEXT,');
      console.log('  delai_jours INTEGER DEFAULT 30,');
      console.log('  pourcentage_acompte DECIMAL(5,2) DEFAULT 0,');
      console.log('  ordre INTEGER DEFAULT 0,');
      console.log('  active BOOLEAN DEFAULT true,');
      console.log('  created_at TIMESTAMP DEFAULT NOW()');
      console.log(');');
      return;
    }
    
    console.log('✅ Tabelle esistono');
    
    // 2. Inserimento condizioni Dallelec
    const conditionsDallelec = [
      // Condizioni COMPRESE
      { nom: 'Fourniture et pose du matériel', description: 'Fourniture et pose du matériel électrique selon les règles de l\'art', type: 'comprend', ordre: 1, active: true },
      { nom: 'Matériel conforme aux normes', description: 'Matériel conforme aux normes suisses (NIBT, SIA) en vigueur', type: 'comprend', ordre: 2, active: true },
      { nom: 'Garantie 2 ans', description: 'Garantie de 2 ans sur le matériel et la main d\'œuvre', type: 'comprend', ordre: 3, active: true },
      { nom: 'Mise en service', description: 'Mise en service et tests de fonctionnement', type: 'comprend', ordre: 4, active: true },
      { nom: 'Nettoyage du chantier', description: 'Nettoyage et évacuation des déchets électriques', type: 'comprend', ordre: 5, active: true },
      
      // Condizioni NON COMPRESE
      { nom: 'Terrassement', description: 'Travaux de terrassement et de génie civil', type: 'ne_comprend_pas', ordre: 1, active: true },
      { nom: 'Peinture et finitions', description: 'Travaux de peinture et finitions décoratives', type: 'ne_comprend_pas', ordre: 2, active: true },
      { nom: 'Évacuation gravats', description: 'Évacuation des gravats et déchets de construction', type: 'ne_comprend_pas', ordre: 3, active: true },
      { nom: 'Raccordement réseau', description: 'Raccordement au réseau électrique public', type: 'ne_comprend_pas', ordre: 4, active: true },
      { nom: 'Permis et autorisations', description: 'Obtention des permis et autorisations administratives', type: 'ne_comprend_pas', ordre: 5, active: true }
    ];
    
    console.log('📋 Inserimento condizioni...');
    const { data: insertedConditions, error: insertError } = await supabase
      .from('conditions')
      .insert(conditionsDallelec)
      .select();
    
    if (insertError) {
      console.error('❌ Errore inserimento condizioni:', insertError);
    } else {
      console.log(`✅ Inserite ${insertedConditions.length} condizioni`);
    }
    
    // 3. Inserimento modalità pagamento
    const paiementsDallelec = [
      { nom: '30 jours net', description: 'Paiement à 30 jours net dès réception facture', delai_jours: 30, pourcentage_acompte: 0, ordre: 1, active: true },
      { nom: '50% acompte + solde', description: 'Acompte de 50% à la commande, solde à la livraison', delai_jours: 0, pourcentage_acompte: 50, ordre: 2, active: true },
      { nom: 'Comptant', description: 'Paiement comptant à la livraison', delai_jours: 0, pourcentage_acompte: 0, ordre: 3, active: true },
      { nom: '60 jours net', description: 'Paiement à 60 jours net dès réception facture', delai_jours: 60, pourcentage_acompte: 0, ordre: 4, active: true }
    ];
    
    console.log('💳 Inserimento modalità pagamento...');
    const { data: insertedPaiements, error: paiementsError } = await supabase
      .from('paiements')
      .insert(paiementsDallelec)
      .select();
    
    if (paiementsError) {
      console.error('❌ Errore inserimento paiements:', paiementsError);
    } else {
      console.log(`✅ Inserite ${insertedPaiements.length} modalità pagamento`);
    }
    
    console.log('🎉 Setup condizioni completato!');
    console.log('📍 Ora puoi andare su Admin → Repertoires → Conditions');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

setupConditionsComplete();