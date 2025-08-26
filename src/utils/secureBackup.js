import { db } from '@/firebase'
import { collection, getDocs } from 'firebase/firestore'

export class SecureBackup {
  static async createFullBackup() {
    const timestamp = new Date().toISOString().split('T')[0]
    const timeString = new Date().toLocaleTimeString('it-IT').replace(/:/g, '-')
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    }

    const collections = [
      'clients', 'chantiers', 'devis', 'produits', 'supplements', 
      'techniciens', 'collaborateurs', 'chefdechantiers', 'familles', 
      'sousfamilles', 'zones', 'factures', 'heures', 'configuration'
    ]

    try {
      for (const collectionName of collections) {
        console.log(`🔄 Backup ${collectionName}...`)
        const snapshot = await getDocs(collection(db, collectionName))
        backup.data[collectionName] = []
        
        snapshot.docs.forEach(doc => {
          backup.data[collectionName].push({
            id: doc.id,
            ...doc.data()
          })
        })
      }

      const filename = `dallelec-backup-${timestamp}-${timeString}.json`
      const backupJson = JSON.stringify(backup, null, 2)
      const blob = new Blob([backupJson], { type: 'application/json' })
      
      // Salva backup locale
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      
      // Salva anche in localStorage come backup di emergenza
      localStorage.setItem('lastBackup', JSON.stringify({
        timestamp: backup.timestamp,
        filename: `dallelec-backup-${timestamp}-${timeString}.json`,
        dataCount: Object.values(backup.data).reduce((sum, arr) => sum + arr.length, 0)
      }))
      
      console.log(`✅ Backup completato: ${backup.timestamp}`)
      return { 
        success: true, 
        filename,
        dataCount: Object.values(backup.data).reduce((sum, arr) => sum + arr.length, 0),
        cloudBackup: false
      }
      
    } catch (error) {
      console.error('❌ Errore backup:', error)
      return { success: false, error: error.message }
    }
  }

  static scheduleAutoBackup() {
    // Backup automatico ogni giorno alle 2:00
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(2, 0, 0, 0)
    
    const timeUntilBackup = tomorrow.getTime() - now.getTime()
    
    setTimeout(() => {
      this.createFullBackup()
      // Riprogramma per il giorno successivo
      setInterval(() => this.createFullBackup(), 24 * 60 * 60 * 1000)
    }, timeUntilBackup)
    
    console.log(`🕐 Prossimo backup automatico: ${tomorrow.toLocaleString()}`)
  }

  static getLastBackupInfo() {
    const lastBackup = localStorage.getItem('lastBackup')
    return lastBackup ? JSON.parse(lastBackup) : null
  }

  static async getCloudBackups() {
    // Cloud backup non disponibile - solo backup locali
    console.log('ℹ️ Cloud backup non configurato - solo backup locali disponibili')
    return []
  }
}