import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configurazione Firebase diretta
const firebaseConfig = {
  apiKey: "AIzaSyDPv93V4Gj7J6C27MCW7aNpuymPDoTE2sw",
  authDomain: "dallelec-app-new.firebaseapp.com",
  projectId: "dallelec-app-new",
  storageBucket: "dallelec-app-new.firebasestorage.app",
  messagingSenderId: "20956978951",
  appId: "1:20956978951:web:0d882b21c7a38e8ffe2fa2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testLogin() {
  console.log('🔍 Test login Firebase...\n');
  
  try {
    // Prova con admin
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@dallelec.com', 'admin123');
    const user = userCredential.user;
    
    console.log('✅ Login riuscito!');
    console.log('Email:', user.email);
    console.log('UID:', user.uid);
    
    // Controlla custom claims
    const idTokenResult = await user.getIdTokenResult();
    console.log('Custom claims:', idTokenResult.claims);
    console.log('Ruolo:', idTokenResult.claims.role || 'NON DEFINITO');
    
  } catch (error) {
    console.log('❌ Errore login:', error.message);
  }
}

testLogin();