<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card p-4 shadow-sm" style="max-width: 400px; width: 100%;">
      <h2 class="text-center mb-4">Connexion</h2>
      
      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>
      
      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="email" class="form-label">Adresse e-mail</label>
          <input type="email" v-model="email" class="form-control" id="email" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Mot de passe</label>
          <input type="password" v-model="password" class="form-control" id="password" required />
        </div>
        <button type="submit" class="btn btn-primary w-100" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default {
  name: 'Login',
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      error: ''
    };
  },
  methods: {
    async handleLogin() {
      if (!this.email || !this.password) {
        this.error = 'Veuillez saisir email et mot de passe';
        return;
      }
      
      this.loading = true;
      this.error = '';
      
      try {
        // Autenticazione Firebase
        const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
        const user = userCredential.user;
        
        // Determina il tipo di utente dall'anagrafica
        const userType = await this.getUserType(user.email);
        
        // Redirect basato sul tipo
        if (userType === 'admin') {
          this.$router.push('/admin');
        } else if (userType === 'chef') {
          this.$router.push('/chef');
        } else if (userType === 'ouvrier') {
          this.$router.push('/ouvrier');
        } else {
          this.error = 'Utilisateur non autorisé';
          await auth.signOut();
        }
        
      } catch (error) {
        console.error('Erreur login:', error);
        if (error.code === 'auth/user-not-found') {
          this.error = 'Utilisateur non trouvé';
        } else if (error.code === 'auth/wrong-password') {
          this.error = 'Mot de passe incorrect';
        } else if (error.code === 'auth/invalid-email') {
          this.error = 'Email invalide';
        } else {
          this.error = 'Erreur de connexion';
        }
      } finally {
        this.loading = false;
      }
    },
    
    async getUserType(email) {
      // Verifica se è admin
      const adminsQuery = query(collection(db, 'admins'), where('email', '==', email));
      const adminsSnapshot = await getDocs(adminsQuery);
      if (!adminsSnapshot.empty) {
        return 'admin';
      }
      
      // Verifica se è chef de chantier
      const chefsQuery = query(collection(db, 'chefdechantiers'), where('email', '==', email));
      const chefsSnapshot = await getDocs(chefsQuery);
      if (!chefsSnapshot.empty) {
        return 'chef';
      }
      
      // Verifica se è collaboratore/ouvrier
      const collabQuery = query(collection(db, 'collaborateurs'), where('email', '==', email));
      const collabSnapshot = await getDocs(collabQuery);
      if (!collabSnapshot.empty) {
        return 'ouvrier';
      }
      
      return null; // Utente non riconosciuto
    }
  }
};
</script>
