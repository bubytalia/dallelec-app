-- Aggiunge colonne per sistema correzione resoconti
-- Eseguire su Supabase SQL Editor

ALTER TABLE resoconti_percentuali 
ADD COLUMN IF NOT EXISTS correction_reason TEXT,
ADD COLUMN IF NOT EXISTS numero_fattura_riservato TEXT;

-- Crea tabella zone_convertite se non esiste
CREATE TABLE IF NOT EXISTS zone_convertite (
  id SERIAL PRIMARY KEY,
  chantier_id INTEGER REFERENCES chantiers(id),
  zona TEXT NOT NULL,
  convertita_il TIMESTAMPTZ DEFAULT NOW()
);

-- Commenti per documentazione
COMMENT ON COLUMN resoconti_percentuali.correction_reason IS 'Motivo della correzione richiesta dall admin';
COMMENT ON COLUMN resoconti_percentuali.numero_fattura_riservato IS 'Numero fattura da mantenere dopo correzione';