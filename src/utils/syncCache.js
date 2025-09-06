import { db } from '@/firebase'
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'

export class CacheSync {
  static async syncCacheToFirestore() {
    const collections = [
      'clients', 'chantiers', 'produits', 'techniciens', 
      'collaborateurs', 'chefdechantiers', 'interimaires',
      'familles', 'sousfamilles', 'supplements'
    ]

    const results = []

    for (const collectionName of collections) {
      try {
        console.log(`🔄 Sincronizzando ${collectionName}...`)
        
        // Leggi dalla cache/offline
        const snapshot = await getDocs(collection(db, collectionName))
        let count = 0
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data()
          
          // Forza scrittura su Firestore
          await setDoc(doc(db, collectionName, docSnapshot.id), data, { merge: true })
          count++
        }
        
        results.push({ collection: collectionName, synced: count })
        console.log(`✅ ${collectionName}: ${count} documenti sincronizzati`)
        
      } catch (error) {
        console.error(`❌ Errore ${collectionName}:`, error)
        results.push({ collection: collectionName, error: error.message })
      }
    }
    
    return results
  }
}