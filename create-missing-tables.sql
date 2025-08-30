-- Tabelle mancanti per Dallelec Supabase

-- Tabella Collaborateurs
CREATE TABLE IF NOT EXISTS collaborateurs (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT,
  telephone TEXT,
  role TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_collaborateurs_firebase_id ON collaborateurs(firebase_id);

-- Commenti
COMMENT ON TABLE collaborateurs IS 'Collaboratori e dipendenti';