import { ref, computed } from 'vue'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { useFirebase } from './useFirebase'
import { useErrorHandler } from './useErrorHandler'

const user = ref(null)
const isAuthenticated = computed(() => !!user.value)
const loginAttempts = ref(new Map())
const sessionTimeout = ref(null)

export function useAuth() {
  const { auth } = useFirebase()
  const { handleError } = useErrorHandler()

  // Rate limiting per login
  const checkRateLimit = (email) => {
    const now = Date.now()
    const attempts = loginAttempts.value.get(email) || []
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000) // 15 minuti
    
    if (recentAttempts.length >= 5) {
      throw new Error('Troppi tentativi di login. Riprova tra 15 minuti.')
    }
    
    attempts.push(now)
    loginAttempts.value.set(email, attempts)
  }

  // Session timeout (30 minuti di inattività)
  const resetSessionTimeout = () => {
    if (sessionTimeout.value) {
      clearTimeout(sessionTimeout.value)
    }
    
    sessionTimeout.value = setTimeout(() => {
      logout()
      alert('Sessione scaduta per inattività. Effettua nuovamente il login.')
    }, 30 * 60 * 1000) // 30 minuti
  }

  const login = async (email, password) => {
    try {
      checkRateLimit(email)
      
      const sanitizedEmail = email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
        throw new Error('Email non valida')
      }

      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password)
      user.value = userCredential.user
      
      // Reset rate limiting on successful login
      loginAttempts.value.delete(sanitizedEmail)
      
      // Start session timeout
      resetSessionTimeout()
      
      // Log successful login
      console.log(`✅ Login successful: ${encodeURIComponent(sanitizedEmail)}`)
      
      return userCredential
    } catch (error) {
      handleError(error, 'login')
      throw error
    }
  }

  const logout = async () => {
    try {
      if (sessionTimeout.value) {
        clearTimeout(sessionTimeout.value)
      }
      
      await signOut(auth)
      user.value = null
      
      console.log('✅ Logout successful')
    } catch (error) {
      handleError(error, 'logout')
      throw error
    }
  }

  // Monitor auth state
  onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser
    if (firebaseUser) {
      resetSessionTimeout()
    }
  })

  // Reset session timeout on user activity
  const resetOnActivity = () => {
    if (isAuthenticated.value) {
      resetSessionTimeout()
    }
  }

  // Listen for user activity
  if (typeof window !== 'undefined') {
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetOnActivity, { passive: true })
    })
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    resetSessionTimeout
  }
}