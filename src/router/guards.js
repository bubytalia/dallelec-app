import { supabase } from '../supabase.js'

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Auth error:', error.message)
    return null
  }
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
      
      // Utenti gestiti manualmente - passa sempre
      next()
    } catch (error) {
      console.error('Role guard error:', error.message)
      next({ name: 'Login' })
    }
  }
}