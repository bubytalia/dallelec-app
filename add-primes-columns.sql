-- Aggiunge chef secondaire sui chantiers
ALTER TABLE chantiers ADD COLUMN IF NOT EXISTS chef_secondaire TEXT DEFAULT NULL;

-- Aggiunge tipo paiement e acconto su primes_paiements
ALTER TABLE primes_paiements ADD COLUMN IF NOT EXISTS type_paiement TEXT DEFAULT 'solde'; -- 'acconto' | 'solde'
ALTER TABLE primes_paiements ADD COLUMN IF NOT EXISTS montant_acconto NUMERIC DEFAULT 0;
