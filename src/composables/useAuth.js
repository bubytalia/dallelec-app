import { ref } from 'vue'
import { auth } from '../firebase.js'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'

const user = ref(null)
const loading = ref(false)

export function useAuth() {
  
  const login = async (email, password) => {
    loading.value = true
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return userCredential.user
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
      await signOut(auth)
      user.value = null
    } catch (error) {
      console.error('Logout error:', error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  const getCurrentUser = () => {
    return auth.currentUser
  }

  // Ascolta cambiamenti di autenticazione
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })

  return {
    user,
    loading,
    login,
    logout,
    getCurrentUser
  }
}