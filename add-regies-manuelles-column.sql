-- Aggiungere colonna regies_manuelles alla tabella factures
-- Eseguire nel SQL Editor di Supabase Dashboard

ALTER TABLE factures ADD COLUMN IF NOT EXISTS regies_manuelles JSONB DEFAULT NULL;

COMMENT ON COLUMN factures.regies_manuelles IS 'Ore di regie inserite manualmente nella fattura, formato: [{heures, prixHeure, description}]';
