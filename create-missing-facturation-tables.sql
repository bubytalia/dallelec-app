-- Creazione tabelle per sistema fatturazione

-- Tabella factures
CREATE TABLE IF NOT EXISTS public.factures (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    chantier_id INTEGER REFERENCES public.chantiers(id),
    metrage_id INTEGER,
    resoconto_id INTEGER,
    date_facture DATE NOT NULL,
    date_echeance DATE,
    montant_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
    taux_tva DECIMAL(5,2) NOT NULL DEFAULT 7.7,
    montant_ttc DECIMAL(10,2) NOT NULL DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'emise',
    client_nom VARCHAR(255),
    notes TEXT,
    type VARCHAR(20) DEFAULT 'automatique',
    lignes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella metrages
CREATE TABLE IF NOT EXISTS public.metrages (
    id SERIAL PRIMARY KEY,
    chantier_id INTEGER REFERENCES public.chantiers(id),
    chef_id VARCHAR(255),
    periode_debut DATE,
    periode_fin DATE,
    zones TEXT[],
    items JSONB,
    regies JSONB,
    total_ml DECIMAL(10,2) DEFAULT 0,
    total_produits INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'en_attente',
    draft BOOLEAN DEFAULT false,
    facture BOOLEAN DEFAULT false,
    facture_numero VARCHAR(50),
    facture_date TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella resoconti_percentuali
CREATE TABLE IF NOT EXISTS public.resoconti_percentuali (
    id SERIAL PRIMARY KEY,
    chantier_id INTEGER REFERENCES public.chantiers(id),
    chef_id VARCHAR(255),
    periode_month VARCHAR(20),
    avancementi JSONB,
    regies JSONB,
    descrizione TEXT,
    status VARCHAR(20) DEFAULT 'en_attente',
    draft BOOLEAN DEFAULT false,
    approved_at TIMESTAMP,
    approved_by VARCHAR(255),
    rejected_at TIMESTAMP,
    rejected_by VARCHAR(255),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_factures_chantier ON public.factures(chantier_id);
CREATE INDEX IF NOT EXISTS idx_factures_date ON public.factures(date_facture);
CREATE INDEX IF NOT EXISTS idx_metrages_chantier ON public.metrages(chantier_id);
CREATE INDEX IF NOT EXISTS idx_metrages_status ON public.metrages(status);
CREATE INDEX IF NOT EXISTS idx_resoconti_chantier ON public.resoconti_percentuali(chantier_id);
CREATE INDEX IF NOT EXISTS idx_resoconti_status ON public.resoconti_percentuali(status);

-- RLS (Row Level Security) - per ora disabilitato per semplicità
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resoconti_percentuali ENABLE ROW LEVEL SECURITY;

-- Policy permissive per ora (da restringere in produzione)
CREATE POLICY "Allow all operations" ON public.factures FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.metrages FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.resoconti_percentuali FOR ALL USING (true);