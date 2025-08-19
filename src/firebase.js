import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD97Bgyg0SwVPF9rZS4BCSWKP20LxXfaqM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dallelec-gestion-58a49.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dallelec-gestion-58a49",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dallelec-gestion-58a49.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "801397923579",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:801397923579:web:b07860aadfeef5c1579a5e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-G3CLCT2ERB"
};

let firebaseApp, db, auth;

try {
  firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
} catch (error) {
  console.error('Firebase initialization failed:', error);
  throw new Error('Failed to initialize Firebase. Please check configuration.');
}

export { db, auth };
