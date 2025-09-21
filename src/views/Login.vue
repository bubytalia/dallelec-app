<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card p-4 shadow-sm" style="max-width: 400px; width: 100%;">
      <div class="text-center mb-4">
        <img src="@/assets/logo.jpg" alt="DALLELEC" class="mb-3" style="height: 60px;">
        <h2 class="text-primary">DALLELEC</h2>
        <p class="text-muted">Choisissez votre système</p>
      </div>
      
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
      </form>
      
      <hr class="my-4">
      
      <div class="row g-3">
        <div class="col-6">
          <div class="card h-100 border-primary">
            <div class="card-body text-center p-3">
              <i class="bi bi-gear-fill text-primary mb-2" style="font-size: 1.5rem;"></i>
              <h6 class="card-title mb-2">Gestionnaire</h6>
              <button type="submit" class="btn btn-primary btn-sm w-100" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                {{ loading ? 'Connexion...' : 'Accéder' }}
              </button>
            </div>
          </div>
        </div>
        <div class="col-6">
          <div class="card h-100 border-success">
            <div class="card-body text-center p-3">
              <i class="bi bi-box-seam-fill text-success mb-2" style="font-size: 1.5rem;"></i>
              <h6 class="card-title mb-2">Matériels</h6>
              <a href="https://ordini.dallelec.com" 
                 class="btn btn-success btn-sm w-100" 
                 target="_blank">
                Calcul Canaux
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div class="text-center mt-3">
        <small class="text-muted">Système de gestion intégré DALLELEC</small>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuth } from '../composables/useAuth.js';
import { supabase } from '../supabase.js';

export default {
  name: 'Login',
  setup() {
    const { login, loading } = useAuth();
    return { authLogin: login, authLoading: loading };
  },
  data() {
    return {
      email: '',
      password: '',
      error: ''
    };
  },
  computed: {
    loading() {
      return this.authLoading;
    }
  },
  methods: {
    async handleLogin() {
      if (!this.email || !this.password) {
        this.error = 'Veuillez saisir email et mot de passe';
        return;
      }
      
      this.error = '';
      
      try {
        // Usa il composable unificato
        const user = await this.authLogin(this.email, this.password);
        
        if (!user) {
          throw new Error('Errore di autenticazione');
        }
        
        // Cerca ruolo nelle anagrafiche (logica originale)
        let role = 'ouvrier'; // Default
        let userName = user.email;
        
        console.log('🔍 DEBUG LOGIN - Email:', this.email);
        
        try {
          // 1. Cerca in admins
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('nom, prenom, email')
            .eq('email', this.email)
            .maybeSingle();
          
          if (adminData && !adminError) {
            role = 'admin';
            userName = `${adminData.prenom} ${adminData.nom}`;
            console.log('✅ Trovato ADMIN:', userName);
          } else {
            // 2. Cerca in chefdechantiers
            const { data: chefData, error: chefError } = await supabase
              .from('chefdechantiers')
              .select('nom, prenom, email')
              .eq('email', this.email)
              .maybeSingle();
            
            if (chefData && !chefError) {
              role = 'chef';
              userName = `${chefData.prenom} ${chefData.nom}`;
              console.log('✅ Trovato CHEF:', userName);
            } else {
              // 3. Cerca in collaborateurs
              const { data: ouvrierData, error: ouvrierError } = await supabase
                .from('collaborateurs')
                .select('nom, prenom, email')
                .eq('email', this.email)
                .maybeSingle();
              
              if (ouvrierData && !ouvrierError) {
                role = 'ouvrier';
                userName = `${ouvrierData.prenom} ${ouvrierData.nom}`;
                console.log('✅ Trovato OUVRIER:', userName);
              } else {
                console.log('❌ Utente non trovato in nessuna anagrafica');
              }
            }
          }
        } catch (error) {
          console.log('❌ Errore anagrafica:', error);
        }
        
        console.log('🎯 RUOLO FINALE:', role, userName);
        
        // FALLBACK: Account di prova se non trovati nelle anagrafiche
        if (role === 'ouvrier' && userName === user.email) {
          if (this.email === 'admin@dallelec.com') {
            role = 'admin';
            userName = 'Admin Dallelec (Test)';
          } else if (this.email === 'chef@dallelec.com') {
            role = 'chef';
            userName = 'Chef Dallelec (Test)';
          } else if (this.email === 'ouvrier@dallelec.com') {
            role = 'ouvrier';
            userName = 'Ouvrier Dallelec (Test)';
          }
        }
        
        // Salva i dati utente
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', userName);
        localStorage.setItem('userId', user.id);
        
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
      }
    }
  }
};
</script>
