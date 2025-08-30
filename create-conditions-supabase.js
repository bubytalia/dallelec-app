// Script per creare tabelle conditions in Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createConditionsTables() {
  console.log('🔧 Creazione tabelle conditions...');
  
  try {
    // Inserimento condizioni di default
    const defaultConditions = [
      { nom: 'Fourniture et pose', description: 'Fourniture et pose du matériel selon les règles de l\'art', type: 'comprend', ordre: 1, active: true },
      { nom: 'Matériel conforme aux normes', description: 'Matériel conforme aux normes suisses en vigueur', type: 'comprend', ordre: 2, active: true },
      { nom: 'Garantie 2 ans', description: 'Garantie de 2 ans sur le matériel et la main d\'œuvre', type: 'comprend', ordre: 3, active: true },
      { nom: 'Terrassement', description: 'Travaux de terrassement et de génie civil', type: 'ne_comprend_pas', ordre: 1, active: true },
      { nom: 'Peinture et finitions', description: 'Travaux de peinture et finitions décoratives', type: 'ne_comprend_pas', ordre: 2, active: true },
      { nom: 'Évacuation gravats', description: 'Évacuation des gravats et déchets de chantier', type: 'ne_comprend_pas', ordre: 3, active: true }
    ];

    console.log('📋 Inserimento condizioni di default...');
    const { data: conditionsData, error: conditionsError } = await supabase
      .from('conditions')
      .insert(defaultConditions)
      .select();

    if (conditionsError) {
      console.error('❌ Errore inserimento condizioni:', conditionsError);
    } else {
      console.log(`✅ Inserite ${conditionsData.length} condizioni`);
    }

    // Inserimento modalità pagamento di default
    const defaultPaiements = [
      { nom: '30 jours net', description: 'Paiement à 30 jours net', delai_jours: 30, pourcentage_acompte: 0, ordre: 1, active: true },
      { nom: '50% acompte', description: 'Acompte de 50% à la commande, solde à la livraison', delai_jours: 0, pourcentage_acompte: 50, ordre: 2, active: true },
      { nom: 'Comptant', description: 'Paiement comptant à la livraison', delai_jours: 0, pourcentage_acompte: 0, ordre: 3, active: true }
    ];

    console.log('💳 Inserimento modalità pagamento...');
    const { data: paiementsData, error: paiementsError } = await supabase
      .from('paiements')
      .insert(defaultPaiements)
      .select();

    if (paiementsError) {
      console.error('❌ Errore inserimento paiements:', paiementsError);
    } else {
      console.log(`✅ Inserite ${paiementsData.length} modalità pagamento`);
    }

    console.log('🎉 Creazione tabelle completata!');

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

createConditionsTables();