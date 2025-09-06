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

  const updateClient = async (id, clientData) => {
    loading.value = true
    try {
      const { data, error: supabaseError } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
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

  const deleteClient = async (id) => {
    loading.value = true
    try {
      const { error: supabaseError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      
      if (supabaseError) throw supabaseError
      return true
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

  // Funzioni per chantiers
  const getChantiers = async () => {
    loading.value = true
    try {
      const { data, error: supabaseError } = await supabase
        .from('chantiers')
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

  // Funzioni per supplements
  const getSupplements = async () => {
    loading.value = true
    try {
      const { data, error: supabaseError } = await supabase
        .from('supplements')
        .select('*')
        .order('ordre')
      
      if (supabaseError) throw supabaseError
      return data
    } catch (err) {
      error.value = err.message
      return []
    } finally {
      loading.value = false
    }
  }

  // Funzioni per familles
  const getFamilles = async () => {
    loading.value = true
    try {
      const { data, error: supabaseError } = await supabase
        .from('familles')
        .select('*')
        .order('ordre')
      
      if (supabaseError) throw supabaseError
      return data
    } catch (err) {
      error.value = err.message
      return []
    } finally {
      loading.value = false
    }
  }

  // Funzioni per sousfamilles
  const getSousFamilles = async () => {
    loading.value = true
    try {
      const { data, error: supabaseError } = await supabase
        .from('sousfamilles')
        .select('*')
        .order('ordre')
      
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
    // Clients
    getClients,
    addClient,
    updateClient,
    deleteClient,
    // Produits
    getProduits,
    // Techniciens
    getTechniciens,
    // Chantiers
    getChantiers,
    // Supplements
    getSupplements,
    // Familles
    getFamilles,
    getSousFamilles
  }
}