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
import { supabase } from '../supabase.js';

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
        // Autenticazione Supabase
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: this.email,
          password: this.password
        });
        
        if (authError) throw authError;
        
        // Determina ruolo controllando le anagrafiche
        let role = null;
        let userName = '';
        
        // Controlla se è admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('nom, prenom')
          .eq('email', this.email.toLowerCase())
          .single();
        
        if (adminData) {
          role = 'admin';
          userName = `${adminData.prenom} ${adminData.nom}`;
        } else {
          // Controlla se è chef de chantier
          const { data: chefData } = await supabase
            .from('chefdechantiers')
            .select('nom, prenom')
            .eq('email', this.email.toLowerCase())
            .single();
          
          if (chefData) {
            role = 'chef';
            userName = `${chefData.prenom} ${chefData.nom}`;
          } else {
            // Controlla se è ouvrier (collaborateur)
            const { data: ouvrierData } = await supabase
              .from('collaborateurs')
              .select('nom, prenom')
              .eq('email', this.email.toLowerCase())
              .single();
            
            if (ouvrierData) {
              role = 'ouvrier';
              userName = `${ouvrierData.prenom} ${ouvrierData.nom}`;
            }
          }
        }
        
        if (!role) {
          throw new Error('Accesso non autorizzato. Email non trovata nelle anagrafiche: ' + this.email);
        }
        
        // Salva il ruolo nel localStorage
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', this.email);
        localStorage.setItem('userName', userName);
        
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
            throw new Error('Ruolo utente non valido: ' + role);
        }
        
      } catch (error) {
        console.error('Erreur login:', error);
        this.error = error.message || 'Erreur de connexion';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
