-- Tabella pianificazione cantieri
-- Ogni riga = un collaboratore assegnato a un cantiere per un giorno specifico
CREATE TABLE IF NOT EXISTS planification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  collaborateur_id UUID NOT NULL REFERENCES collaborateurs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chantier_id, collaborateur_id, date)
);

-- Aggiunta colonne date_debut e date_fin ai cantieri
ALTER TABLE chantiers ADD COLUMN IF NOT EXISTS date_debut DATE;
ALTER TABLE chantiers ADD COLUMN IF NOT EXISTS date_fin DATE;

-- Index per performance
CREATE INDEX IF NOT EXISTS idx_planification_date ON planification(date);
CREATE INDEX IF NOT EXISTS idx_planification_chantier ON planification(chantier_id);
CREATE INDEX IF NOT EXISTS idx_planification_collaborateur ON planification(collaborateur_id);

-- RLS policies
ALTER TABLE planification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON planification FOR ALL USING (true) WITH CHECK (true);
