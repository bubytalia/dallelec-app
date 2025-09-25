-- Aggiunta colonne per Devis en Régie (tariffa oraria)
-- Eseguire su Supabase SQL Editor

ALTER TABLE devis 
ADD COLUMN IF NOT EXISTS tarif_ouvrier_1 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS nom_ouvrier_1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS tarif_ouvrier_2 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS nom_ouvrier_2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS description_regie TEXT;

-- Verifica colonne create
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'devis' 
AND column_name IN ('tarif_ouvrier_1', 'nom_ouvrier_1', 'tarif_ouvrier_2', 'nom_ouvrier_2', 'description_regie');