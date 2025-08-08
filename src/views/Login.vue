<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card p-4 shadow-sm" style="max-width: 400px; width: 100%;">
      <h2 class="text-center mb-4">Connexion</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="email" class="form-label">Adresse e-mail</label>
          <input type="email" v-model="email" class="form-control" id="email" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Mot de passe</label>
          <input type="password" v-model="password" class="form-control" id="password" required />
        </div>
        <button type="submit" class="btn btn-primary w-100">Se connecter</button>
      </form>
    </div>
  </div>
</template>

<script>
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';

export default {
  name: 'Login',
  data() {
    return {
      email: '',
      password: ''
    };
  },
  methods: {
    async handleLogin() {
      try {
        await signInWithEmailAndPassword(auth, this.email, this.password);
        
        // Determina il ruolo basato sull'email
        const role = this.getUserRole(this.email);
        
        // Reindirizza al dashboard appropriato
        if (role === 'chef') {
          this.$router.push('/chef');
        } else if (role === 'ouvrier') {
          this.$router.push('/ouvrier');
        } else {
          this.$router.push('/admin');
        }
      } catch (error) {
        alert('Erreur de connexion : ' + error.message);
      }
    },
    
    getUserRole(email) {
      if (email.includes('chef@dallelec.com')) {
        return 'chef';
      } else if (email.includes('ouvrier@dallelec.com')) {
        return 'ouvrier';
      } else if (email.includes('admin@dallelec.com')) {
        return 'admin';
      }
      return 'admin'; // default
    }
  }
};
</script>
