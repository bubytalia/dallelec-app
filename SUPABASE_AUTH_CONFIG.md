# CONFIGURAZIONE AUTENTICAZIONE SUPABASE

## 🔧 DISABILITARE CONFERMA EMAIL

1. **Vai su**: https://supabase.com/dashboard/project/aumhdoiwtichjlvbrnrl/auth/settings
2. **Sezione "Email"**:
   - ❌ **DISABILITA**: "Enable email confirmations"
   - ❌ **DISABILITA**: "Enable email change confirmations" 
3. **Clicca "Save"**

## 👥 CREARE UTENTI TEST

Dopo aver disabilitato la conferma email:

1. **Vai su**: https://supabase.com/dashboard/project/aumhdoiwtichjlvbrnrl/auth/users
2. **Clicca "Add user"**
3. **Crea questi utenti**:
   - **admin@dallelec.com** (password: dallelec2025)
   - **chef@dallelec.com** (password: dallelec2025)  
   - **ouvrier@dallelec.com** (password: dallelec2025)

## 🔄 SOSTITUIRE LOGIN TEMPORANEO

Una volta creati gli utenti, modificare `src/views/Login.vue` per usare Supabase Auth reale invece del login temporaneo.

## ✅ VERIFICA

Testare il login con gli utenti creati.