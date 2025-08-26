import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDPv93V4Gj7J6C27MCW7aNpuymPDoTE2sw",
  authDomain: "dallelec-app-new.firebaseapp.com",
  projectId: "dallelec-app-new",
  storageBucket: "dallelec-app-new.firebasestorage.app",
  messagingSenderId: "20956978951",
  appId: "1:20956978951:web:0d882b21c7a38e8ffe2fa2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function createAdmin() {
  try {
    console.log('👤 Creando utente admin...');
    
    // Crea utente in Authentication (se non esiste già)
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, 'admin@dallelec.com', 'admin123');
      console.log('✅ Utente creato in Authentication');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Utente già esistente in Authentication');
        // Simula l'UID per utente esistente
        userCredential = { user: { uid: 'admin-uid-placeholder' } };
      } else {
        throw error;
      }
    }

    // Aggiungi utente alla collezione admins
    const adminData = {
      email: 'admin@dallelec.com',
      nome: 'Admin',
      cognome: 'Dallelec',
      ruolo: 'admin',
      createdAt: new Date(),
      active: true
    };

    // Usa un UID fisso per l'admin
    const adminUID = 'admin-dallelec-uid';
    await setDoc(doc(db, 'admins', adminUID), adminData);
    
    console.log('✅ Admin aggiunto alla collezione admins');
    console.log('🎉 Admin creato con successo!');
    console.log('📧 Email: admin@dallelec.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

createAdmin();