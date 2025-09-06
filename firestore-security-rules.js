// Regole Firestore per prevenire cancellazioni massive
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regola generale: solo utenti autenticati
    match /{document=**} {
      allow read, write: if request.auth != null;
      
      // Previeni cancellazione di più di 10 documenti in 1 minuto
      allow delete: if request.auth != null 
        && resource.data.deletedBy == null // Non già cancellato
        && request.time < resource.data.lastDelete + duration.value(60, 's'); // Rate limit
    }
    
    // Protezione extra per collezioni critiche
    match /clients/{clientId} {
      allow delete: if request.auth.token.role == 'admin';
    }
    
    match /devis/{devisId} {
      allow delete: if request.auth.token.role == 'admin';
    }
    
    match /factures/{factureId} {
      allow delete: if false; // Mai cancellare fatture
    }
    
    // Log delle operazioni critiche
    match /audit_log/{logId} {
      allow create: if request.auth != null;
      allow read: if request.auth.token.role == 'admin';
      allow update, delete: if false; // Log immutabili
    }
  }
}