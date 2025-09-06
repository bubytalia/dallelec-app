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
            <th>Qté</th>
            <th>Valeur</th>
            <th>Total ML</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(group, key) in groupByProduit(zone.details)" :key="key">
            <tr v-for="(entry, i) in group.entries" :key="i">
              <td>{{ entry.article || 'N/A' }}</td>
              <td>{{ entry.nom || 'N/A' }}</td>
              <td>{{ entry.taille }}</td>
              <td>{{ entry.supplement }}</td>
              <td>{{ entry.qte }}</td>
              <td>{{ entry.valeur }}</td>
              <td>{{ (entry.qte * entry.valeur).toFixed(2) }} ML</td>
            </tr>
            <tr>
              <td colspan="6" class="text-end fw-bold">Total Suppléments ({{ group.nom }}):</td>
              <td class="fw-bold">
                {{ group.entries.reduce((sum, e) => sum + (e.qte * e.valeur), 0).toFixed(2) }} ML
              </td>
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
</script>
