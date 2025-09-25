-- Aggiunge colonna per nascondere lista supplementi nel PDF
ALTER TABLE devis 
ADD COLUMN IF NOT EXISTS hide_supplements_list BOOLEAN DEFAULT FALSE;

-- Commento per documentazione
COMMENT ON COLUMN devis.hide_supplements_list IS 'Se TRUE, nasconde la lista supplementi nel PDF del devis';