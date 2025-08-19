import { auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe()
      resolve(user)
    }, reject)
  })
}

export const requireAuth = async (to, from, next) => {
  try {
    const user = await getCurrentUser()
    if (user) {
      next()
    } else {
      next({ name: 'Login' })
    }
  } catch (error) {
    console.error('Auth guard error:', encodeURIComponent(error.message))
    next({ name: 'Login' })
  }
}

export const requireRole = (allowedRoles) => {
  return async (to, from, next) => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        next({ name: 'Login' })
        return
      }
      
      // Qui dovresti verificare il ruolo dell'utente dal database
      // Per ora assumiamo che il ruolo sia nel path
      const userRole = to.path.split('/')[1] // admin, chef, ouvrier
      
      if (allowedRoles.includes(userRole)) {
        next()
      } else {
        next({ name: 'Login' })
      }
    } catch (error) {
      console.error('Role guard error:', encodeURIComponent(error.message))
      next({ name: 'Login' })
    }
  }
}