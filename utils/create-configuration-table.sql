-- Crea tabella configuration in Supabase
-- Eseguire nel SQL Editor di Supabase Dashboard

CREATE TABLE IF NOT EXISTS configuration (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE,
    prix_default DECIMAL(10,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisce configurazione régies di default
INSERT INTO configuration (type, prix_default) 
VALUES ('regies', 65.0) 
ON CONFLICT (type) DO UPDATE SET prix_default = EXCLUDED.prix_default;