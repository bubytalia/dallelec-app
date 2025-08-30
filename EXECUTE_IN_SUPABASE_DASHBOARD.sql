-- ⚠️ IMPORTANTE: Eseguire queste query nel Dashboard di Supabase
-- Vai su: https://supabase.com/dashboard/project/aumhdoiwtichjlvbrnrl/sql
-- Copia e incolla queste query una alla volta

-- 1. Aggiungere campo zones (array JSON per le zone del cantiere)
ALTER TABLE devis ADD COLUMN zones JSONB;

-- 2. Aggiungere campo modalita_prezzi (scontistica o prezziFissi)
ALTER TABLE devis ADD COLUMN modalita_prezzi TEXT DEFAULT 'scontistica';

-- 3. Aggiungere campo remises (oggetto JSON per le remise per famiglia)
ALTER TABLE devis ADD COLUMN remises JSONB;

-- 4. Aggiungere campo produits (array JSON per i prodotti del devis)
ALTER TABLE devis ADD COLUMN produits JSONB;

-- 5. Aggiungere campo discount (sconto supplementare percentuale)
ALTER TABLE devis ADD COLUMN discount DECIMAL(5,2) DEFAULT 0;

-- 6. Aggiungere campo draft (se true è una bozza)
ALTER TABLE devis ADD COLUMN draft BOOLEAN DEFAULT true;

-- 7. Aggiungere campo data_congelati (dati congelati per integrità storica)
ALTER TABLE devis ADD COLUMN data_congelati JSONB;

-- 8. Aggiornare i devis esistenti per non essere bozze
UPDATE devis SET draft = false WHERE draft IS NULL;

-- 9. Verificare che tutto sia andato a buon fine
SELECT id, numero, nom, zones, modalita_prezzi, draft FROM devis LIMIT 3;