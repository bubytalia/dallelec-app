// Script per impostare i ruoli utenti Firebase
// NOTA: Questo script richiede Firebase Admin SDK e deve essere eseguito lato server

console.log(`
⚠️  IMPORTANTE: Impostazione Custom Claims Firebase

Per impostare i ruoli utenti, devi:

1. Andare su Firebase Console: https://console.firebase.google.com
2. Seleziona progetto: dallelec-app-new  
3. Vai su Authentication → Users
4. Trova l'utente admin@dallelec.com
5. Clicca sui 3 puntini → "Set custom user claims"
6. Aggiungi: {"role": "admin"}

OPPURE usa Firebase CLI:

firebase auth:import users.json --project dallelec-app-new

Dove users.json contiene:
{
  "users": [
    {
      "localId": "AKkuhhyVMOf20C5gSJFVK7Ipbvw1",
      "email": "admin@dallelec.com", 
      "customAttributes": "{\\"role\\":\\"admin\\"}"
    }
  ]
}

OPPURE crea uno script Node.js con Firebase Admin SDK.
`);

// Esempio di come dovrebbe essere fatto con Admin SDK
const exampleCode = `
// Con Firebase Admin SDK (lato server)
import admin from 'firebase-admin';

await admin.auth().setCustomUserClaims('AKkuhhyVMOf20C5gSJFVK7Ipbvw1', {
  role: 'admin'
});
`;

console.log('Esempio codice Admin SDK:');
console.log(exampleCode);