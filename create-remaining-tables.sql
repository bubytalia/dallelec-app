-- Crea tabelle rimanenti per completare la migrazione

CREATE TABLE sousfamilles (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT,
  nom TEXT,
  famille_id TEXT,
  ordre INTEGER,
  visible_pdf BOOLEAN DEFAULT true
);

CREATE TABLE chantiers (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT,
  nom TEXT,
  client TEXT,
  adresse TEXT,
  ville TEXT,
  date_debut DATE,
  date_fin DATE,
  status TEXT DEFAULT 'actif'
);

CREATE TABLE devis (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT,
  nom TEXT,
  numero TEXT,
  client_id TEXT,
  chantier_id TEXT,
  date_creation DATE DEFAULT CURRENT_DATE,
  total DECIMAL,
  status TEXT DEFAULT 'brouillon'
);