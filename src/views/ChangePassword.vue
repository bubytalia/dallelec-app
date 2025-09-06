<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card p-4 shadow-sm" style="max-width: 500px; width: 100%;">
      <h2 class="text-center mb-4">🔐 Changement de mot de passe requis</h2>
      
      <div class="alert alert-warning">
        <strong>Premier connexion détectée!</strong><br>
        Pour votre sécurité, vous devez changer votre mot de passe.
      </div>
      
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <div v-if="success" class="alert alert-success">
        {{ success }}
      </div>
      
      <form @submit.prevent="changePassword">
        <div class="mb-3">
          <label class="form-label">Mot de passe actuel</label>
          <input 
            type="password" 
            v-model="currentPassword" 
            class="form-control" 
            required 
            placeholder="Votre mot de passe actuel"
          />
        </div>
        
        <div class="mb-3">
          <label class="form-label">Nouveau mot de passe</label>
          <input 
            type="password" 
            v-model="newPassword" 
            class="form-control" 
            required 
            minlength="6"
            placeholder="Minimum 6 caractères"
          />
        </div>
        
        <div class="mb-3">
          <label class="form-label">Confirmer nouveau mot de passe</label>
          <input 
            type="password" 
            v-model="confirmPassword" 
            class="form-control" 
            required 
            placeholder="Répétez le nouveau mot de passe"
          />
        </div>
        
        <button type="submit" class="btn btn-primary w-100" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Changement...' : 'Changer le mot de passe' }}
        </button>
      </form>
      
      <div class="text-center mt-3">
        <button @click="logout" class="btn btn-link text-muted">
          Se déconnecter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from 'firebase/auth'
import { auth, db } from '@/firebase'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'

const router = useRouter()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const changePassword = async () => {
  error.value = ''
  success.value = ''
  
  // Validazioni
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Les nouveaux mots de passe ne correspondent pas'
    return
  }
  
  if (newPassword.value.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caractères'
    return
  }
  
  if (newPassword.value === currentPassword.value) {
    error.value = 'Le nouveau mot de passe doit être différent de l\'ancien'
    return
  }
  
  loading.value = true
  
  try {
    const user = auth.currentUser
    if (!user) {
      error.value = 'Utilisateur non connecté'
      return
    }
    
    // Re-autenticazione con password corrente
    const credential = EmailAuthProvider.credential(user.email, currentPassword.value)
    await reauthenticateWithCredential(user, credential)
    
    // Cambio password
    await updatePassword(user, newPassword.value)
    
    // Aggiorna firstLogin a false nel database
    await updateFirstLoginFlag(user.email)
    
    success.value = 'Mot de passe changé avec succès! Redirection...'
    
    // Redirect dopo 2 secondi
    setTimeout(() => {
      redirectToUserDashboard(user.email)
    }, 2000)
    
  } catch (error) {
    console.error('Erreur changement mot de passe:', error)
    if (error.code === 'auth/wrong-password') {
      error.value = 'Mot de passe actuel incorrect'
    } else if (error.code === 'auth/weak-password') {
      error.value = 'Le nouveau mot de passe est trop faible'
    } else {
      error.value = 'Erreur lors du changement: ' + error.message
    }
  } finally {
    loading.value = false
  }
}

const updateFirstLoginFlag = async (email) => {
  try {
    // Trova l'utente nelle collections e aggiorna firstLogin
    const collections = ['admins', 'chefdechantiers', 'collaborateurs']
    
    for (const collectionName of collections) {
      const q = query(collection(db, collectionName), where('email', '==', email))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0]
        await updateDoc(doc(db, collectionName, userDoc.id), {
          firstLogin: false
        })
        break
      }
    }
  } catch (error) {
    console.error('Errore aggiornamento firstLogin:', error)
  }
}

const redirectToUserDashboard = async (email) => {
  try {
    // Determina il tipo di utente per redirect
    const collections = [
      { name: 'admins', route: '/admin' },
      { name: 'chefdechantiers', route: '/chef' },
      { name: 'collaborateurs', route: '/ouvrier' }
    ]
    
    for (const col of collections) {
      const q = query(collection(db, col.name), where('email', '==', email))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        router.push(col.route)
        return
      }
    }
    
    // Fallback
    router.push('/')
  } catch (error) {
    console.error('Errore redirect:', error)
    router.push('/')
  }
}

const logout = async () => {
  try {
    await signOut(auth)
    router.push('/')
  } catch (error) {
    console.error('Errore logout:', error)
  }
}
</script>

<style scoped>
.card {
  border: none;
  border-radius: 10px;
}

.alert {
  border-radius: 8px;
}

.btn {
  border-radius: 8px;
}
</style>