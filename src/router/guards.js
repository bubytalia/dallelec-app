import { supabase } from '@/supabase'

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
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
      
      // Controlla il ruolo dal localStorage
      const userRole = localStorage.getItem('userRole')
      
      if (!userRole) {
        // Se non c'è ruolo, vai al login
        next({ name: 'Login' })
        return
      }
      
      if (allowedRoles.includes(userRole)) {
        next()
      } else {
        // Redirect al dashboard corretto per il ruolo
        switch (userRole) {
          case 'admin':
            next('/admin')
            break
          case 'chef':
            next('/chef')
            break
          case 'ouvrier':
            next('/ouvrier')
            break
          default:
            next({ name: 'Login' })
        }
      }
    } catch (error) {
      console.error('Role guard error:', encodeURIComponent(error.message))
      next({ name: 'Login' })
    }
  }
}