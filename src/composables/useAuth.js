import { ref } from 'vue'
import { supabase } from '../supabase.js'

const user = ref(null)
const loading = ref(false)
const userRole = ref(null)

// Rate limiting per login
const loginAttempts = ref(0)
const lastAttempt = ref(0)
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minuti

export function useAuth() {
  
  const login = async (email, password) => {
    // Rate limiting check
    const now = Date.now()
    if (loginAttempts.value >= MAX_ATTEMPTS && (now - lastAttempt.value) < LOCKOUT_TIME) {
      throw new Error('Troppi tentativi di login. Riprova tra 15 minuti.')
    }
    
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })
      
      if (error) {
        loginAttempts.value++
        lastAttempt.value = now
        throw error
      }
      
      // Reset attempts on success
      loginAttempts.value = 0
      
      user.value = data.user
      
      // Carica ruolo utente
      await loadUserRole(data.user.email)
      
      return data.user
    } catch (error) {
      console.error('Login error:', error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  const loadUserRole = async (email) => {
    // Ruoli gestiti manualmente - non caricare dal database
    userRole.value = 'user'
  }

  const logout = async () => {
    loading.value = true
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      user.value = null
      userRole.value = null
      localStorage.clear()
    } catch (error) {
      console.error('Logout error:', error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Get user error:', error.message)
      return null
    }
  }

  // Ascolta cambiamenti di autenticazione
  supabase.auth.onAuthStateChange(async (event, session) => {
    user.value = session?.user || null
    if (session?.user) {
      await loadUserRole(session.user.email)
    } else {
      userRole.value = null
    }
  })

  return {
    user,
    userRole,
    loading,
    login,
    logout,
    getCurrentUser
  }
}