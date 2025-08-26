import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyBNfMeKJqu9XvZ51kxpcZEi9m0DHTfxRkw",
  authDomain: "dallelec-gestion-new.firebaseapp.com",
  projectId: "dallelec-gestion-new",
  storageBucket: "dallelec-gestion-new.firebasestorage.app",
  messagingSenderId: "236593705834",
  appId: "1:236593705834:web:fa826d6f7f71b6b648ab13"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function restoreBackup() {
  try {
    console.log('📖 Leggendo backup...\n');
    const backup = JSON.parse(fs.readFileSync('dallelec-backup-2025-08-26-19-31-34.json', 'utf8'));
    const data = backup.data;

    console.log('🚀 Iniziando ripristino...\n');

    for (const [collectionName, documents] of Object.entries(data)) {
      console.log(`📦 Ripristinando ${collectionName}...`);
      
      const collectionRef = collection(db, collectionName);
      
      for (const document of documents) {
        const { id, ...docData } = document;
        await setDoc(doc(collectionRef, id), docData);
      }
      
      console.log(`✅ ${collectionName}: ${documents.length} documenti ripristinati\n`);
    }

    console.log('🎉 Ripristino completato!');
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

restoreBackup();