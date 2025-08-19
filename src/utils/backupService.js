import { db } from '@/firebase'
import { collection, getDocs } from 'firebase/firestore'

export class BackupService {
  static async createBackup() {
    const timestamp = new Date().toISOString().split('T')[0]
    const backup = {
      timestamp,
      data: {}
    }

    const collections = [
      'users', 'clients', 'chantiers', 'devis', 'produits', 
      'supplements', 'metrages', 'factures', 'collaborateurs',
      'heures', 'heuresChef', 'reportsMensuels'
    ]

    try {
      for (const collectionName of collections) {
        console.log(`📦 Backup collection: ${collectionName}`)
        const snapshot = await getDocs(collection(db, collectionName))
        backup.data[collectionName] = []
        
        snapshot.docs.forEach(doc => {
          backup.data[collectionName].push({
            id: doc.id,
            ...doc.data()
          })
        })
      }

      // Salva il backup come JSON
      const backupJson = JSON.stringify(backup, null, 2)
      const blob = new Blob([backupJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `dallelec-backup-${timestamp}.json`
      a.click()
      
      URL.revokeObjectURL(url)
      
      console.log(`✅ Backup completato: dallelec-backup-${timestamp}.json`)
      return { success: true, filename: `dallelec-backup-${timestamp}.json` }
      
    } catch (error) {
      console.error('❌ Errore backup:', error)
      return { success: false, error: error.message }
    }
  }

  static scheduleAutoBackup() {
    // Backup automatico ogni domenica alle 2:00
    const now = new Date()
    const nextSunday = new Date(now)
    nextSunday.setDate(now.getDate() + (7 - now.getDay()))
    nextSunday.setHours(2, 0, 0, 0)
    
    const timeUntilBackup = nextSunday.getTime() - now.getTime()
    
    setTimeout(() => {
      this.createBackup()
      // Riprogramma per la settimana successiva
      setInterval(() => this.createBackup(), 7 * 24 * 60 * 60 * 1000)
    }, timeUntilBackup)
    
    console.log(`🕐 Prossimo backup automatico: ${nextSunday.toLocaleString()}`)
  }
}