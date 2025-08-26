import { auth } from './src/firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Test utenti esistenti
const testUsers = [
  'admin@dallelec.com',
  'chef@dallelec.com', 
  'ouvrier@dallelec.com',
  'daniele.dallelec@gmail.com'
];

async function checkUsers() {
  console.log('🔍 Controllo utenti Firebase esistenti...\n');
  
  for (const email of testUsers) {
    try {
      // Prova login con password comune
      const passwords = ['admin123', 'Admin123!', 'dallelec123', 'password'];
      
      for (const password of passwords) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          // Ottieni custom claims
          const idTokenResult = await user.getIdTokenResult();
          const role = idTokenResult.claims.role;
          
          console.log(`✅ ${email}`);
          console.log(`   Password: ${password}`);
          console.log(`   Ruolo: ${role || 'NON DEFINITO'}`);
          console.log(`   Nome: ${user.displayName || 'N/A'}\n`);
          
          // Logout per testare il prossimo
          await auth.signOut();
          break;
          
        } catch (error) {
          // Password sbagliata, prova la prossima
          continue;
        }
      }
      
    } catch (error) {
      console.log(`❌ ${email}: ${error.message}\n`);
    }
  }
}

checkUsers().catch(console.error);