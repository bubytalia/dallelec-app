-- Aggiunta campi mancanti alla tabella devis per compatibilità completa

ALTER TABLE devis ADD COLUMN IF NOT EXISTS zones JSONB;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS modalita_prezzi TEXT DEFAULT 'scontistica';
ALTER TABLE devis ADD COLUMN IF NOT EXISTS remises JSONB;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS produits JSONB;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS discount DECIMAL(5,2) DEFAULT 0;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS draft BOOLEAN DEFAULT true;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS data_congelati JSONB;

-- Commenti per i nuovi campi
COMMENT ON COLUMN devis.zones IS 'Zone del cantiere (array JSON)';
COMMENT ON COLUMN devis.modalita_prezzi IS 'Modalità prezzi: scontistica o prezziFissi';
COMMENT ON COLUMN devis.remises IS 'Remise per famiglia (oggetto JSON)';
COMMENT ON COLUMN devis.produits IS 'Prodotti del devis (array JSON)';
COMMENT ON COLUMN devis.discount IS 'Sconto supplementare percentuale';
COMMENT ON COLUMN devis.draft IS 'Se true è una bozza';
COMMENT ON COLUMN devis.data_congelati IS 'Dati congelati per integrità storica';