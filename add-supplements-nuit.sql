-- ============================================
-- SUPPLEMENTI NOTTURNI - Aggiunta colonne
-- Eseguire in Supabase SQL Editor
-- ============================================

-- Tabella heures_ouvriers: aggiungere supplement
ALTER TABLE heures_ouvriers 
  ADD COLUMN IF NOT EXISTS supplement_pourcentage INTEGER DEFAULT 0;

-- Tabella heures_chef_propres: aggiungere type_travail + supplement
ALTER TABLE heures_chef_propres 
  ADD COLUMN IF NOT EXISTS type_travail TEXT DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS supplement_pourcentage INTEGER DEFAULT 0;

-- Tabella heures_chef_interim: aggiungere type_travail + supplement
ALTER TABLE heures_chef_interim 
  ADD COLUMN IF NOT EXISTS type_travail TEXT DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS supplement_pourcentage INTEGER DEFAULT 0;

-- Tabella solde_heures: aggiungere colonne ore notturne per report
ALTER TABLE solde_heures
  ADD COLUMN IF NOT EXISTS heures_nuit_50 DECIMAL(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS heures_nuit_100 DECIMAL(6,2) DEFAULT 0;

-- ============================================
-- NOTA: I valori possibili per type_travail sono:
--   'Normal'       → supplement_pourcentage = 0
--   'Nuit +50%'    → supplement_pourcentage = 50  (20:00-24:00)
--   'Nuit +100%'   → supplement_pourcentage = 100 (00:00-06:00)
--   'Weekend'      → supplement_pourcentage = 0 (o altro se necessario)
-- ============================================
