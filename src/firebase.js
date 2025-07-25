import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD97Bgyg0SwVPF9rZS4BCSWKP20LxXfaqM",
  authDomain: "dallelec-gestion-58a49.firebaseapp.com",
  projectId: "dallelec-gestion-58a49",
  storageBucket: "dallelec-gestion-58a49.appspot.com",
  messagingSenderId: "801397923579",
  appId: "1:801397923579:web:b07860aadfeef5c1579a5e",
  measurementId: "G-G3CLCT2ERB"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export { db, auth };
