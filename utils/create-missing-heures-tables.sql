-- TABELLE ORE MANCANTI - Da eseguire in Supabase SQL Editor

-- Tabella ore ouvriers
CREATE TABLE IF NOT EXISTS heures_ouvriers (
    id SERIAL PRIMARY KEY,
    chantier_id INTEGER REFERENCES chantiers(id),
    date DATE NOT NULL,
    heures DECIMAL(4,2) NOT NULL DEFAULT 0,
    type_travail TEXT DEFAULT 'Normal',
    notes TEXT,
    ouvrier_id TEXT NOT NULL,
    ouvrier_nom TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella ore proprie chef
CREATE TABLE IF NOT EXISTS heures_chef_propres (
    id SERIAL PRIMARY KEY,
    chantier_id INTEGER REFERENCES chantiers(id),
    date DATE NOT NULL,
    heures_propres DECIMAL(4,2) NOT NULL DEFAULT 0,
    chef_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella ore interinali chef
CREATE TABLE IF NOT EXISTS heures_chef_interim (
    id SERIAL PRIMARY KEY,
    chantier_id INTEGER REFERENCES chantiers(id),
    date DATE NOT NULL,
    interimaire_id INTEGER REFERENCES interimaires(id),
    heures_interim DECIMAL(4,2) NOT NULL DEFAULT 0,
    chef_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_heures_ouvriers_chantier ON heures_ouvriers(chantier_id);
CREATE INDEX IF NOT EXISTS idx_heures_ouvriers_date ON heures_ouvriers(date);
CREATE INDEX IF NOT EXISTS idx_heures_ouvriers_ouvrier ON heures_ouvriers(ouvrier_id);

CREATE INDEX IF NOT EXISTS idx_heures_chef_propres_chantier ON heures_chef_propres(chantier_id);
CREATE INDEX IF NOT EXISTS idx_heures_chef_propres_date ON heures_chef_propres(date);

CREATE INDEX IF NOT EXISTS idx_heures_chef_interim_chantier ON heures_chef_interim(chantier_id);
CREATE INDEX IF NOT EXISTS idx_heures_chef_interim_date ON heures_chef_interim(date);

-- RLS policies (permissive per ora)
ALTER TABLE heures_ouvriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE heures_chef_propres ENABLE ROW LEVEL SECURITY;
ALTER TABLE heures_chef_interim ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on heures_ouvriers" ON heures_ouvriers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on heures_chef_propres" ON heures_chef_propres FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on heures_chef_interim" ON heures_chef_interim FOR ALL USING (true) WITH CHECK (true);