// Fix finale fattura
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

const totalHT = 27750.54;
const accontiHT = 10000;
const imponibileResiduo = totalHT - accontiHT;
const tva = imponibileResiduo * 0.081;
const soldeAPayer = imponibileResiduo + tva;

console.log(`Solde à payer: ${soldeAPayer.toFixed(2)} CHF`);

const { error } = await supabase
  .from('factures')
  .update({
    montant_ht: totalHT,
    montant_ttc: soldeAPayer
  })
  .eq('numero', 'F2025-052');

console.log(error ? 'Errore' : 'OK');