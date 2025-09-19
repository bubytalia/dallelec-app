-- Creazione tabella heures_chef_propres per ore dei chef de chantier
CREATE TABLE IF NOT EXISTS public.heures_chef_propres (
    id SERIAL PRIMARY KEY,
    chef_id TEXT NOT NULL,
    chef_email TEXT NOT NULL,
    chantier_id TEXT NOT NULL,
    date DATE NOT NULL,
    heures_normales DECIMAL(4,2) DEFAULT 0,
    heures_supplementaires DECIMAL(4,2) DEFAULT 0,
    total_heures DECIMAL(4,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_heures_chef_propres_chef_id ON public.heures_chef_propres(chef_id);
CREATE INDEX IF NOT EXISTS idx_heures_chef_propres_date ON public.heures_chef_propres(date);
CREATE INDEX IF NOT EXISTS idx_heures_chef_propres_chantier ON public.heures_chef_propres(chantier_id);

-- RLS (Row Level Security) - solo il chef può vedere le proprie ore
ALTER TABLE public.heures_chef_propres ENABLE ROW LEVEL SECURITY;

-- Policy per permettere ai chef di vedere solo le proprie ore
CREATE POLICY "Chef can view own hours" ON public.heures_chef_propres
    FOR SELECT USING (auth.jwt() ->> 'email' = chef_email);

-- Policy per permettere ai chef di inserire le proprie ore
CREATE POLICY "Chef can insert own hours" ON public.heures_chef_propres
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = chef_email);

-- Policy per permettere ai chef di aggiornare le proprie ore
CREATE POLICY "Chef can update own hours" ON public.heures_chef_propres
    FOR UPDATE USING (auth.jwt() ->> 'email' = chef_email);

-- Policy per admin (possono vedere tutto)
CREATE POLICY "Admin can view all hours" ON public.heures_chef_propres
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );

COMMENT ON TABLE public.heures_chef_propres IS 'Ore lavorate dai chef de chantier';