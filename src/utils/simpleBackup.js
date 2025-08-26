import { supabase } from '@/supabase'

export class SimpleBackup {
  static async createBackup() {
    const now = new Date()
    const timestamp = now.toISOString().split('T')[0]
    const timeString = now.toLocaleTimeString('it-IT').replace(/:/g, '-')
    
    const backup = {
      timestamp: now.toISOString(),
      version: '1.0',
      data: {}
    }

    const collections = [
      'clients', 'chantiers', 'devis', 'produits', 'supplements', 
      'techniciens', 'familles', 'sousfamilles'
    ]

    try {
      for (const collectionName of collections) {
        console.log(`📦 Backup ${collectionName}...`)
        try {
          const { data, error } = await supabase.from(collectionName).select('*')
          
          if (error) {
            console.warn(`⚠️ Errore backup ${collectionName}:`, error.message)
            backup.data[collectionName] = []
          } else {
            backup.data[collectionName] = data || []
          }
        } catch (collectionError) {
          console.warn(`⚠️ Errore backup ${collectionName}:`, collectionError.message)
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
      console.log(`✅ Backup completato: ${encodeURIComponent(filename)} (${dataCount} records)`)
      
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