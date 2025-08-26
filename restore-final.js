import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

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