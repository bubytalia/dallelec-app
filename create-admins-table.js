import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssjzkdunniggfcsodvtx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzanprZHVubmlnZ2Zjc29kdnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQzMTgsImV4cCI6MjA3MTgxMDMxOH0.wun-KeKry3PJ9ujTrJzidXMFhT80ZwEbkyDz9FoAg_0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdminsTable() {
  try {
    console.log('🔧 Creando tabella admins...')
    
    // Esegui SQL per creare tabella
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          firebase_id TEXT UNIQUE,
          nom TEXT NOT NULL,
          prenom TEXT,
          email TEXT UNIQUE,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        INSERT INTO admins (nom, prenom, email) 
        VALUES ('Admin', 'Dallelec', 'admin@dallelec.com')
        ON CONFLICT (email) DO NOTHING;
      `
    })

    if (error) {
      console.error('❌ Errore creazione tabella:', error)
      console.log('📋 Esegui manualmente nel SQL Editor di Supabase:')
      console.log(`
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO admins (nom, prenom, email) 
VALUES ('Admin', 'Dallelec', 'admin@dallelec.com')
ON CONFLICT (email) DO NOTHING;
      `)
    } else {
      console.log('✅ Tabella admins creata con successo!')
    }
    
  } catch (error) {
    console.error('❌ Errore:', error)
  }
}

createAdminsTable()