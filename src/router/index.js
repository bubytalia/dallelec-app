import { createRouter, createWebHistory } from 'vue-router';
import { requireAuth, requireRole } from './guards.js';

// Auth
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue';

// Dashboard
import AdminDashboard from '@/views/AdminDashboard.vue';
import ChefDashboard from '@/views/ChefDashboard.vue';
import AdminReportMensuel from '@/views/AdminReportMensuel.vue';
import AdminGestionFeries from '@/views/AdminGestionFeries.vue';
import AdminBilanChantiers from '@/views/AdminBilanChantiers.vue';
import AdminAssocierDevis from '@/views/AdminAssocierDevis.vue';
import AdminBilans from '@/views/AdminBilans.vue';
import AdminFacturation from '@/views/AdminFacturation.vue';
import AdminFactureManuelle from '@/views/AdminFactureManuelle.vue';
import AdminImportFatture from '@/views/AdminImportFatture.vue';
import AdminMonitoringHeures from '@/views/AdminMonitoringHeures.vue';
import AdminAbsences from '@/views/AdminAbsences.vue';

// Chef pages
import ChefHeures from '@/views/ChefHeures.vue';
import ChefChantiers from '@/views/ChefChantiers.vue';
import ChefAbsences from '@/views/ChefAbsences.vue';
import ChefBilan from '@/views/ChefBilan.vue';
import ChefMetrages from '@/views/ChefMetrages.vue';
import ChefResocontoPercentuale from '@/views/ChefResocontoPercentuale.vue';
import ChefResocontoFinale from '@/views/ChefResocontoFinale.vue';
import ChefSelectionCantiere from '@/views/ChefSelectionCantiere.vue';
import ChefPremi from '@/views/ChefPremi.vue';

// Ouvrier pages
import OuvrierDashboard from '@/views/OuvrierDashboard.vue';
import OuvrierHeures from '@/views/OuvrierHeures.vue';
import OuvrierAbsences from '@/views/OuvrierAbsences.vue';

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
import Interimaires from '@/views/repertoires/Interimaires.vue';
import Factures from '@/views/repertoires/Factures.vue';
import Regies from '@/views/repertoires/Regies.vue';
import Admins from '@/views/repertoires/Admins.vue';
import DevisRepertoire from '@/views/repertoires/Devis.vue';


