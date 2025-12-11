-- Aggiunge la colonna hide_prices alla tabella devis
-- per permettere di generare devis senza prezzi

ALTER TABLE devis 
ADD COLUMN IF NOT EXISTS hide_prices BOOLEAN DEFAULT false;

-- Commento per la colonna
COMMENT ON COLUMN devis.hide_prices IS 'Se true, nasconde i prezzi nel PDF del devis';