<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin" />

    <h2 class="text-center mb-4">Gestion des Répertoires</h2>
    <div class="row justify-content-center">
      <div
        v-for="item in sections"
        :key="item.name"
        class="col-md-4 mb-3"
      >
        <router-link :to="item.path" class="btn btn-outline-primary w-100">
          {{ item.label }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import RetourButton from '@/components/RetourButton.vue';

export default {
  name: 'Repertoires',
  components: {
    RetourButton
  },
  data() {
    return {
      sections: [
        { name: 'collaborateurs', label: 'Collaborateurs / Ouvriers', path: '/admin/repertoires/collaborateurs' },
        { name: 'chefdechantiers', label: 'Chefs de chantier', path: '/admin/repertoires/chefdechantiers' },
        { name: 'interimaires', label: 'Intérimaires', path: '/admin/repertoires/interimaires' },
        { name: 'chantiers', label: 'Chantiers', path: '/admin/repertoires/chantiers' },
        { name: 'clients', label: 'Clients', path: '/admin/repertoires/clients' },
        { name: 'produits', label: 'Produits', path: '/admin/repertoires/produits' },
        { name: 'familles', label: 'Familles de remises', path: '/admin/repertoires/familles' },
        { name: 'sousfamilles', label: 'Sous-familles', path: '/admin/repertoires/sousfamilles' },
        { name: 'paiements', label: 'Modes de paiement', path: '/admin/repertoires/paiements' },
        { name: 'techniciens', label: 'Techniciens', path: '/admin/repertoires/techniciens' },
        { name: 'supplements', label: 'Suppléments', path: '/admin/repertoires/supplements' },
        { name: 'conditions', label: 'Conditions de vente', path: '/admin/repertoires/conditions' }
      ]
    };
  }
};
</script>

<style scoped>
h2 {
  font-weight: bold;
  margin-bottom: 30px;
}
</style>
