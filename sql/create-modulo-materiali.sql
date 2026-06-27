-- =====================================================
-- MODULO MATERIALI - Tabelle Database
-- Sistema isolato per gestione preventivi completi
-- Prefisso: mat_
-- =====================================================

-- 1. FORNITORI - Anagrafica fornitori materiale
CREATE TABLE mat_fornitori (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  referente TEXT,
  telefono TEXT,
  email TEXT,
  note TEXT,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ARTICOLI FORNITORE - Catalogo articoli per ogni fornitore
CREATE TABLE mat_articoli_fornitore (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fornitore_id UUID REFERENCES mat_fornitori(id) ON DELETE CASCADE,
  codice TEXT NOT NULL,
  descrizione TEXT NOT NULL,
  unita TEXT DEFAULT 'pz',
  categoria TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. DISTINTE MATERIALI - Composizione materiali per articolo di posa
-- Lega un articolo del listino posa ai componenti necessari
CREATE TABLE mat_distinte (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produit_id INTEGER NOT NULL,  -- FK verso tabella produits (articolo posa)
  articolo_fornitore_id UUID REFERENCES mat_articoli_fornitore(id) ON DELETE CASCADE,
  quantita_per_unita NUMERIC(10,4) NOT NULL DEFAULT 1,  -- es. 0.66 pendard per metro
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. MAGGIORAZIONI - % da applicare (scarto, gestione, guadagno)
CREATE TABLE mat_maggiorazioni (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,  -- es. "Scarto", "Gestione cantiere", "Guadagno"
  percentuale NUMERIC(5,2) NOT NULL DEFAULT 0,  -- es. 5.00 = 5%
  applicazione TEXT DEFAULT 'globale',  -- 'globale' o 'per_articolo'
  produit_id INTEGER,  -- NULL = globale, altrimenti specifico per articolo
  attivo BOOLEAN DEFAULT true,
  ordine INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. OFFERTE FORNITORE - Un'offerta ricevuta da un fornitore per un cantiere
CREATE TABLE mat_offerte (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fornitore_id UUID REFERENCES mat_fornitori(id) ON DELETE CASCADE,
  chantier_id INTEGER,  -- FK verso chantiers
  riferimento TEXT,  -- numero offerta fornitore
  data_offerta DATE DEFAULT CURRENT_DATE,
  data_scadenza DATE,
  note TEXT,
  stato TEXT DEFAULT 'attiva',  -- attiva, scaduta, utilizzata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PREZZI OFFERTA - Prezzi singoli articoli dentro un'offerta
CREATE TABLE mat_offerte_prezzi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offerta_id UUID REFERENCES mat_offerte(id) ON DELETE CASCADE,
  articolo_fornitore_id UUID REFERENCES mat_articoli_fornitore(id) ON DELETE CASCADE,
  prezzo_unitario NUMERIC(10,4) NOT NULL,
  quantita_minima INTEGER DEFAULT 1,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PREVENTIVI COMPLETI - Il preventivo posa + materiali
CREATE TABLE mat_preventivi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  devis_id INTEGER,  -- FK verso devis esistente (per la parte posa)
  chantier_id INTEGER,
  client_id INTEGER,
  offerta_id UUID REFERENCES mat_offerte(id),  -- offerta fornitore scelta
  nome TEXT,
  stato TEXT DEFAULT 'bozza',  -- bozza, inviato, accettato, rifiutato
  totale_posa NUMERIC(12,2) DEFAULT 0,
  totale_materiali NUMERIC(12,2) DEFAULT 0,
  totale_generale NUMERIC(12,2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. RIGHE PREVENTIVO COMPLETO - Dettaglio per ogni articolo
CREATE TABLE mat_preventivi_righe (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  preventivo_id UUID REFERENCES mat_preventivi(id) ON DELETE CASCADE,
  produit_id INTEGER,  -- articolo posa
  descrizione TEXT,
  quantita NUMERIC(10,2) NOT NULL DEFAULT 1,
  prezzo_posa NUMERIC(10,4) DEFAULT 0,
  prezzo_materiale NUMERIC(10,4) DEFAULT 0,  -- calcolato da distinta + offerta
  prezzo_unitario_totale NUMERIC(10,4) DEFAULT 0,  -- posa + materiale
  totale_riga NUMERIC(12,2) DEFAULT 0,
  ordine INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- RLS POLICIES - Accesso libero (come altre tabelle del sistema)
-- =====================================================

ALTER TABLE mat_fornitori ENABLE ROW LEVEL SECURITY;
ALTER TABLE mat_articoli_fornitore ENABLE ROW LEVEL SECURITY;
ALTER TABLE mat_distinte ENABLE ROW LEVEL SECURITY;
ALTER TABLE mat_maggiorazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE mat_offerte ENABLE ROW LEVEL SECURITY;
ALTER TABLE mat_offerte_prezzi ENABLE ROW LEVEL SECURITY;
ALTER TABLE mat_preventivi ENABLE ROW LEVEL SECURITY;
ALTER TABLE mat_preventivi_righe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mat_fornitori_all" ON mat_fornitori FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mat_articoli_fornitore_all" ON mat_articoli_fornitore FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mat_distinte_all" ON mat_distinte FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mat_maggiorazioni_all" ON mat_maggiorazioni FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mat_offerte_all" ON mat_offerte FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mat_offerte_prezzi_all" ON mat_offerte_prezzi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mat_preventivi_all" ON mat_preventivi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mat_preventivi_righe_all" ON mat_preventivi_righe FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- INDICI per performance
-- =====================================================
CREATE INDEX idx_mat_articoli_fornitore_id ON mat_articoli_fornitore(fornitore_id);
CREATE INDEX idx_mat_distinte_produit ON mat_distinte(produit_id);
CREATE INDEX idx_mat_offerte_fornitore ON mat_offerte(fornitore_id);
CREATE INDEX idx_mat_offerte_chantier ON mat_offerte(chantier_id);
CREATE INDEX idx_mat_offerte_prezzi_offerta ON mat_offerte_prezzi(offerta_id);
CREATE INDEX idx_mat_preventivi_devis ON mat_preventivi(devis_id);
CREATE INDEX idx_mat_preventivi_righe_prev ON mat_preventivi_righe(preventivo_id);
