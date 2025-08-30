<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card p-4 shadow-sm" style="max-width: 400px; width: 100%;">
      <h2 class="text-center mb-4">Inscription</h2>
      
      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>
      
      <div v-if="success" class="alert alert-success" role="alert">
        {{ success }}
      </div>
      
      <form @submit.prevent="handleRegister">
        <div class="mb-3">
          <label for="name" class="form-label">Nom complet</label>
          <input type="text" v-model="name" class="form-control" id="name" required />
        </div>
        <div class="mb-3">
          <label for="email" class="form-label">Adresse e-mail</label>
          <input type="email" v-model="email" class="form-control" id="email" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Mot de passe</label>
          <input type="password" v-model="password" class="form-control" id="password" required minlength="6" />
        </div>
        <div class="mb-3">
          <label for="role" class="form-label">Rôle</label>
          <select v-model="role" class="form-control" id="role" required>
            <option value="">Sélectionner un rôle</option>
            <option value="admin">Administrateur</option>
            <option value="chef">Chef de chantier</option>
            <option value="ouvrier">Ouvrier</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary w-100" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Inscription...' : 'S\'inscrire' }}
        </button>
      </form>
      
      <div class="text-center mt-3">
        <router-link to="/login" class="text-decoration-none">
          Déjà un compte ? Se connecter
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase.js';

export default {
  name: 'Register',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      role: '',
      loading: false,
      error: '',
      success: ''
    };
  },
  methods: {
    async handleRegister() {
      if (!this.name || !this.email || !this.password || !this.role) {
        this.error = 'Veuillez remplir tous les champs';
        return;
      }
      
      if (this.password.length < 6) {
        this.error = 'Le mot de passe doit contenir au moins 6 caractères';
        return;
      }
      
      this.loading = true;
      this.error = '';
      this.success = '';
      
      try {
        // Registrazione Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: this.email,
          password: this.password
        });
        
        if (error) {
          throw error;
        }
        
        if (data.user) {
          // Salva i dati utente nella tabella users
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                email: this.email,
                name: this.name,
                role: this.role,
                created_at: new Date().toISOString()
              }
            ]);
          
          if (insertError) {
            console.error('Errore inserimento utente:', insertError);
            // Non bloccare la registrazione per questo errore
          }
          
          this.success = 'Inscription réussie ! Vous pouvez maintenant vous connecter.';
          
          // Redirect al login dopo 2 secondi
          setTimeout(() => {
            this.$router.push('/login');
          }, 2000);
        }
        
      } catch (error) {
        console.error('Erreur inscription:', error);
        
        // Messaggi di errore user-friendly
        if (error.message === 'User already registered') {
          this.error = 'Cette adresse email est déjà utilisée';
        } else if (error.message.includes('Password')) {
          this.error = 'Le mot de passe ne respecte pas les critères requis';
        } else {
          this.error = error.message || 'Erreur lors de l\'inscription';
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>