-- Aggiungere campo etat_insertion_heures alla tabella chantiers
-- Questo campo controlla se i dipendenti possono inserire ore su un cantiere

ALTER TABLE chantiers 
ADD COLUMN IF NOT EXISTS etat_insertion_heures VARCHAR(10) DEFAULT 'ouvert';

-- Imposta tutti i cantieri esistenti come 'ouvert' di default
UPDATE chantiers 
SET etat_insertion_heures = 'ouvert' 
WHERE etat_insertion_heures IS NULL;

-- Commento: 
-- 'ouvert' = dipendenti possono inserire ore
-- 'ferme' = dipendenti NON possono inserire ore (cantiere chiuso)
