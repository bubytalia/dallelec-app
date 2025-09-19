-- Tabelle per gestione ore Chef de Chantier
-- Da eseguire nel dashboard Supabase SQL Editor

-- Tabella per ore proprie del chef
CREATE TABLE IF NOT EXISTS heures_chef_propres (
    id SERIAL PRIMARY KEY,
    chantier_id INTEGER REFERENCES chantiers(id),
    date DATE NOT NULL,
    heures_propres DECIMAL(4,2) NOT NULL DEFAULT 0,
    chef_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per ore interinali gestite dal chef
CREATE TABLE IF NOT EXISTS heures_chef_interim (
    id SERIAL PRIMARY KEY,
    chantier_id INTEGER REFERENCES chantiers(id),
    date DATE NOT NULL,
    interimaire_id INTEGER REFERENCES interimaires(id),
    heures_interim DECIMAL(4,2) NOT NULL DEFAULT 0,
    chef_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_heures_chef_propres_chantier ON heures_chef_propres(chantier_id);
CREATE INDEX IF NOT EXISTS idx_heures_chef_propres_date ON heures_chef_propres(date);
CREATE INDEX IF NOT EXISTS idx_heures_chef_propres_chef ON heures_chef_propres(chef_id);

CREATE INDEX IF NOT EXISTS idx_heures_chef_interim_chantier ON heures_chef_interim(chantier_id);
CREATE INDEX IF NOT EXISTS idx_heures_chef_interim_date ON heures_chef_interim(date);
CREATE INDEX IF NOT EXISTS idx_heures_chef_interim_chef ON heures_chef_interim(chef_id);
CREATE INDEX IF NOT EXISTS idx_heures_chef_interim_interimaire ON heures_chef_interim(interimaire_id);

-- RLS (Row Level Security) - opzionale
ALTER TABLE heures_chef_propres ENABLE ROW LEVEL SECURITY;
ALTER TABLE heures_chef_interim ENABLE ROW LEVEL SECURITY;

-- Policy per permettere accesso completo (da personalizzare se necessario)
CREATE POLICY "Allow all operations on heures_chef_propres" ON heures_chef_propres
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on heures_chef_interim" ON heures_chef_interim
    FOR ALL USING (true) WITH CHECK (true);