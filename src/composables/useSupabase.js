import { ref } from 'vue'
import { supabase } from '../supabase.js'

export function useSupabase() {
  const loading = ref(false)
  const error = ref(null)

  // Funzioni per clients
  const getClients = async () => {
    loading.value = true
    try {
      const { data, error: supabaseError } = await supabase
        .from('clients')
        .select('*')
        .order('nom')
      
      if (supabaseError) throw supabaseError
      return data
    } catch (err) {
      error.value = err.message
      return []
    } finally {
      loading.value = false
    }
  }

  const addClient = async (clientData) => {
    loading.value = true
    try {
      const { data, error: supabaseError } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
      
      if (supabaseError) throw supabaseError
      return data[0]
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Funzioni per produits
  const getProduits = async () => {
    loading.value = true
    try {
      const { data, error: supabaseError } = await supabase
        .from('produits')
        .select('*')
        .order('article')
      
      if (supabaseError) throw supabaseError
      return data
    } catch (err) {
      error.value = err.message
      return []
    } finally {
      loading.value = false
    }
  }

  // Funzioni per techniciens
  const getTechniciens = async () => {
    loading.value = true
    try {
      const { data, error: supabaseError } = await supabase
        .from('techniciens')
        .select('*')
        .order('nom')
      
      if (supabaseError) throw supabaseError
      return data
    } catch (err) {
      error.value = err.message
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    getClients,
    addClient,
    getProduits,
    getTechniciens
  }
}