<template>
  <div class="container text-center py-5">
    <h2 class="mb-4">Gestion des Répertoires</h2>
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
    <div class="mt-4">
      <router-link to="/admin" class="btn btn-secondary">Retour</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Repertoires',
  data() {
    return {
      sections: [
        { name: 'collaborateurs', label: 'Collaborateurs / Ouvriers', path: '/admin/repertoires/collaborateurs' },
        { name: 'chefdechantiers', label: 'Chefs de chantier', path: '/admin/repertoires/chefdechantiers' },
        { name: 'chantiers', label: 'Chantiers', path: '/admin/repertoires/chantiers' },
        { name: 'clients', label: 'Clients', path: '/admin/repertoires/clients' },
        { name: 'produits', label: 'Produits', path: '/admin/repertoires/produits' },
        { name: 'familles', label: 'Familles de remises', path: '/admin/repertoires/familles' },
        { name: 'sousfamilles', label: 'Sous-familles', path: '/admin/repertoires/sousfamilles' },
        { name: 'paiements', label: 'Modes de paiement', path: '/admin/repertoires/paiements' },
        { name: 'techniciens', label: 'Techniciens', path: '/admin/repertoires/techniciens' },
        { name: 'supplements', label: 'Suppléments', path: '/admin/repertoires/supplements' } 
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
