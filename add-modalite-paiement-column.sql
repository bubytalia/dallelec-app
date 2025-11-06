-- Aggiunge colonna modalite_paiement alla tabella factures
ALTER TABLE factures 
ADD COLUMN modalite_paiement TEXT DEFAULT '30 jours net';

-- Aggiorna le fatture esistenti con modalità di pagamento di default
UPDATE factures 
SET modalite_paiement = '30 jours net' 
WHERE modalite_paiement IS NULL;