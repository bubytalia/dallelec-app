import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

// Configurazione Firebase
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

async function restoreBackup() {
  try {
    // CAMBIA QUESTO PATH con il percorso del tuo file backup
    const backupPath = './dallelec-backup-2025-08-26-19-31-34.json';
    
    console.log('📖 Leggendo backup...');
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log('🚀 Iniziando ripristino...');
    
    for (const [collectionName, documents] of Object.entries(backupData.data)) {
      console.log(`📦 Ripristinando ${collectionName}...`);
      
      for (const document of documents) {
        const { id, ...data } = document;
        await setDoc(doc(db, collectionName, id), data);
      }
      
      console.log(`✅ ${collectionName}: ${documents.length} documenti ripristinati`);
    }
    
    console.log('🎉 Ripristino completato!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

restoreBackup();