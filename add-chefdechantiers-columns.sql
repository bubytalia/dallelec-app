-- Aggiungere colonne mancanti alla tabella chefdechantiers
ALTER TABLE chefdechantiers 
ADD COLUMN IF NOT EXISTS etat VARCHAR(50),
ADD COLUMN IF NOT EXISTS cout_horaire DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS exclude_from_report BOOLEAN DEFAULT FALSE;