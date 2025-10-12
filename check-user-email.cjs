const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmails() {
  console.log('📧 VERIFICA EMAIL DISPONIBILI');
  
  // Mostra tutte le email dei capocantiere
  const { data: chantiers } = await supabase
    .from('chantiers')
    .select('capocantiere')
    .not('capocantiere', 'is', null);
  
  const emails = [...new Set(chantiers?.map(c => c.capocantiere).filter(Boolean))];
  
  console.log('\n👨💼 EMAIL CAPOCANTIERE DISPONIBILI:');
  emails.forEach((email, index) => {
    console.log(`${index + 1}. ${email}`);
  });
  
  console.log('\n🔍 Per ogni email, chantiers assegnati:');
  for (const email of emails) {
    const { data: emailChantiers } = await supabase
      .from('chantiers')
      .select('id, nom')
      .eq('capocantiere', email);
    
    console.log(`\n📋 ${email}: ${emailChantiers?.length || 0} chantiers`);
    emailChantiers?.forEach(c => {
      console.log(`   - ID: ${c.id}, Nome: ${c.nom}`);
    });
  }
}

checkEmails().catch(console.error);