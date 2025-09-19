import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Prova a deployare le regole via codice
console.log('🔧 Tentativo deploy regole...');

// Le regole sono già nel file firestore.rules
// Esegui: firebase deploy --only firestore:rules