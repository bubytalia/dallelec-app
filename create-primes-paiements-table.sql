-- Tabella per tracciare i pagamenti dei premi
-- Eseguire nel SQL Editor di Supabase Dashboard

CREATE TABLE IF NOT EXISTS primes_paiements (
  id SERIAL PRIMARY KEY,
  chantier_id INTEGER NOT NULL,
  capocantiere TEXT NOT NULL,
  montant NUMERIC(10,2) NOT NULL,
  mois_paiement TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chantier_id, capocantiere)
);

-- Abilita RLS
ALTER TABLE primes_paiements ENABLE ROW LEVEL SECURITY;

-- Policy: tutti possono leggere
CREATE POLICY "Allow read primes_paiements" ON primes_paiements FOR SELECT USING (true);

-- Policy: tutti possono inserire/aggiornare/cancellare (admin gestisce via frontend)
CREATE POLICY "Allow insert primes_paiements" ON primes_paiements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update primes_paiements" ON primes_paiements FOR UPDATE USING (true);
CREATE POLICY "Allow delete primes_paiements" ON primes_paiements FOR DELETE USING (true);
