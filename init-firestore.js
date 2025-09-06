import { initializeApp } from 'firebase/app';
import { getFirestore, enableNetwork } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBuUhKJZqHlWfQQQQQQQQQQQQQQQQQQQQQ",
  authDomain: "dallelec-gestion-58a49.firebaseapp.com",
  projectId: "dallelec-gestion-58a49",
  storageBucket: "dallelec-gestion-58a49.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Forza inizializzazione database
enableNetwork(db).then(() => {
  console.log('✅ Database Firestore inizializzato');
  process.exit(0);
}).catch((error) => {
  console.log('❌ Errore:', error);
  process.exit(1);
});