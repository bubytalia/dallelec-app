-- Aggiunge colonne per resoconto finale alla tabella resoconti_percentuali
ALTER TABLE resoconti_percentuali 
ADD COLUMN IF NOT EXISTS prodotti_reali JSONB,
ADD COLUMN IF NOT EXISTS supplementi_aggiuntivi JSONB,
ADD COLUMN IF NOT EXISTS total_ml_previste DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_ml_reali DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS importo_fatturato_prodotti DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS importo_regie_fatturate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS variazioni_quantita DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS conguaglio_finale DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS acconti_precedenti DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'percentuale';

-- Commenti per documentare le colonne
COMMENT ON COLUMN resoconti_percentuali.prodotti_reali IS 'Dati prodotti con quantità reali posate (JSON)';
COMMENT ON COLUMN resoconti_percentuali.supplementi_aggiuntivi IS 'Supplementi non previsti nel devis (JSON)';
COMMENT ON COLUMN resoconti_percentuali.total_ml_previste IS 'Totale ML previste nel devis per la zona';
COMMENT ON COLUMN resoconti_percentuali.total_ml_reali IS 'Totale ML realmente posate';
COMMENT ON COLUMN resoconti_percentuali.importo_fatturato_prodotti IS 'Importo già fatturato per prodotti (escluse regie)';
COMMENT ON COLUMN resoconti_percentuali.importo_regie_fatturate IS 'Importo regie già fatturate per questa zona';
COMMENT ON COLUMN resoconti_percentuali.variazioni_quantita IS 'Variazione importo dovuta a differenze quantità';
COMMENT ON COLUMN resoconti_percentuali.conguaglio_finale IS 'Conguaglio finale totale';
COMMENT ON COLUMN resoconti_percentuali.acconti_precedenti IS 'Acconti precedenti da sottrarre (es: 10000 CHF Mikron)';
COMMENT ON COLUMN resoconti_percentuali.type IS 'Tipo: percentuale o resoconto_finale';