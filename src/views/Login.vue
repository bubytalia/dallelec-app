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
      
      <div class="text-center mt-3">
        <router-link to="/register" class="text-decoration-none">
          Pas encore de compte ? S'inscrire
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase.js';
import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase con credenziali dirette
const supabaseUrl = 'https://aumhdoiwtichjlvbrnrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

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
        // AUTENTICAZIONE SUPABASE REALE
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: this.email,
          password: this.password
        });
        
        if (error) {
          throw error;
        }
        
        if (!data.user) {
          throw new Error('Errore di autenticazione');
        }
        
        // Ottieni il ruolo dell'utente dal database
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .select('role, name')
          .eq('email', this.email)
          .single();
        
        let role = 'ouvrier'; // Default
        let userName = data.user.email;
        
        if (userData && !userError) {
          role = userData.role || 'ouvrier';
          userName = userData.name || data.user.email;
        }
        
        // Salva i dati utente
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', userName);
        localStorage.setItem('userId', data.user.id);
        
        // Redirect basato sul ruolo
        switch (role) {
          case 'admin':
            this.$router.push('/admin');
            break;
          case 'chef':
            this.$router.push('/chef');
            break;
          case 'ouvrier':
            this.$router.push('/ouvrier');
            break;
          default:
            this.$router.push('/ouvrier'); // Default fallback
        }
        
      } catch (error) {
        console.error('Erreur login:', error);
        
        // Messaggi di errore user-friendly
        if (error.message === 'Invalid login credentials') {
          this.error = 'Email ou mot de passe incorrect';
        } else if (error.message === 'Email not confirmed') {
          this.error = 'Veuillez confirmer votre email';
        } else {
          this.error = error.message || 'Erreur de connexion';
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
