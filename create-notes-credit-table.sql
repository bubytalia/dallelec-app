-- Tabella per le note di credito
CREATE TABLE IF NOT EXISTS notes_credit (
  id SERIAL PRIMARY KEY,
  numero TEXT NOT NULL,
  facture_numero TEXT NOT NULL,
  facture_id INTEGER,
  chantier_id INTEGER,
  client_nom TEXT,
  date_emission DATE DEFAULT CURRENT_DATE,
  montant_ht NUMERIC(12,2) DEFAULT 0,
  taux_tva NUMERIC(4,2) DEFAULT 8.1,
  montant_ttc NUMERIC(12,2) DEFAULT 0,
  motif TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE notes_credit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for notes_credit" ON notes_credit FOR ALL USING (true) WITH CHECK (true);
