-- Aggiunge colonne per devis à corps
-- Eseguire su Supabase SQL Editor

ALTER TABLE devis 
ADD COLUMN IF NOT EXISTS description_corps TEXT,
ADD COLUMN IF NOT EXISTS montant_corps DECIMAL(10,2);

-- Commenti per documentazione
COMMENT ON COLUMN devis.description_corps IS 'Description libre pour devis à corps';
COMMENT ON COLUMN devis.montant_corps IS 'Montant forfaitaire HT pour devis à corps';