// Bilans
// import Bilans from '@/views/Bilans.vue'; // Vecchio placeholder

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/login', name: 'LoginPage', component: Login },
  { path: '/register', name: 'Register', component: Register },
  
  // Admin routes
  { path: '/admin', name: 'AdminDashboard', component: AdminDashboard, beforeEnter: requireRole(['admin']) },
  { path: '/admin/devis', name: 'Devis', component: Devis, beforeEnter: requireRole(['admin']) },
  { path: '/admin/devis/create', name: 'DevisCreate', component: DevisCreate, beforeEnter: requireRole(['admin']) },
  { path: '/admin/devis/edit/:id', name: 'DevisEdit', component: DevisCreate, beforeEnter: requireRole(['admin']) },
  { path: '/admin/devis/list', name: 'DevisList', component: DevisList, beforeEnter: requireRole(['admin']) },
  { path: '/admin/devis/produits/:id', name: 'DevisProduits', component: DevisProduits, beforeEnter: requireRole(['admin']) },
  { path: '/devis/produits/:id', name: 'DevisProduitsShort', component: DevisProduits, beforeEnter: requireRole(['admin']) },
  { path: '/admin/devis/conditions/:id', name: 'DevisConditions', component: DevisConditions, beforeEnter: requireRole(['admin']) },
  { path: '/admin/repertoires', name: 'Repertoires', component: Repertoires, beforeEnter: requireRole(['admin']) },
  { path: '/admin/repertoires/chantiers', name: 'Chantiers', component: Chantiers },
  { path: '/admin/repertoires/collaborateurs', name: 'Collaborateurs', component: Collaborateurs },
  { path: '/admin/repertoires/chefdechantiers', name: 'ChefDeChantiers', component: ChefDeChantiers },
  { path: '/admin/repertoires/clients', name: 'Clients', component: Clients },
  { path: '/admin/repertoires/devis', name: 'DevisRepertoire', component: DevisRepertoire },
  { path: '/admin/repertoires/produits', name: 'Produits', component: Produits },
  { path: '/admin/repertoires/familles', name: 'Familles', component: Familles },
  { path: '/admin/repertoires/sousfamilles', name: 'SousFamilles', component: SousFamilles },
  { path: '/admin/repertoires/paiements', name: 'Paiements', component: Paiements },
  { path: '/admin/repertoires/supplements', name: 'Supplements', component: Supplements },
  { path: '/admin/repertoires/techniciens', name: 'Techniciens', component: Techniciens },
  { path: '/admin/repertoires/conditions', name: 'Conditions', component: Conditions },
  { path: '/admin/repertoires/interimaires', name: 'Interimaires', component: Interimaires },
  { path: '/admin/repertoires/factures', name: 'Factures', component: Factures },
  { path: '/admin/repertoires/regies', name: 'Regies', component: Regies },
  { path: '/admin/repertoires/admins', name: 'Admins', component: Admins },

  { path: '/admin/bilans', name: 'AdminBilans', component: AdminBilans },
  { path: '/admin/report-mensuel', name: 'AdminReportMensuel', component: AdminReportMensuel },
  { path: '/admin/gestion-feries', name: 'AdminGestionFeries', component: AdminGestionFeries },
  { path: '/admin/bilan-chantiers', name: 'AdminBilanChantiers', component: AdminBilanChantiers },
  { path: '/admin/associer-devis', name: 'AdminAssocierDevis', component: AdminAssocierDevis },
  { path: '/admin/facturation', name: 'AdminFacturation', component: AdminFacturation },
  { path: '/admin/facture-manuelle', name: 'AdminFactureManuelle', component: AdminFactureManuelle },
  { path: '/admin/import-fatture', name: 'AdminImportFatture', component: AdminImportFatture },
  { path: '/admin/monitoring-heures', name: 'AdminMonitoringHeures', component: AdminMonitoringHeures },
  { path: '/admin/absences', name: 'AdminAbsences', component: AdminAbsences },
  { path: '/admin/premi', name: 'AdminPremi', component: () => import('@/views/AdminPremi.vue') },
  { path: '/admin/security', name: 'AdminSecurity', component: () => import('@/components/SecurityDashboard.vue') },
  { path: '/admin/backup', name: 'AdminBackup', component: () => import('@/components/BackupSupabase.vue') },
  { path: '/aide', name: 'Aide', component: () => import('@/views/Aide.vue') },


  // Chef routes
  { path: '/chef', name: 'ChefDashboard', component: ChefDashboard, beforeEnter: requireRole(['chef']) },
  { path: '/chef/heures', name: 'ChefHeures', component: ChefHeures, beforeEnter: requireRole(['chef']) },
  { path: '/chef/chantiers', name: 'ChefChantiers', component: ChefChantiers, beforeEnter: requireRole(['chef']) },
  { path: '/chef/absences', name: 'ChefAbsences', component: ChefAbsences, beforeEnter: requireRole(['chef']) },
  { path: '/chef/chantiers/bilan', name: 'ChefBilan', component: ChefBilan }, // TODO: creare componente specifico
  { path: '/chef/chantiers/metrages', name: 'ChefSelectionCantiere', component: ChefSelectionCantiere },
  { path: '/chef/chantiers/metrages-detail', name: 'ChefMetrages', component: ChefMetrages },
  { path: '/chef/chantiers/resoconto-percentuale', name: 'ChefResocontoPercentuale', component: ChefResocontoPercentuale },
  { path: '/chef/chantiers/resoconto-finale', name: 'ChefResocontoFinale', component: ChefResocontoFinale },
  { path: '/chef/premi', name: 'ChefPremi', component: ChefPremi },
  { path: '/chef/chantiers/:id', name: 'ChefChantierDetail', component: ChefChantiers }, // TODO: creare componente specifico

  // Ouvrier routes
  { path: '/ouvrier', name: 'OuvrierDashboard', component: OuvrierDashboard, beforeEnter: requireRole(['ouvrier']) },
  { path: '/ouvrier/heures', name: 'OuvrierHeures', component: OuvrierHeures, beforeEnter: requireRole(['ouvrier']) },
  { path: '/ouvrier/historique', name: 'OuvrierHistorique', component: OuvrierHeures, beforeEnter: requireRole(['ouvrier']) }, // Stessa pagina per ora
  { path: '/ouvrier/absences', name: 'OuvrierAbsences', component: OuvrierAbsences, beforeEnter: requireRole(['ouvrier']) },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
