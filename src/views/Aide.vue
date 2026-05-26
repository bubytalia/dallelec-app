<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-question-circle"></i> Centre d'Aide</h2>
      <button @click="$router.go(-1)" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left"></i> Retour
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <!-- Navigation par onglets -->
    <ul v-else class="nav nav-tabs mb-4">
      <li class="nav-item" v-if="availableTabs.includes('ouvrier')">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'ouvrier' }"
          @click="activeTab = 'ouvrier'"
        >
          👷 Guide Ouvrier
        </button>
      </li>
      <li class="nav-item" v-if="availableTabs.includes('chef')">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'chef' }"
          @click="activeTab = 'chef'"
        >
          👨💼 Guide Chef de Chantier
        </button>
      </li>
      <li class="nav-item" v-if="availableTabs.includes('admin')">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'admin' }"
          @click="activeTab = 'admin'"
        >
          👨💻 Guide Administrateur
        </button>
      </li>
      <li class="nav-item" v-if="availableTabs.includes('faq')">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'faq' }"
          @click="activeTab = 'faq'"
        >
          ❓ FAQ
        </button>
      </li>
    </ul>

    <!-- Contenu des onglets -->
    <div v-if="!loading" class="tab-content">
      
      <!-- Guide Ouvrier -->
      <div v-if="activeTab === 'ouvrier'" class="tab-pane fade show active">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h4><i class="bi bi-person-workspace"></i> Guide pour les Ouvriers</h4>
          </div>
          <div class="card-body">
            
            <h5>🔐 1. Connexion</h5>
            <ul>
              <li>Rendez-vous sur <strong>dallelec.com</strong></li>
              <li>Utilisez votre <strong>email professionnel</strong> et mot de passe</li>
              <li>Cliquez sur <strong>"Se connecter"</strong></li>
            </ul>

            <h5>⏰ 2. Enregistrement des Heures</h5>
            <ul>
              <li>Accédez à <strong>"Heures de Travail"</strong></li>
              <li>Cliquez sur <strong>"Nouvelle Entrée"</strong></li>
              <li>Remplissez les champs obligatoires :</li>
              <ul>
                <li><strong>Date :</strong> Date du travail effectué</li>
                <li><strong>Heures normales :</strong> Heures de travail standard</li>
                <li><strong>Heures supplémentaires :</strong> Si applicable</li>
                <li><strong>Description :</strong> Brève description du travail</li>
              </ul>
              <li>Cliquez sur <strong>"Enregistrer"</strong></li>
            </ul>
            
            <div class="alert alert-warning">
              <strong>⚠️ Délai d'enregistrement :</strong> Vous ne pouvez enregistrer des heures que pour <strong>les 2 derniers jours</strong>. Au-delà, contactez l'administrateur pour une autorisation spéciale.
            </div>

            <h5>📋 3. Consultation de vos Heures</h5>
            <ul>
              <li>Visualisez toutes vos heures enregistrées</li>
              <li>Filtrez par <strong>période</strong> ou <strong>statut</strong></li>
              <li>Vérifiez le statut : <span class="badge bg-warning">En attente</span> ou <span class="badge bg-success">Approuvé</span></li>
            </ul>

            <h5>✏️ 4. Modification des Heures</h5>
            <ul>
              <li>Seules les heures <strong>"En attente"</strong> peuvent être modifiées</li>
              <li>Cliquez sur <strong>"Modifier"</strong> dans la ligne concernée</li>
              <li>Effectuez vos changements et <strong>sauvegardez</strong></li>
            </ul>

            <div class="alert alert-info">
              <strong>💡 Conseil :</strong> Enregistrez vos heures quotidiennement pour éviter les oublis !
            </div>

          </div>
        </div>
      </div>

      <!-- Guide Chef de Chantier -->
      <div v-if="activeTab === 'chef'" class="tab-pane fade show active">
        <div class="card">
          <div class="card-header bg-success text-white">
            <h4><i class="bi bi-person-badge"></i> Guide pour les Chefs de Chantier</h4>
          </div>
          <div class="card-body">
            
            <h5>🔐 1. Connexion</h5>
            <ul>
              <li>Connectez-vous avec vos identifiants <strong>Chef de Chantier</strong></li>
              <li>Vous accédez aux fonctions de gestion de chantier</li>
            </ul>

            <h5>⏰ 2. Enregistrement de vos Heures</h5>
            <ul>
              <li>Accédez à <strong>"Heures"</strong></li>
              <li>Enregistrez vos <strong>heures propres</strong> et <strong>heures intérimaires</strong></li>
              <li>Sélectionnez le chantier et la date</li>
            </ul>
            
            <div class="alert alert-warning">
              <strong>⚠️ Délai d'enregistrement :</strong> Vous ne pouvez enregistrer des heures que pour <strong>les 2 derniers jours</strong>. Au-delà, contactez l'administrateur.
            </div>

            <h5>💰 3. Formation des Primes</h5>
            <p>Le système de primes récompense l'efficacité sur chantier. Voici comment elles sont calculées :</p>
            
            <h6><strong>A) Heures prévues</strong></h6>
            <p>Pour chaque chantier facturé, le système calcule un <strong>budget d'heures disponibles</strong> basé sur le montant facturé (hors régies).</p>

            <h6><strong>B) Heures gagnées</strong></h6>
            <p>La différence entre les <strong>heures prévues</strong> et les <strong>heures réellement employées</strong> (hors régies) donne les heures gagnées :</p>
            <ul>
              <li><span class="text-success fw-bold">Heures gagnées positives</span> = vous avez été plus rapide que prévu → <strong>prime d'efficacité</strong></li>
              <li><span class="text-danger fw-bold">Heures gagnées négatives</span> = dépassement → pas de prime</li>
            </ul>

            <h6><strong>C) Prime d'efficacité</strong></h6>
            <p>Chaque heure gagnée vaut <strong>26 CHF</strong>.</p>

            <h6><strong>D) Prime régies</strong></h6>
            <p>Si le chantier est en positif (heures gagnées > 0), chaque heure de régie effectuée rapporte <strong>5 CHF</strong> supplémentaires.</p>

            <div class="alert alert-success">
              <strong>✅ Exemple :</strong><br>
              Heures prévues : 500h | Heures réelles : 400h | Régies : 20h<br>
              → Heures gagnées : +100h<br>
              → Prime efficacité : 100 × 26 = <strong>2'600 CHF</strong><br>
              → Prime régies : 20 × 5 = <strong>100 CHF</strong><br>
              → <strong>Total : 2'700 CHF</strong>
            </div>

            <h5>🎯 4. Indicateurs de Performance</h5>
            <p>Dans la page <strong>"Primes"</strong>, vous voyez pour chaque chantier :</p>
            <ul>
              <li><strong>📐 CDC (avec suppl.) :</strong> Mètres de chemin de câble prévus au devis (suppléments inclus)</li>
              <li><strong>⏱ Heures MO prévues :</strong> Nombre d'heures de main-d'œuvre prévues</li>
              <li><strong>📊 m/h :</strong> Objectif de mètres par heure à atteindre</li>
            </ul>
            <p>Ces indicateurs apparaissent dès que le chantier a un devis associé, même avant la facturation. Ils servent de <strong>référence pour optimiser votre productivité</strong>.</p>

            <div class="alert alert-info">
              <strong>💡 Conseil :</strong> Plus vous posez de mètres par heure, plus vos heures gagnées augmentent et donc votre prime !
            </div>

          </div>
        </div>
      </div>

      <!-- Guide Administrateur -->
      <div v-if="activeTab === 'admin'" class="tab-pane fade show active">
        <div class="card">
          <div class="card-header bg-danger text-white">
            <h4><i class="bi bi-gear"></i> Guide pour les Administrateurs</h4>
          </div>
          <div class="card-body">
            
            <h5>🏢 1. Gestion des Répertoires</h5>
            <ul>
              <li><strong>Clients :</strong> Ajout, modification, suppression des clients</li>
              <li><strong>Chantiers :</strong> Création et gestion des chantiers</li>
              <li><strong>Utilisateurs :</strong> Gestion des comptes ouvriers et chefs</li>
              <li><strong>Produits :</strong> Catalogue des produits et tarifs</li>
            </ul>

            <h5>📋 2. Gestion des Devis</h5>
            <ul>
              <li>Créez des <strong>nouveaux devis</strong></li>
              <li>Associez les <strong>produits</strong> et <strong>quantités</strong></li>
              <li>Générez des <strong>PDF</strong> professionnels</li>
              <li>Suivez le <strong>statut</strong> des devis</li>
            </ul>

            <h5>💰 3. Facturation</h5>
            <h6>Facturation Automatique :</h6>
            <ul>
              <li>Basée sur les <strong>métrages validés</strong></li>
              <li>Calcul automatique des montants</li>
              <li>Génération de PDF professionnel</li>
            </ul>
            
            <h6>Facturation Manuelle :</h6>
            <ul>
              <li>Cliquez sur <strong>"Facture Manuelle"</strong></li>
              <li>Sélectionnez le <strong>client</strong></li>
              <li>Ajoutez les <strong>lignes de facturation</strong> :</li>
              <ul>
                <li>Description du service/produit</li>
                <li>Unité de mesure</li>
                <li>Quantité</li>
                <li>Prix unitaire</li>
              </ul>
              <li>Le <strong>total</strong> se calcule automatiquement</li>
              <li>Ajoutez des <strong>notes</strong> si nécessaire</li>
              <li>Générez le <strong>PDF</strong></li>
            </ul>

            <h5>📊 4. Rapports et Analyses</h5>
            <ul>
              <li><strong>Bilans financiers :</strong> Vue d'ensemble des revenus</li>
              <li><strong>Rapports mensuels :</strong> Analyse détaillée par période</li>
              <li><strong>Suivi des paiements :</strong> Factures payées/impayées</li>
            </ul>

            <h5>👥 5. Gestion des Utilisateurs</h5>
            <ul>
              <li>Créez des comptes pour <strong>ouvriers</strong> et <strong>chefs</strong></li>
              <li>Assignez les <strong>chantiers</strong> aux chefs</li>
              <li>Gérez les <strong>permissions</strong> et <strong>accès</strong></li>
            </ul>

            <h5>⚙️ 6. Configuration Système</h5>
            <ul>
              <li>Paramètres de <strong>TVA</strong></li>
              <li>Modèles de <strong>documents</strong></li>
              <li>Gestion des <strong>jours fériés</strong></li>
              <li>Sauvegarde des <strong>données</strong></li>
            </ul>

            <div class="alert alert-success">
              <strong>✅ Conseil :</strong> Effectuez des sauvegardes régulières et vérifiez les données importantes quotidiennement !
            </div>

          </div>
        </div>
      </div>

      <!-- FAQ -->
      <div v-if="activeTab === 'faq'" class="tab-pane fade show active">
        <div class="card">
          <div class="card-header bg-info text-white">
            <h4><i class="bi bi-question-circle"></i> Questions Fréquentes</h4>
          </div>
          <div class="card-body">
            
            <div class="accordion" id="faqAccordion">
              
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                    🔐 Je ne peux pas me connecter, que faire ?
                  </button>
                </h2>
                <div id="faq1" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div class="accordion-body">
                    <ul>
                      <li>Vérifiez votre <strong>email</strong> et <strong>mot de passe</strong></li>
                      <li>Assurez-vous que votre compte est <strong>activé</strong></li>
                      <li>Contactez l'administrateur si le problème persiste</li>
                      <li>Vérifiez votre connexion internet</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                    ⏰ Puis-je modifier mes heures après validation ?
                  </button>
                </h2>
                <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div class="accordion-body">
                    <strong>Non</strong>, une fois les heures validées par le chef de chantier, elles ne peuvent plus être modifiées. 
                    Contactez votre chef de chantier ou l'administrateur pour toute correction nécessaire.
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                    💰 Comment générer une facture ?
                  </button>
                </h2>
                <div id="faq3" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div class="accordion-body">
                    <strong>Pour les administrateurs :</strong>
                    <ul>
                      <li><strong>Automatique :</strong> Basée sur les métrages validés</li>
                      <li><strong>Manuelle :</strong> Création libre avec lignes personnalisées</li>
                      <li>Les PDF sont générés automatiquement</li>
                      <li>Numérotation automatique des factures</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
                    📱 Le système fonctionne-t-il sur mobile ?
                  </button>
                </h2>
                <div id="faq4" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div class="accordion-body">
                    <strong>Oui !</strong> Le système est entièrement responsive et fonctionne sur :
                    <ul>
                      <li>📱 <strong>Smartphones</strong> (iOS et Android)</li>
                      <li>📱 <strong>Tablettes</strong></li>
                      <li>💻 <strong>Ordinateurs</strong> (Windows, Mac, Linux)</li>
                    </ul>
                    Utilisez votre navigateur web habituel.
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq5">
                    🔄 Comment sauvegarder mes données ?
                  </button>
                </h2>
                <div id="faq5" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div class="accordion-body">
                    <strong>Les données sont automatiquement sauvegardées</strong> dans le cloud Supabase.
                    <ul>
                      <li>✅ <strong>Sauvegarde automatique</strong> à chaque modification</li>
                      <li>✅ <strong>Redondance</strong> sur plusieurs serveurs</li>
                      <li>✅ <strong>Accès 24/7</strong> depuis n'importe où</li>
                      <li>✅ <strong>Sécurité</strong> niveau entreprise</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq6">
                    🆘 Qui contacter en cas de problème ?
                  </button>
                </h2>
                <div id="faq6" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div class="accordion-body">
                    <strong>Support technique :</strong>
                    <ul>
                      <li>📧 <strong>Email :</strong> support@dallelec.com</li>
                      <li>📞 <strong>Téléphone :</strong> +41 XX XXX XX XX</li>
                      <li>🕐 <strong>Horaires :</strong> Lun-Ven 8h-17h</li>
                    </ul>
                    <strong>Pour les urgences :</strong> Contactez directement l'administrateur système.
                  </div>
                </div>
              </div>

            </div>

            <div class="alert alert-primary mt-4">
              <h5>📞 Besoin d'aide supplémentaire ?</h5>
              <p>Notre équipe support est là pour vous aider ! N'hésitez pas à nous contacter pour toute question ou formation personnalisée.</p>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase.js'
