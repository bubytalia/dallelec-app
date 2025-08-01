import { createRouter, createWebHistory } from 'vue-router';

// Auth
import Login from '@/views/Login.vue';

// Dashboard
import AdminDashboard from '@/views/AdminDashboard.vue';

// Devis
import Devis from '@/views/devis/Devis.vue';
import DevisCreate from '@/views/devis/DevisCreate.vue';
import DevisList from '@/views/devis/DevisList.vue';
import DevisProduits from '@/views/devis/DevisProduits.vue'; // ✅ Import corretto
import DevisConditions from '@/views/devis/DevisConditions.vue';

// Répertoires
import Repertoires from '@/views/Repertoires.vue';
import Chantiers from '@/views/repertoires/Chantiers.vue';
import Collaborateurs from '@/views/repertoires/Collaborateurs.vue';
import ChefDeChantiers from '@/views/repertoires/ChefDeChantiers.vue';
import Clients from '@/views/repertoires/Clients.vue';
import Produits from '@/views/repertoires/Produits.vue';
import Familles from '@/views/repertoires/Familles.vue';
import SousFamilles from '@/views/repertoires/SousFamilles.vue';
import Paiements from '@/views/repertoires/Paiements.vue';
import Techniciens from '@/views/repertoires/Techniciens.vue';
import Supplements from '@/views/repertoires/Supplements.vue';
import Conditions from '@/views/repertoires/Conditions.vue';

// Bilans
import Bilans from '@/views/Bilans.vue';

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/admin', name: 'AdminDashboard', component: AdminDashboard },

  // Devis
  { path: '/admin/devis', name: 'Devis', component: Devis },
  { path: '/admin/devis/create', name: 'DevisCreate', component: DevisCreate },
  // Route per la modifica di un devis esistente: riutilizziamo DevisCreate ma con id
  { path: '/admin/devis/edit/:id', name: 'DevisEdit', component: DevisCreate },
  { path: '/admin/devis/list', name: 'DevisList', component: DevisList },
  { path: '/devis/produits/:id', name: 'DevisProduits', component: DevisProduits }, // ✅ Con :id
  // Terza pagina: condizioni del devis
  { path: '/admin/devis/conditions/:id', name: 'DevisConditions', component: DevisConditions },

  // Répertoires
  { path: '/admin/repertoires', name: 'Repertoires', component: Repertoires },
  { path: '/admin/repertoires/chantiers', name: 'Chantiers', component: Chantiers },
  { path: '/admin/repertoires/collaborateurs', name: 'Collaborateurs', component: Collaborateurs },
  { path: '/admin/repertoires/chefdechantiers', name: 'ChefDeChantiers', component: ChefDeChantiers },
  { path: '/admin/repertoires/clients', name: 'Clients', component: Clients },
  { path: '/admin/repertoires/produits', name: 'Produits', component: Produits },
  { path: '/admin/repertoires/familles', name: 'Familles', component: Familles },
  { path: '/admin/repertoires/sousfamilles', name: 'SousFamilles', component: SousFamilles },
  { path: '/admin/repertoires/paiements', name: 'Paiements', component: Paiements },
  { path: '/admin/repertoires/supplements', name: 'Supplements', component: Supplements },
  { path: '/admin/repertoires/techniciens', name: 'Techniciens', component: Techniciens },
  { path: '/admin/repertoires/conditions', name: 'Conditions', component: Conditions },
  // Bilans
  { path: '/admin/bilans', name: 'Bilans', component: Bilans }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
