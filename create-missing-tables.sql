-- Tabelle mancanti per Supabase

-- Techniciens
CREATE TABLE IF NOT EXISTS techniciens (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  email TEXT,
  client_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Supplements
CREATE TABLE IF NOT EXISTS supplements (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT,
  valeur DECIMAL,
  ordre INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Familles
CREATE TABLE IF NOT EXISTS familles (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT,
  ordre INTEGER,
  visible_pdf BOOLEAN DEFAULT false,
  visible_in_pdf BOOLEAN DEFAULT false,
  ordre_pdf INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sous-familles
CREATE TABLE IF NOT EXISTS sousfamilles (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT,
  ordre INTEGER,
  pourcentage DECIMAL,
  famille_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chantiers
CREATE TABLE IF NOT EXISTS chantiers (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT,
  adresse TEXT,
  ville TEXT,
  client TEXT,
  technicien TEXT,
  capocantiere TEXT,
  numero_cantiere TEXT,
  prix_regie DECIMAL,
  percentuale_impresa DECIMAL,
  modalita_resoconto TEXT,
  devis_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Collaborateurs (se non esiste)
CREATE TABLE IF NOT EXISTS collaborateurs (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  email TEXT,
  etat TEXT,
  cout_horaire DECIMAL,
  exclude_from_report BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chef de chantiers (se non esiste)
CREATE TABLE IF NOT EXISTS chefdechantiers (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);