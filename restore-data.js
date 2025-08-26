import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD97Bgyg0SwVPF9rZS4BCSWKP20LxXfaqM",
  authDomain: "dallelec-gestion-58a49.firebaseapp.com",
  projectId: "dallelec-gestion-58a49",
  storageBucket: "dallelec-gestion-58a49.appspot.com",
  messagingSenderId: "801397923579",
  appId: "1:801397923579:web:b07860aadfeef5c1579a5e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const restoreData = async () => {
  console.log('🔄 Ripristino dati di base...');

  // Clients
  const clients = [
    { nom: 'Client Test 1', adresse: 'Via Test 1', ville: 'Lugano', telephone: '091 123 4567' },
    { nom: 'Client Test 2', adresse: 'Via Test 2', ville: 'Bellinzona', telephone: '091 765 4321' }
  ];

  // Techniciens
  const techniciens = [
    { nom: 'Mario Rossi', email: 'mario@dallelec.ch', telephone: '079 123 4567' },
    { nom: 'Luca Bianchi', email: 'luca@dallelec.ch', telephone: '079 765 4321' }
  ];

  // Chef de chantiers
  const chefDeChantiers = [
    { nom: 'Giuseppe', prenom: 'Verdi', email: 'giuseppe@dallelec.ch', telephone: '079 111 2222' },
    { nom: 'Antonio', prenom: 'Rossi', email: 'antonio@dallelec.ch', telephone: '079 333 4444' }
  ];

  // Collaborateurs
  const collaborateurs = [
    { nom: 'Paolo', prenom: 'Neri', email: 'paolo@dallelec.ch', telephone: '079 555 6666' },
    { nom: 'Marco', prenom: 'Blu', email: 'marco@dallelec.ch', telephone: '079 777 8888' }
  ];

  // Familles
  const familles = [
    { nom: 'Électricité générale', ordre: 1 },
    { nom: 'Éclairage', ordre: 2 },
    { nom: 'Prises et interrupteurs', ordre: 3 }
  ];

  // Sous-familles
  const sousFamilles = [
    { nom: 'Installation', familleId: '', ordre: 1 },
    { nom: 'Maintenance', familleId: '', ordre: 2 }
  ];

  try {
    // Ripristina clients
    console.log('📋 Ripristino clients...');
    for (const client of clients) {
      await addDoc(collection(db, 'clients'), client);
    }

    // Ripristina techniciens
    console.log('👨‍🔧 Ripristino techniciens...');
    for (const tech of techniciens) {
      await addDoc(collection(db, 'techniciens'), tech);
    }

    // Ripristina chef de chantiers
    console.log('👷‍♂️ Ripristino chef de chantiers...');
    for (const chef of chefDeChantiers) {
      await addDoc(collection(db, 'chefdechantiers'), chef);
    }

    // Ripristina collaborateurs
    console.log('👥 Ripristino collaborateurs...');
    for (const collab of collaborateurs) {
      await addDoc(collection(db, 'collaborateurs'), collab);
    }

    // Ripristina familles
    console.log('📁 Ripristino familles...');
    const familleIds = [];
    for (const famille of familles) {
      const docRef = await addDoc(collection(db, 'familles'), famille);
      familleIds.push(docRef.id);
    }

    // Ripristina sous-familles
    console.log('📂 Ripristino sous-familles...');
    for (let i = 0; i < sousFamilles.length; i++) {
      sousFamilles[i].familleId = familleIds[0]; // Assegna alla prima famiglia
      await addDoc(collection(db, 'sousfamilles'), sousFamilles[i]);
    }

    console.log('✅ Ripristino completato!');
    console.log('🔄 Riavvia l\'applicazione per vedere i dati.');

  } catch (error) {
    console.error('❌ Errore durante il ripristino:', error);
  }
};

restoreData();