# 🚨 SITUAZIONE WORDPRESS DALLELEC.CH - DA COMPLETARE

**Data**: 2025-01-XX  
**Stato**: SOSPESO - DA RIPRENDERE  

---

## 📋 RIEPILOGO SITUAZIONE

### ✅ PROBLEMA RISOLTO
- **Errori PHP 8.2**: Nascosti modificando `wp-config.php`
- **Sito funzionante**: https://dallelec.ch
- **Costo 6.99 CHF/mese**: Evitato

### ⚠️ PROBLEMA APERTO
- **Accesso WordPress Admin**: NON DISPONIBILE
- **Dipendenza da studio esterno**: Metaofficina (info@metaofficina.it)
- **Aggiornamento plugin**: NON FATTO (non urgente ma consigliato)

---

## 🔐 CREDENZIALI E ACCESSI

### **Hosting: one.com**
- URL pannello: https://www.one.com/admin/
- Dominio: dallelec.ch
- Piano: Principiante

### **Database MySQL/MariaDB**
- Host: `dallelec.ch.mysql`
- Database: `dallelec_chmd`
- Utente: `dallelec_chmd`
- Password: `nQR[8/\r%`
- phpMyAdmin: Accessibile dal pannello one.com

### **WordPress**
- URL sito pubblico: `https://dallelec.ch`
- URL backend (siteurl): `https://dallelec.ch/website`
- Percorso FTP: `/customers/4/6/5/dallelec.ch/httpd.www/website/`
- Prefisso tabelle DB: `wp_dMc_`

### **Utente WordPress modificato (ma admin non accessibile)**
- Username: `dM_n2A` (modificato in phpMyAdmin)
- Email: Modificata da `info@metaofficina.it` alla tua
- Password: Modificata in phpMyAdmin (hash MD5)
- Display name: Modificato

### **Email admin WordPress (da cambiare)**
- Tabella: `wp_dMc_options`
- Campo: `admin_email`
- Valore attuale: `info@metaofficina.it` (o modificato)

---

## 🔧 MODIFICHE EFFETTUATE

### **File: wp-config.php**
Percorso: `/customers/4/6/5/dallelec.ch/httpd.www/website/wp-config.php`

**Modifiche applicate:**
```php
<?php
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');

//Begin Really Simple SSL session cookie settings
@ini_set('session.cookie_httponly', true);
@ini_set('session.cookie_secure', true);
@ini_set('session.use_only_cookies', true);
//END Really Simple SSL
```

**E più in basso:**
```php
define('WP_DEBUG', false); // CAMBIATO DA true A false
```

### **Database: wp_dMc_users**
- Modificato utente ID 1 (`dM_n2A`)
- Cambiati: username, password (MD5), email, display_name

### **Database: wp_dMc_options**
- Tentato cambio `siteurl` → HA ROTTO IL SITO
- **RIPRISTINATO** a: `https://dallelec.ch/website`
- ⚠️ NON MODIFICARE `siteurl` senza sapere cosa si fa!

---

## 🎯 COSA FARE PER COMPLETARE

### **OBIETTIVO: Ottenere accesso WordPress Admin**

### **Opzione 1 - Contattare Metaofficina**
- Email: info@metaofficina.it
- Richiedere: Username e password WordPress admin
- Motivazione: "Ho pagato il sito, ho diritto all'accesso completo"

### **Opzione 2 - Creare nuovo utente admin via database**

**PROCEDURA (da fare con Amazon Q o altro assistente):**

1. Accedi a phpMyAdmin (dal pannello one.com)
2. Database: `dallelec_chmd`
3. Tabella: `wp_dMc_users`
4. Clicca "Inserisci" (non "Modifica")
5. Compila i campi:
   ```
   ID: (lascia vuoto, auto-increment)
   user_login: admin_dallelec
   user_pass: [TUA_PASSWORD] → Seleziona "MD5" dal menu
   user_nicename: admin_dallelec
   user_email: [TUA_EMAIL]
   user_url: (vuoto)
   user_registered: [DATA_CORRENTE] es: 2025-01-15 10:00:00
   user_activation_key: (vuoto)
   user_status: 0
   display_name: Amministratore Dallelec
   ```
