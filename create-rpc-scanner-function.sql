-- FUNZIONE RPC PER SCANNER DINAMICO TABELLE
-- Eseguire questo script nel SQL Editor di Supabase per abilitare lo scanner perfetto

CREATE OR REPLACE FUNCTION get_all_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'sql_%'
  ORDER BY t.table_name;
$$;

-- Commento: Questa funzione restituisce TUTTE le tabelle reali del database
-- eliminando completamente gli errori su tabelle inesistenti