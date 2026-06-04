-- Tabella per i Comptables (commercialisti)
CREATE TABLE IF NOT EXISTS comptables (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserisci il commercialista attuale
INSERT INTO comptables (nom, prenom, email) VALUES ('Exxpert', 'Cabinet', 'exxpert@dallelec.com');

-- Tabella per i Clients VIP
CREATE TABLE IF NOT EXISTS clients_vip (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT UNIQUE,
  client_id INTEGER,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migra il client VIP esistente da accessi_vip (se esiste)
INSERT INTO clients_vip (nom, prenom, email, client_id, actif)
SELECT nom, prenom, email, client_id, actif
FROM accessi_vip
WHERE email = 'calculateur@lumielec.ch'
ON CONFLICT (email) DO NOTHING;

-- RLS policies
ALTER TABLE comptables ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients_vip ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON comptables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON clients_vip FOR ALL TO authenticated USING (true) WITH CHECK (true);
