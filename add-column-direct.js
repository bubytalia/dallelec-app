// Script per aggiungere colonna hide_prices direttamente
const fetch = require('node-fetch');

async function addColumn() {
  console.log('🔧 Aggiunta colonna hide_prices via API REST...');
  
  const url = 'https://aumhdoiwtichjlvbrnrl.supabase.co/rest/v1/rpc/exec_sql';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE devis ADD COLUMN IF NOT EXISTS hide_prices BOOLEAN DEFAULT false;'
      })
    });
    
    const result = await response.text();
    console.log('Risposta:', response.status, result);
    
    if (response.ok) {
      console.log('✅ Colonna aggiunta con successo!');
    } else {
      console.log('❌ Errore:', result);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

addColumn();