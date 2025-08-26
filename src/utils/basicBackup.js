import { db } from '@/firebase'
import { collection, getDocs } from 'firebase/firestore'

export class BasicBackup {
  static async createBackup() {
    const timestamp = new Date().toISOString().split('T')[0]
    const timeString = new Date().toLocaleTimeString('it-IT').replace(/:/g, '-')
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    }

    // Solo collezioni base accessibili a tutti gli utenti autenticati
    const collections = ['clients', 'chantiers', 'devis', 'produits', 'supplements', 'techniciens']

    try {
      for (const collectionName of collections) {
        console.log(`📦 Backup ${collectionName}...`)
        try {
          const snapshot = await getDocs(collection(db, collectionName))
          backup.data[collectionName] = []
          
          snapshot.docs.forEach(doc => {
            backup.data[collectionName].push({
              id: doc.id,
              ...doc.data()
            })
          })
          console.log(`✅ ${collectionName}: ${backup.data[collectionName].length} records`)
        } catch (error) {
          console.warn(`⚠️ Skipping ${collectionName}: ${error.message}`)
          backup.data[collectionName] = []
        }
      }

      const filename = `dallelec-backup-${timestamp}-${timeString}.json`
      const backupJson = JSON.stringify(backup, null, 2)
      const blob = new Blob([backupJson], { type: 'application/json' })
      
      // Download diretto
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      const dataCount = Object.values(backup.data).reduce((sum, arr) => sum + arr.length, 0)
      console.log(`✅ Backup completato: ${filename} (${dataCount} records)`)
      
      localStorage.setItem('lastBackup', `${new Date().toLocaleString()} - ${dataCount} records`)
      
      return { 
        success: true, 
        filename,
        dataCount
      }
      
    } catch (error) {
      console.error('❌ Errore backup:', error)
      return { success: false, error: error.message }
    }
  }
}