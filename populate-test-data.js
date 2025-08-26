// Script per popolare dati di test
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCzxO4A2qI8IcXTM9K4mhgdHMV377RCBQg",
  authDomain: "dallelec-gestion-58a49-a18c0.firebaseapp.com",
  projectId: "dallelec-gestion-58a49-a18c0",
  storageBucket: "dallelec-gestion-58a49-a18c0.firebasestorage.app",
  messagingSenderId: "117553246551",
  appId: "1:117553246551:web:9a05dcf1c0d7b42d044e12"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function populateTestData() {
  try {
    // Clienti
    await addDoc(collection(db, 'clients'), {
      nom: 'ACME Construction SA',
      adresse: 'Rue du Commerce 15',
      ville: 'Genève',
      telephone: '+41 22 123 45 67'
    });

    // Devis
    await addDoc(collection(db, 'devis'), {
      numero: 'DEV-2024-001',
      nom: 'Installation électrique villa',
      nomChantier: 'Villa Moderne Genève',
      clientId: 'test-client-1',
      status: 'En cours',
      total: 15000
    });

    console.log('✅ Dati di test creati!');
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

populateTestData();