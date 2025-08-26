import { ref } from 'vue'
import { supabase } from '../supabase.js'

const user = ref(null)
const loading = ref(false)

export function useAuth() {
  
  const login = async (email, password) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      user.value = data.user
      return data.user
    } catch (error) {
      console.error('Login error:', error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      user.value = null
    } catch (error) {
      console.error('Logout error:', error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  const getCurrentUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    user.value = currentUser
    return currentUser
  }

  // Ascolta cambiamenti di autenticazione
  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null
  })

  return {
    user,
    loading,
    login,
    logout,
    getCurrentUser
  }
}