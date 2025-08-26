-- Crea tabella admins per Supabase
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserisci admin di default
INSERT INTO admins (nom, prenom, email) 
VALUES ('Admin', 'Dallelec', 'admin@dallelec.com')
ON CONFLICT (email) DO NOTHING;