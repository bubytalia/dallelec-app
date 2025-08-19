import { inject } from 'vue'

export function useFirebase() {
  const auth = inject('auth')
  const db = inject('db')
  
  if (!auth || !db) {
    throw new Error('Firebase services not available. Make sure Firebase is properly initialized.')
  }
  
  return { auth, db }
}