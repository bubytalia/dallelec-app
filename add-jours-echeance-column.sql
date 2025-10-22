-- Aggiunge colonna jours_echeance alla tabella paiements
ALTER TABLE paiements 
ADD COLUMN jours_echeance INTEGER DEFAULT 30;

-- Aggiorna i valori per i metodi esistenti
UPDATE paiements SET jours_echeance = 0 WHERE nom = 'Comptant';
UPDATE paiements SET jours_echeance = 30 WHERE nom = '30 jours net';
UPDATE paiements SET jours_echeance = 60 WHERE nom = '60 jours net';
UPDATE paiements SET jours_echeance = 30 WHERE nom = 'Virement bancaire';
UPDATE paiements SET jours_echeance = 30 WHERE nom = 'Chèque';

-- Verifica risultato
SELECT nom, jours_echeance FROM paiements ORDER BY jours_echeance;