import { supabase } from '../supabase.js'

// Keep-alive per evitare cold start
export function useSupabaseKeepAlive() {
  const keepAlive = async () => {
    try {
      await supabase.from('clients').select('id').limit(1)
    } catch (error) {
      console.log('Keep-alive ping')
    }
  }

  // Ping ogni 4 minuti
  setInterval(keepAlive, 240000)
  
  return { keepAlive }
}