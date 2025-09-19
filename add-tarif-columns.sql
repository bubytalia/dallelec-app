-- Aggiungere colonne tarif_utilise alle tabelle ore
-- Per evitare calcoli retroattivi nei bilanci

-- Tabella ore chef proprie
ALTER TABLE heures_chef_propres ADD COLUMN IF NOT EXISTS tarif_utilise DECIMAL(10,2);

-- Tabella ore ouvriers
ALTER TABLE heures_ouvriers ADD COLUMN IF NOT EXISTS tarif_utilise DECIMAL(10,2);

-- Tabella ore chef interim
ALTER TABLE heures_chef_interim ADD COLUMN IF NOT EXISTS tarif_utilise DECIMAL(10,2);

-- Commenti per documentazione
COMMENT ON COLUMN heures_chef_propres.tarif_utilise IS 'Tariffa salvata al momento della registrazione ore per evitare calcoli retroattivi';
COMMENT ON COLUMN heures_ouvriers.tarif_utilise IS 'Tariffa salvata al momento della registrazione ore per evitare calcoli retroattivi';
COMMENT ON COLUMN heures_chef_interim.tarif_utilise IS 'Tariffa salvata al momento della registrazione ore per evitare calcoli retroattivi';