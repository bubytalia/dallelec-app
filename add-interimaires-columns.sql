-- Aggiungere colonne mancanti alla tabella interimaires
ALTER TABLE interimaires 
ADD COLUMN IF NOT EXISTS specialite VARCHAR(100),
ADD COLUMN IF NOT EXISTS tarif_horaire DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS agence VARCHAR(200),
ADD COLUMN IF NOT EXISTS notes TEXT;