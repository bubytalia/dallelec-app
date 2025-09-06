// Firebase Cloud Function per backup automatico
// Da deployare con: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

admin.initializeApp();
const storage = new Storage();

exports.scheduledBackup = functions.pubsub
  .schedule('0 2 * * 0') // Ogni domenica alle 2:00
  .timeZone('Europe/Zurich')
  .onRun(async (context) => {
    const projectId = 'dallelec-gestion-58a49';
    const bucket = `${projectId}.appspot.com`;
    const timestamp = new Date().toISOString().split('T')[0];
    const outputUriPrefix = `gs://${bucket}/backups/backup-${timestamp}`;

    try {
      const client = new admin.firestore.v1.FirestoreAdminClient();
      const databaseName = client.databasePath(projectId, '(default)');

      const [operation] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: outputUriPrefix,
        collectionIds: [] // Esporta tutte le collezioni
      });

      console.log(`✅ Backup avviato: ${outputUriPrefix}`);
      return operation;
    } catch (error) {
      console.error('❌ Errore backup:', error);
      throw error;
    }
  });

// Funzione per pulizia backup vecchi (mantiene ultimi 30 giorni)
exports.cleanupOldBackups = functions.pubsub
  .schedule('0 3 * * 0') // Ogni domenica alle 3:00
  .onRun(async (context) => {
    const bucket = storage.bucket('dallelec-gestion-58a49.appspot.com');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const [files] = await bucket.getFiles({ prefix: 'backups/' });
      
      for (const file of files) {
        if (file.metadata.timeCreated < thirtyDaysAgo.toISOString()) {
          await file.delete();
          console.log(`🗑️ Eliminato backup vecchio: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Errore pulizia backup:', error);
    }
  });