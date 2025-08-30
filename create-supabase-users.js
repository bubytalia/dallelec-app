// Script per creare utenti Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
  console.log('👥 Creazione utenti Supabase...');
  
  const users = [
    { email: 'admin@dallelec.com', password: 'dallelec2025' },
    { email: 'chef@dallelec.com', password: 'dallelec2025' },
    { email: 'ouvrier@dallelec.com', password: 'dallelec2025' }
  ];
  
  for (const user of users) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password
      });
      
      if (error) {
        console.error(`❌ Errore ${user.email}:`, error.message);
      } else {
        console.log(`✅ Utente creato: ${user.email}`);
      }
    } catch (e) {
      console.error(`❌ Errore generale ${user.email}:`, e);
    }
  }
  
  console.log('🎉 Creazione utenti completata!');
}

createUsers();