-- Creazione tabelle per condizioni di vendita

-- 1. Tabella Conditions (condizioni generali)
CREATE TABLE IF NOT EXISTS conditions (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  type TEXT, -- 'comprend' o 'ne_comprend_pas'
  ordre INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabella Paiements (modalità di pagamento)
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

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_conditions_firebase_id ON conditions(firebase_id);
CREATE INDEX IF NOT EXISTS idx_conditions_type ON conditions(type);
CREATE INDEX IF NOT EXISTS idx_paiements_firebase_id ON paiements(firebase_id);

-- Commenti
COMMENT ON TABLE conditions IS 'Condizioni di vendita (comprende/non comprende)';
COMMENT ON TABLE paiements IS 'Modalità di pagamento';
COMMENT ON COLUMN devis.conditions_comprend IS 'Array ID condizioni incluse';
COMMENT ON COLUMN devis.conditions_ne_comprend_pas IS 'Array ID condizioni escluse';
COMMENT ON COLUMN devis.paiement_id IS 'ID modalità di pagamento';

-- Inserimento condizioni di default
INSERT INTO conditions (firebase_id, nom, description, type, ordre) VALUES
('default_1', 'Fourniture et pose', 'Fourniture et pose du matériel selon les règles de l''art', 'comprend', 1),
('default_2', 'Matériel conforme aux normes', 'Matériel conforme aux normes suisses en vigueur', 'comprend', 2),
('default_3', 'Garantie 2 ans', 'Garantie de 2 ans sur le matériel et la main d''œuvre', 'comprend', 3),
('default_4', 'Terrassement', 'Travaux de terrassement et de génie civil', 'ne_comprend_pas', 1),
('default_5', 'Peinture et finitions', 'Travaux de peinture et finitions décoratives', 'ne_comprend_pas', 2),
('default_6', 'Évacuation gravats', 'Évacuation des gravats et déchets de chantier', 'ne_comprend_pas', 3);

-- Inserimento modalità pagamento di default
INSERT INTO paiements (firebase_id, nom, description, delai_jours, pourcentage_acompte, ordre) VALUES
('default_pay_1', '30 jours net', 'Paiement à 30 jours net', 30, 0, 1),
('default_pay_2', '50% acompte', 'Acompte de 50% à la commande, solde à la livraison', 0, 50, 2),
('default_pay_3', 'Comptant', 'Paiement comptant à la livraison', 0, 0, 3);