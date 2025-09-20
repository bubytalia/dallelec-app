-- Aggiunge la colonna acconti_precedenti alla tabella factures
ALTER TABLE factures ADD COLUMN acconti_precedenti DECIMAL(10,2) DEFAULT 0;

-- Commento: Campo per memorizzare gli acconti precedenti inseriti dall'admin