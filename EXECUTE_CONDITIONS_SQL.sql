-- ⚠️ ESEGUIRE NEL DASHBOARD SUPABASE
-- https://supabase.com/dashboard/project/aumhdoiwtichjlvbrnrl/sql

-- 1. Tabella Conditions
CREATE TABLE IF NOT EXISTS conditions (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  type TEXT,
  ordre INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabella Paiements
CREATE TABLE IF NOT EXISTS paiements (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  delai_jours INTEGER DEFAULT 30,
  pourcentage_acompte DECIMAL(5,2) DEFAULT 0,
  ordre INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Aggiungere campi condizioni alla tabella devis
ALTER TABLE devis ADD COLUMN IF NOT EXISTS conditions_comprend JSONB;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS conditions_ne_comprend_pas JSONB;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS paiement_id TEXT;