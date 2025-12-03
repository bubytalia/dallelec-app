-- Aggiunge colonna remise_supplementaire alla tabella devis
ALTER TABLE devis 
ADD COLUMN IF NOT EXISTS remise_supplementaire DECIMAL(5,2) DEFAULT 0;

-- Aggiorna il devis QOQA con la remise supplémentaire
UPDATE devis 
SET remise_supplementaire = 15.00
WHERE nom ILIKE '%QOQA%';