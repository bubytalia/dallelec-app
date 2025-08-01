
<template>
  <div class="container py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <!-- Titolo della pagina -->
      <h2 class="m-0">Gestion des Devis</h2>
      <!-- Contenitore per i pulsanti di navigazione -->
      <div>
        <!-- Pulsante per tornare alla dashboard (admin).
             Usiamo un router-link in modo da avere un link permanente senza
             dipendere dalla cronologia -->
        <router-link class="btn btn-outline-secondary me-2" to="/admin">← Retour</router-link>
        <!-- Pulsante per creare un nuovo devis. Usa un handler per pulire il localStorage prima di creare -->
        <button class="btn btn-primary" @click="newDevis">➕ Nouveau Devis</button>
      </div>
    </div>
    <DevisList :show-title="false" />
  </div>
</template>

<script setup>
import DevisList from './DevisList.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

/**
 * Naviga alla pagina di creazione di un nuovo devis. Prima di farlo, ripulisce
 * eventuali dati temporanei salvati nel localStorage (form, remises, zones)
 * in modo da partire con un modulo vuoto.
 */
const newDevis = () => {
  try {
    localStorage.removeItem('devisForm');
    localStorage.removeItem('devisRemises');
    localStorage.removeItem('zonesCantiere');
  } catch (e) {
    console.warn('Erreur lors du nettoyage du localStorage avant la création du devis', e);
  }
  router.push('/admin/devis/create');
};
</script>
