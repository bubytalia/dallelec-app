import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

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
const auth = getAuth(app);

const restoreEssentialData = async () => {
  console.log('🔄 Ripristino dati essenziali...');

  try {
    // 1. Utenti Admin
    console.log('👤 Creazione utenti admin...');
    const adminUsers = [
      { email: 'admin@dallelec.ch', password: 'Admin123!', role: 'admin', nom: 'Admin', prenom: 'Principal' },
      { email: 'manager@dallelec.ch', password: 'Manager123!', role: 'manager', nom: 'Manager', prenom: 'Dallelec' }
    ];

    for (const user of adminUsers) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: user.email,
          role: user.role,
          nom: user.nom,
          prenom: user.prenom,
          createdAt: new Date().toISOString()
        });
        console.log(`✅ Utente creato: ${user.email}`);
      } catch (error) {
        console.log(`⚠️ Utente ${user.email} già esistente o errore:`, error.message);
      }
    }

    // 2. Clients di base
    console.log('📋 Creazione clients...');
    const clients = [
      { nom: 'Client Test SA', adresse: 'Via Esempio 1', ville: 'Lugano', telephone: '091 123 4567', email: 'test@client.ch' },
      { nom: 'Azienda Demo Sàrl', adresse: 'Strada Demo 2', ville: 'Bellinzona', telephone: '091 765 4321', email: 'demo@azienda.ch' }
    ];

    for (const client of clients) {
      await addDoc(collection(db, 'clients'), client);
    }

    // 3. Techniciens
    console.log('👨🔧 Creazione techniciens...');
    const techniciens = [
      { nom: 'Rossi', prenom: 'Mario', email: 'mario.rossi@dallelec.ch', telephone: '079 123 4567' },
      { nom: 'Bianchi', prenom: 'Luca', email: 'luca.bianchi@dallelec.ch', telephone: '079 765 4321' }
    ];

    for (const tech of techniciens) {
      await addDoc(collection(db, 'techniciens'), tech);
    }

    // 4. Chef de chantiers
    console.log('👷♂️ Creazione chef de chantiers...');
    const chefDeChantiers = [
      { nom: 'Verdi', prenom: 'Giuseppe', email: 'giuseppe.verdi@dallelec.ch', telephone: '079 111 2222' },
      { nom: 'Neri', prenom: 'Antonio', email: 'antonio.neri@dallelec.ch', telephone: '079 333 4444' }
    ];

    for (const chef of chefDeChantiers) {
      await addDoc(collection(db, 'chefdechantiers'), chef);
    }

    // 5. Collaborateurs
    console.log('👥 Creazione collaborateurs...');
    const collaborateurs = [
      { nom: 'Blu', prenom: 'Paolo', email: 'paolo.blu@dallelec.ch', telephone: '079 555 6666' },
      { nom: 'Verde', prenom: 'Marco', email: 'marco.verde@dallelec.ch', telephone: '079 777 8888' }
    ];

    for (const collab of collaborateurs) {
      await addDoc(collection(db, 'collaborateurs'), collab);
    }

    // 6. Familles produits
    console.log('📁 Creazione familles...');
    const familles = [
      { nom: 'Électricité générale', ordre: 1 },
      { nom: 'Éclairage', ordre: 2 },
      { nom: 'Prises et interrupteurs', ordre: 3 },
      { nom: 'Tableaux électriques', ordre: 4 }
    ];

    const familleIds = [];
    for (const famille of familles) {
      const docRef = await addDoc(collection(db, 'familles'), famille);
      familleIds.push(docRef.id);
    }

    // 7. Sous-familles
    console.log('📂 Creazione sous-familles...');
    const sousFamilles = [
      { nom: 'Installation', familleId: familleIds[0], ordre: 1 },
      { nom: 'Maintenance', familleId: familleIds[0], ordre: 2 },
      { nom: 'LED', familleId: familleIds[1], ordre: 1 },
      { nom: 'Halogène', familleId: familleIds[1], ordre: 2 }
    ];

    for (const sousFamille of sousFamilles) {
      await addDoc(collection(db, 'sousfamilles'), sousFamille);
    }

    // 8. Configuration de base
    console.log('⚙️ Creazione configuration...');
    await setDoc(doc(db, 'configuration', 'regies'), {
      prixDefault: 65,
      currency: 'CHF',
      tvaDefault: 7.7
    });

    console.log('✅ Ripristino completato!');
    console.log('');
    console.log('🔑 CREDENZIALI ADMIN:');
    console.log('Email: admin@dallelec.ch');
    console.log('Password: Admin123!');
    console.log('');
    console.log('Email: manager@dallelec.ch');
    console.log('Password: Manager123!');
    console.log('');
    console.log('🔄 Riavvia l\'applicazione e fai login con le credenziali sopra.');

  } catch (error) {
    console.error('❌ Errore durante il ripristino:', error);
  }
};

restoreEssentialData();