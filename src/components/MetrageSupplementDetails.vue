<template>
  <div class="card p-4 mb-4">
    <h5>Détail des Suppléments par Zone</h5>
    <div v-for="zone in supplementParZone" :key="zone.nom" class="mb-3">
      <h6>Zone: {{ zone.nom }}</h6>
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Code Article</th>
            <th>Produit</th>
            <th>Taille</th>
            <th>Supplément</th>
            <th>Qté Posée</th>
            <th>Valeur (m)</th>
            <th>Total ML</th>
            <th>Progression</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(group, key) in groupByProduit(zone.details)" :key="key">
            <tr v-for="(entry, i) in group.entries" :key="i">
              <td>{{ entry.article || 'N/A' }}</td>
              <td>{{ entry.nom || 'N/A' }}</td>
              <td>{{ entry.taille }}</td>
              <td>{{ entry.supplement }}</td>
              <td>{{ entry.qtePosee || 0 }}</td>
              <td>{{ entry.valeur || 1 }}m</td>
              <td><strong>{{ entry.totalML?.toFixed(2) || '0.00' }}m</strong></td>
              <td>
                <span class="badge bg-info">
                  {{ entry.qtePosee || 0 }} × {{ entry.valeur || 1 }}m
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="5" class="text-end fw-bold">Total Suppléments ({{ group.nom }}):</td>
              <td class="fw-bold">
                {{ group.entries.reduce((sum, e) => sum + (e.totalML || 0), 0).toFixed(2) }} ML
              </td>
              <td></td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  supplementParZone: Array
});

function groupByProduit(details) {
  const map = {};
  for (const entry of details) {
    const key = `${entry.article}-${entry.nom}-${entry.taille}`;
    if (!map[key]) {
      map[key] = {
        article: entry.article,
        nom: entry.nom,
        taille: entry.taille,
        entries: []
      };
    }
    map[key].entries.push(entry);
  }
  return map;
}

// Rimosso calcolo progressione per supplementi (non applicabile)
</script>

<style scoped>
.badge {
  font-size: 0.8em;
  padding: 0.4em 0.6em;
}
</style>