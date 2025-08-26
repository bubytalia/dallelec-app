-- Sistema di ruoli per Dallelec
-- Esegui questo nel SQL Editor di Supabase

-- Tabella users con ruoli
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'chef', 'ouvrier')),
  nom TEXT,
  prenom TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserisci utenti di default
INSERT INTO users (email, role, nom, prenom) VALUES
('admin@dallelec.com', 'admin', 'Admin', 'Dallelec'),
('chef@dallelec.com', 'chef', 'Chef', 'Cantiere'),
('ouvrier@dallelec.com', 'ouvrier', 'Ouvrier', 'Test')
ON CONFLICT (email) DO NOTHING;

-- Verifica
SELECT * FROM users;