-- Script completo per creare tutte le tabelle mancanti in Supabase
-- Esegui questo nel SQL Editor di Supabase

-- Tabella admins
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella interimaires (se non esiste)
CREATE TABLE IF NOT EXISTS interimaires (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT,
  telephone TEXT,
  email TEXT,
  cout_horaire DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella regies (se non esiste)
CREATE TABLE IF NOT EXISTS regies (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  prix_defaut DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella conditions (se non esiste)
CREATE TABLE IF NOT EXISTS conditions (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  texte TEXT,
  ordre INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella paiements (se non esiste)
CREATE TABLE IF NOT EXISTS paiements (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  pourcentage DECIMAL,
  ordre INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserisci dati di default
INSERT INTO admins (nom, prenom, email) 
VALUES ('Admin', 'Dallelec', 'admin@dallelec.com')
ON CONFLICT (email) DO NOTHING;

-- Verifica tabelle create
SELECT 'admins' as tabella, count(*) as records FROM admins
UNION ALL
SELECT 'interimaires' as tabella, count(*) as records FROM interimaires
UNION ALL
SELECT 'regies' as tabella, count(*) as records FROM regies
UNION ALL
SELECT 'conditions' as tabella, count(*) as records FROM conditions
UNION ALL
SELECT 'paiements' as tabella, count(*) as records FROM paiements;