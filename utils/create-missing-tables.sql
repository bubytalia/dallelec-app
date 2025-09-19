-- Script SQL per creare le tabelle mancanti in Supabase
-- Eseguire nel SQL Editor di Supabase

-- 1. Tabella FACTURES
CREATE TABLE IF NOT EXISTS factures (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) NOT NULL,
    chantier_id INTEGER,
    date_facture DATE NOT NULL,
    montant_ht DECIMAL(10,2) NOT NULL,
    taux_tva DECIMAL(5,2) DEFAULT 7.7,
    montant_ttc DECIMAL(10,2) NOT NULL,
    statut VARCHAR(20) DEFAULT 'emise',
    client_nom VARCHAR(255),
    date_echeance DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabella ABSENCES
CREATE TABLE IF NOT EXISTS absences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) DEFAULT 'ouvrier',
    type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    original_status VARCHAR(30),
    cancellation_requested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabella CONFIGURATION
CREATE TABLE IF NOT EXISTS configuration (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE,
    prix_default DECIMAL(10,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inserimento configurazione régies di default
INSERT INTO configuration (type, prix_default) 
VALUES ('regies', 65.0) 
ON CONFLICT (type) DO NOTHING;

-- 5. Indici per performance
CREATE INDEX IF NOT EXISTS idx_factures_chantier ON factures(chantier_id);
CREATE INDEX IF NOT EXISTS idx_factures_date ON factures(date_facture);
CREATE INDEX IF NOT EXISTS idx_absences_user ON absences(user_id);
CREATE INDEX IF NOT EXISTS idx_absences_dates ON absences(start_date, end_date);

-- 6. RLS (Row Level Security) - opzionale
-- ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE configuration ENABLE ROW LEVEL SECURITY;