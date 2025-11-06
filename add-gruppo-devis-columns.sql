-- Aggiunge colonne per raggruppamento devis
ALTER TABLE devis ADD COLUMN gruppo_devis_id TEXT;
ALTER TABLE chantiers ADD COLUMN gruppo_devis_id TEXT;