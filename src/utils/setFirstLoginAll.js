// Script per impostare firstLogin: true a tutti gli account esistenti
import { db } from '@/firebase'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'

export const setFirstLoginForAllUsers = async () => {
  console.log('🔄 Inizio aggiornamento firstLogin per tutti gli utenti...')
  
  const collections = ['admins', 'chefdechantiers', 'collaborateurs']
  let totalUpdated = 0
  
  try {
    for (const collectionName of collections) {
      console.log(`📋 Aggiornamento collection: ${collectionName}`)
      
      const snapshot = await getDocs(collection(db, collectionName))
      const users = snapshot.docs
      
      console.log(`👥 Trovati ${users.length} utenti in ${collectionName}`)
      
      for (const userDoc of users) {
        const userData = userDoc.data()
        
        // Aggiorna solo se firstLogin non esiste o è false
        if (userData.firstLogin === undefined || userData.firstLogin === false) {
          await updateDoc(doc(db, collectionName, userDoc.id), {
            firstLogin: true
          })
          
          console.log(`✅ Aggiornato: ${userData.email || userData.nom}`)
          totalUpdated++
        } else {
          console.log(`⏭️ Saltato (già firstLogin=true): ${userData.email || userData.nom}`)
        }
      }
    }
    
    console.log(`🎉 Completato! ${totalUpdated} utenti aggiornati con firstLogin: true`)
    return { success: true, updated: totalUpdated }
    
  } catch (error) {
    console.error('❌ Errore durante aggiornamento:', error)
    return { success: false, error: error.message }
  }
}