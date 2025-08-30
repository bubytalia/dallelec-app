-- COPIA E INCOLLA QUESTO NEL SQL EDITOR DI SUPABASE

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

-- Tabella Interimaires  
CREATE TABLE IF NOT EXISTS interimaires (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT,
  telephone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabella ChefDeChantiers
CREATE TABLE IF NOT EXISTS chefdechantiers (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT,
  telephone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_collaborateurs_firebase_id ON collaborateurs(firebase_id);
CREATE INDEX IF NOT EXISTS idx_interimaires_firebase_id ON interimaires(firebase_id);
CREATE INDEX IF NOT EXISTS idx_chefdechantiers_firebase_id ON chefdechantiers(firebase_id);