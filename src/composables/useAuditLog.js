import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useFirebase } from './useFirebase'
import { useAuth } from './useAuth'

export function useAuditLog() {
  const { db } = useFirebase()
  const { user } = useAuth()

  const logAction = async (action, resource, details = {}) => {
    try {
      const logEntry = {
        timestamp: serverTimestamp(),
        userId: user.value?.uid || 'anonymous',
        userEmail: user.value?.email || 'unknown',
        action: encodeURIComponent(action),
        resource: encodeURIComponent(resource),
        details: Object.keys(details).reduce((acc, key) => {
          acc[key] = typeof details[key] === 'string' 
            ? encodeURIComponent(details[key]) 
            : details[key]
          return acc
        }, {}),
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent.substring(0, 200) // Limitato per sicurezza
      }

      await addDoc(collection(db, 'audit_log'), logEntry)
    } catch (error) {
      console.error('Audit log error:', encodeURIComponent(error.message))
    }
  }

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  // Wrapper per operazioni critiche
  const withAudit = async (action, resource, operation, details = {}) => {
    const startTime = Date.now()
    
    try {
      const result = await operation()
      
      await logAction(action, resource, {
        ...details,
        status: 'success',
        duration: Date.now() - startTime
      })
      
      return result
    } catch (error) {
      await logAction(action, resource, {
        ...details,
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      })
      
      throw error
    }
  }

  return {
    logAction,
    withAudit
  }
}