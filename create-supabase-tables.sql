-- Creazione tabelle Supabase per Dallelec

-- 1. Tabella Clients
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  adresse TEXT,
  ville TEXT,
  telephone TEXT,
  email_contact TEXT,
  email_compta TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabella Produits
CREATE TABLE IF NOT EXISTS produits (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  article TEXT NOT NULL,
  description TEXT,
  taille TEXT,
  unite TEXT NOT NULL,
  prix DECIMAL(10,2),
  prezzo_netto BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tabella Techniciens
CREATE TABLE IF NOT EXISTS techniciens (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT,
  telephone TEXT,
  client_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tabella Chantiers
CREATE TABLE IF NOT EXISTS chantiers (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  numero_cantiere TEXT,
  nom TEXT NOT NULL,
  adresse TEXT,
  ville TEXT,
  client TEXT,
  technicien TEXT,
  modalita_resoconto TEXT,
  capocantiere TEXT,
  prix_regie DECIMAL(10,2),
  percentuale_impresa INTEGER,
  devis_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Tabella Supplements
CREATE TABLE IF NOT EXISTS supplements (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  valeur DECIMAL(10,2),
  ordre INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Tabella Familles
CREATE TABLE IF NOT EXISTS familles (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  ordre INTEGER,
  visible_pdf BOOLEAN DEFAULT FALSE,
  ordre_pdf INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Tabella SousFamilles
CREATE TABLE IF NOT EXISTS sousfamilles (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  famille_id TEXT,
  ordre INTEGER DEFAULT 0,
  pourcentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Tabella Devis
CREATE TABLE IF NOT EXISTS devis (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  numero TEXT,
  nom TEXT,
  client_id TEXT,
  technicien TEXT,
  adresse TEXT,
  total DECIMAL(10,2),
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Tabella Collaborateurs
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

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_clients_firebase_id ON clients(firebase_id);
CREATE INDEX IF NOT EXISTS idx_produits_firebase_id ON produits(firebase_id);
CREATE INDEX IF NOT EXISTS idx_techniciens_firebase_id ON techniciens(firebase_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_firebase_id ON chantiers(firebase_id);
CREATE INDEX IF NOT EXISTS idx_supplements_firebase_id ON supplements(firebase_id);
CREATE INDEX IF NOT EXISTS idx_familles_firebase_id ON familles(firebase_id);
CREATE INDEX IF NOT EXISTS idx_sousfamilles_firebase_id ON sousfamilles(firebase_id);
CREATE INDEX IF NOT EXISTS idx_devis_firebase_id ON devis(firebase_id);
CREATE INDEX IF NOT EXISTS idx_collaborateurs_firebase_id ON collaborateurs(firebase_id);

-- Commenti per documentazione
COMMENT ON TABLE clients IS 'Anagrafica clienti Dallelec';
COMMENT ON TABLE produits IS 'Catalogo prodotti per devis';
COMMENT ON TABLE techniciens IS 'Tecnici specializzati per cantieri';
COMMENT ON TABLE chantiers IS 'Cantieri di lavoro';
COMMENT ON TABLE supplements IS 'Supplementi per prodotti';
COMMENT ON TABLE familles IS 'Famiglie prodotti per organizzazione';
COMMENT ON TABLE sousfamilles IS 'Sottofamiglie prodotti';
COMMENT ON TABLE devis IS 'Preventivi e devis';
COMMENT ON TABLE collaborateurs IS 'Collaboratori e dipendenti';