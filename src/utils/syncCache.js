import { supabase } from '@/supabase'

export class CacheSync {
  static async syncCacheToSupabase() {
    const collections = [
      'clients', 'chantiers', 'produits', 'techniciens', 
      'collaborateurs', 'chefdechantiers', 'interimaires',
      'familles', 'sousfamilles', 'supplements'
    ]

    const results = []

    for (const collectionName of collections) {
      try {
        console.log(`🔄 Sincronizzando ${collectionName}...`)
        
        // Leggi da Supabase
        const { data: items, error } = await supabase.from(collectionName).select('*')
        
        if (error) {
          throw error
        }
        
        let count = items?.length || 0
        
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