import { useAuth } from '@/composables/useAuth.js'

const activeTab = ref('ouvrier')
const userType = ref('ouvrier')
const availableTabs = ref(['ouvrier', 'faq'])
const loading = ref(true)

const getUserType = async (email) => {
  try {
    console.log('Checking user type for:', email)
    
    // Controlla admin
    const { data: admins } = await supabase.from('admins').select('*')
    console.log('Admins found:', admins)
    if (admins && admins.some(admin => admin.email === email)) {
      console.log('User is admin')
      return 'admin'
    }
    
    // Controlla chef
    const { data: chefs } = await supabase.from('chefdechantiers').select('*')
    console.log('Chefs found:', chefs)
    if (chefs && chefs.some(chef => chef.email === email)) {
      console.log('User is chef')
      return 'chef'
    }
    
    console.log('User is ouvrier')
    return 'ouvrier'
  } catch (error) {
    console.error('Erreur getUserType:', error)
    return 'ouvrier'
  }
}

const setupUserTabs = (type) => {
  userType.value = type
  
  switch (type) {
    case 'admin':
      availableTabs.value = ['admin', 'faq']
      activeTab.value = 'admin'
      break
    case 'chef':
      availableTabs.value = ['chef', 'faq']
      activeTab.value = 'chef'
      break
    default:
      availableTabs.value = ['ouvrier', 'faq']
      activeTab.value = 'ouvrier'
  }
}

onMounted(async () => {
  const { user } = useAuth()
  
  // Ottieni utente corrente da Supabase
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (currentUser) {
    console.log('User authenticated:', currentUser.email)
    const type = await getUserType(currentUser.email)
    console.log('User type determined:', type)
    setupUserTabs(type)
  }
  
  loading.value = false
})
</script>

<style scoped>
.nav-tabs .nav-link {
  color: #495057;
  border: 1px solid transparent;
}

.nav-tabs .nav-link.active {
  color: #495057;
  background-color: #fff;
  border-color: #dee2e6 #dee2e6 #fff;
}

.card-header {
  font-weight: bold;
}

.accordion-button:not(.collapsed) {
  background-color: #e7f3ff;
  color: #0c63e4;
}

h5 {
  color: #495057;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

h6 {
  color: #6c757d;
  margin-top: 1rem;
}

.alert {
  margin-top: 1.5rem;
}

.badge {
  font-size: 0.8em;
}
</style>