6. Salva

7. Vai alla tabella: `wp_dMc_usermeta`
8. Inserisci 2 righe per dare privilegi admin:
   
   **Riga 1:**
   ```
   umeta_id: (vuoto)
   user_id: [ID_UTENTE_CREATO] (es: 2)
   meta_key: wp_dMc_capabilities
   meta_value: a:1:{s:13:"administrator";b:1;}
   ```
   
   **Riga 2:**
   ```
   umeta_id: (vuoto)
   user_id: [ID_UTENTE_CREATO] (es: 2)
   meta_key: wp_dMc_user_level
   meta_value: 10
   ```

9. Prova ad accedere a:
   - `https://dallelec.ch/wp-admin`
   - `https://dallelec.ch/website/wp-admin`
   - `https://dallelec.ch/wp-login.php`
   - `https://dallelec.ch/website/wp-login.php`

### **Opzione 3 - Supporto one.com**
- Contatta supporto tecnico one.com
- Spiega: "Non ho accesso admin WordPress, come posso recuperarlo?"

---

## 📦 PLUGIN DA AGGIORNARE (quando avrai accesso)

Dal pannello WordPress → Plugin → Aggiorna:
- Advanced Custom Fields PRO
- Yoast SEO
- Cookie Law Info
- All-in-One WP Security and Firewall
- Simple Lightbox
- EPS 301 Redirects
- Really Simple SSL

---

## ⚠️ NOTE IMPORTANTI

### **NON MODIFICARE:**
- `siteurl` in `wp_dMc_options` (rompe il sito)
- Configurazione SSL/HTTPS
- Struttura cartelle FTP

### **SICURO MODIFICARE:**
- `wp-config.php` (già fatto)
- `WP_DEBUG` (già fatto)
- Utenti in `wp_dMc_users`
- Email admin in `wp_dMc_options`

### **VERSIONE PHP ATTUALE:**
- PHP 8.2+ (aggiornato da versione obsoleta)
- Errori "Deprecated" nascosti ma presenti
- Plugin vecchi ma funzionanti

---

## 🏗️ ARCHITETTURA SITI DALLELEC

### **dallelec.ch** (one.com - WordPress)
- Sito vetrina/istituzionale
- Hosting: one.com
- CMS: WordPress
- Percorso: `/httpd.www/website/`

### **dallelec.com** (Netlify - React)
- App gestionale completa
- Hosting: Netlify
- Framework: React
- Database: Supabase
- Branch deploy: `fix-produits-devis`
- Documentazione: `SISTEMA_DALLELEC_COMPLETO.md`

**SONO DUE SISTEMI SEPARATI!**

---

## 📞 CONTATTI UTILI

- **Supporto one.com**: https://www.one.com/it/supporto
- **Studio precedente**: info@metaofficina.it
- **Tuo contatto**: contact@dallelec.ch / +41 79 722 72 13

---

## 🔄 PROSSIMI PASSI

1. ⏳ **Quando hai tempo**: Scegli Opzione 1, 2 o 3 per ottenere accesso admin
2. 🔐 **Ottieni accesso**: WordPress admin funzionante
3. 🔄 **Aggiorna plugin**: Dal pannello WordPress
4. ✅ **Indipendenza**: Non dipendi più da Metaofficina

---

## 💬 COME RIPRENDERE CON AMAZON Q

Quando riprendi, dì:
```
"Ho il file SITUAZIONE_WORDPRESS_DALLELEC_CH.md, 
voglio completare l'accesso WordPress admin per dallelec.ch.
Preferisco l'Opzione 2 (creare nuovo utente via database)."
```

Oppure allega questo file alla chat.

---

**FINE DOCUMENTO**  
**Questo file è estraneo al sistema gestionale - È solo documentazione**
