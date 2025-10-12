-- Aggiunge colonna type_metrage alla tabella chantiers
ALTER TABLE chantiers 
ADD COLUMN IF NOT EXISTS type_metrage VARCHAR(20) DEFAULT 'detaille';

-- Aggiorna i cantieri esistenti che hanno modalita_resoconto = 'percentuale'
UPDATE chantiers 
SET type_metrage = 'percentuel' 
WHERE modalita_resoconto = 'percentuale';

-- Commento per spiegare i valori possibili
-- type_metrage può essere:
-- 'detaille' - Métrage détaillé classico (default)
-- 'percentuel' - Resoconto percentuale