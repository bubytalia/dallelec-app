-- Tabella per configurazione numerazione fatture
CREATE TABLE IF NOT EXISTS configurazione_fatture (
  id SERIAL PRIMARY KEY,
  ultimo_numero INTEGER DEFAULT 0,
  anno INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  prefisso VARCHAR(10) DEFAULT 'F',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci configurazione predefinita
INSERT INTO configurazione_fatture (ultimo_numero, anno) 
VALUES (0, EXTRACT(YEAR FROM CURRENT_DATE))
ON CONFLICT (id) DO NOTHING;