<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>📐 Liste Matériel par Article</h2>
      <router-link to="/admin/materiali" class="btn btn-outline-secondary">← Retour</router-link>
    </div>

    <!-- Ricerca articolo posa -->
    <div class="card mb-4">
      <div class="card-body">
        <label class="form-label">Rechercher un article de pose</label>
        <input v-model="ricerca" class="form-control" placeholder="🔍 Code ou désignation..." />
        <div v-if="ricerca && risultatiRicerca.length > 0" class="list-group mt-2" style="max-height:200px; overflow-y:auto">
          <a v-for="p in risultatiRicerca" :key="p.id" href="#"
            class="list-group-item list-group-item-action"
            :class="{ active: selectedProduit === p.id }"
            @click.prevent="selectProduit(p)">
            <strong>{{ p.article }}</strong> - {{ p.description }}
            <span v-if="p.taille" class="text-muted small ms-2">({{ p.taille }})</span>
          </a>
        </div>
        <div v-if="ricerca && risultatiRicerca.length === 0" class="text-muted mt-2">
          Aucun article trouvé
        </div>
      </div>
    </div>

    <!-- Articolo selezionato: composizione materiali -->
    <div v-if="selectedProduit" class="card">
      <div class="card-header bg-light">
        <h5 class="mb-0">
          <strong>{{ selectedProduitObj.article }}</strong> - {{ selectedProduitObj.description }}
          <span v-if="selectedProduitObj.taille" class="badge bg-secondary ms-2">{{ selectedProduitObj.taille }}</span>
        </h5>
      </div>
      <div class="card-body">

        <!-- Tab fornitori -->
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item" v-for="f in fornitori" :key="f.id">
            <a class="nav-link" :class="{ active: tabFornitore === f.id }" href="#"
              @click.prevent="tabFornitore = f.id; loadDistinta()">
              {{ f.nome }}
              <span v-if="countComponenti[f.id]" class="badge bg-primary ms-1">{{ countComponenti[f.id] }}</span>
            </a>
          </li>
        </ul>

        <!-- Contenuto tab: componenti del fornitore selezionato -->
        <div v-if="tabFornitore">
          <!-- Form aggiunta -->
          <div class="row g-2 mb-3 border-bottom pb-3">
            <div class="col-md-5">
              <div class="position-relative">
                <input v-model="ricercaArticolo" class="form-control form-control-sm"
                  :placeholder="'🔍 Rechercher article ' + fornitoreLabel + '...'"
                  @focus="showDropdown = true" />
                <div v-if="showDropdown && articoliFiltrati.length > 0" class="list-group position-absolute w-100 shadow" style="z-index:10; max-height:200px; overflow-y:auto">
                  <a v-for="a in articoliFiltrati" :key="a.id" href="#"
                    class="list-group-item list-group-item-action small"
                    @click.prevent="selectArticolo(a)">
                    {{ a.codice }} - {{ a.descrizione }} ({{ a.unita }})
                  </a>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <input v-model.number="newComp.quantita_per_unita" type="number" step="0.01"
                class="form-control form-control-sm" placeholder="Qté par unité de pose" />
            </div>
            <div class="col-md-2">
              <input v-model="newComp.note" class="form-control form-control-sm" placeholder="Note" />
            </div>
            <div class="col-md-2">
              <button @click="addComponente" class="btn btn-sm btn-success w-100"
                :disabled="!newComp.articolo_fornitore_id || !newComp.quantita_per_unita">
                + Ajouter
              </button>
            </div>
          </div>

          <!-- Lista componenti -->
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Code</th>
                <th>Désignation</th>
                <th>Unité</th>
                <th>Qté / unité pose</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in distinta" :key="d.id">
                <td><code>{{ d.mat_articoli_fornitore?.codice }}</code></td>
                <td>{{ d.mat_articoli_fornitore?.descrizione }}</td>
                <td>{{ d.mat_articoli_fornitore?.unita }}</td>
                <td>
                  <input v-model.number="d.quantita_per_unita" type="number" step="0.01"
                    class="form-control form-control-sm" style="width:100px" @change="updateQta(d)" />
                </td>
                <td class="small text-muted">{{ d.note }}</td>
                <td>
                  <button @click="removeComp(d.id)" class="btn btn-sm btn-outline-danger">🗑️</button>
                </td>
              </tr>
              <tr v-if="distinta.length === 0">
                <td colspan="6" class="text-center text-muted">Aucun composant pour {{ fornitoreLabel }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Vista riepilogativa tutti i fornitori -->
        <div class="mt-4 border-top pt-3">
          <h6>📊 Récapitulatif tous fournisseurs</h6>
          <div class="table-responsive">
            <table class="table table-sm table-bordered">
              <thead class="table-light">
                <tr>
                  <th>Composant</th>
                  <th v-for="f in fornitori" :key="f.id" class="text-center">{{ f.nome }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in riepilogo" :key="row.label">
                  <td>{{ row.label }}</td>
                  <td v-for="f in fornitori" :key="f.id" class="text-center">
                    <span v-if="row.fornitori[f.id]">{{ row.fornitori[f.id].qta }} {{ row.fornitori[f.id].unita }}</span>
                    <span v-else class="text-muted">—</span>
                  </td>
                </tr>
                <tr v-if="riepilogo.length === 0">
                  <td :colspan="fornitori.length + 1" class="text-center text-muted">Aucun composant défini</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/supabase'

export default {
  name: 'MateriaDistinte',
  setup() {
    const produits = ref([])
    const fornitori = ref([])
    const articoliTab = ref([])
    const distinta = ref([])
    const tutteDistinte = ref([])
    const ricerca = ref('')
    const selectedProduit = ref(null)
    const selectedProduitObj = ref({})
    const tabFornitore = ref(null)
    const countComponenti = ref({})
    const newComp = ref({ articolo_fornitore_id: '', quantita_per_unita: 1, note: '' })
    const ricercaArticolo = ref('')
    const showDropdown = ref(false)

    const articoliFiltrati = computed(() => {
      if (!ricercaArticolo.value) return articoliTab.value.slice(0, 20)
      const q = ricercaArticolo.value.toLowerCase()
      return articoliTab.value.filter(a =>
        (a.codice && a.codice.toLowerCase().includes(q)) ||
        (a.descrizione && a.descrizione.toLowerCase().includes(q))
      ).slice(0, 20)
    })

    const selectArticolo = (a) => {
      newComp.value.articolo_fornitore_id = a.id
      ricercaArticolo.value = `${a.codice} - ${a.descrizione}`
      showDropdown.value = false
    }

    const fornitoreLabel = computed(() => {
      const f = fornitori.value.find(x => x.id === tabFornitore.value)
      return f ? f.nome : ''
    })

    const risultatiRicerca = computed(() => {
      if (!ricerca.value || ricerca.value.length < 2) return []
      const q = ricerca.value.toLowerCase()
      return produits.value.filter(p =>
        (p.article && p.article.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      ).slice(0, 20)
    })

    const riepilogo = computed(() => {
      if (!tutteDistinte.value.length) return []
      const map = {}
      for (const d of tutteDistinte.value) {
        const art = d.mat_articoli_fornitore
        if (!art) continue
        const label = art.descrizione || art.codice
        if (!map[label]) map[label] = { label, fornitori: {} }
        map[label].fornitori[d.fornitore_id] = {
          qta: Number(d.quantita_per_unita).toFixed(2),
          unita: art.unita
        }
      }
      return Object.values(map)
    })

    const loadProduits = async () => {
      const { data } = await supabase.from('produits').select('id, article, description, taille, unite, prix').order('article')
      produits.value = data || []
    }

    const loadFornitori = async () => {
      const { data } = await supabase.from('mat_fornitori').select('*').eq('attivo', true).order('nome')
      fornitori.value = data || []
    }

    const selectProduit = async (p) => {
      selectedProduit.value = p.id
      selectedProduitObj.value = p
      ricerca.value = `${p.article} - ${p.description}`
      // Carica conteggio componenti per fornitore
      await loadCounts()
      // Carica tutte le distinte per riepilogo
      await loadTutteDistinte()
      // Seleziona primo tab
      if (fornitori.value.length > 0) {
        tabFornitore.value = fornitori.value[0].id
        await loadDistinta()
      }
    }

    const loadCounts = async () => {
      const counts = {}
      for (const f of fornitori.value) {
        const { count } = await supabase.from('mat_distinte')
          .select('*', { count: 'exact', head: true })
          .eq('produit_id', selectedProduit.value)
          .eq('fornitore_id', f.id)
        counts[f.id] = count || 0
      }
      countComponenti.value = counts
    }

    const loadTutteDistinte = async () => {
      const { data } = await supabase.from('mat_distinte')
        .select('*, mat_articoli_fornitore(codice, descrizione, unita)')
        .eq('produit_id', selectedProduit.value)
      tutteDistinte.value = data || []
    }

    const loadDistinta = async () => {
      if (!selectedProduit.value || !tabFornitore.value) return
      // Articoli del fornitore
      const { data: arts } = await supabase.from('mat_articoli_fornitore')
        .select('*').eq('fornitore_id', tabFornitore.value).order('codice')
      articoliTab.value = arts || []
      // Distinta
      const { data } = await supabase.from('mat_distinte')
        .select('*, mat_articoli_fornitore(codice, descrizione, unita)')
        .eq('produit_id', selectedProduit.value)
        .eq('fornitore_id', tabFornitore.value)
      distinta.value = data || []
    }

    const addComponente = async () => {
      await supabase.from('mat_distinte').insert({
        produit_id: selectedProduit.value,
        fornitore_id: tabFornitore.value,
        articolo_fornitore_id: newComp.value.articolo_fornitore_id,
        quantita_per_unita: newComp.value.quantita_per_unita,
        note: newComp.value.note || null
      })
      newComp.value = { articolo_fornitore_id: '', quantita_per_unita: 1, note: '' }
      ricercaArticolo.value = ''
      await loadDistinta()
      await loadCounts()
      await loadTutteDistinte()
    }

    const updateQta = async (d) => {
      await supabase.from('mat_distinte').update({ quantita_per_unita: d.quantita_per_unita }).eq('id', d.id)
      await loadTutteDistinte()
    }

    const removeComp = async (id) => {
      if (!confirm('Supprimer ce composant ?')) return
      await supabase.from('mat_distinte').delete().eq('id', id)
      await loadDistinta()
      await loadCounts()
      await loadTutteDistinte()
    }

    onMounted(() => { loadProduits(); loadFornitori() })
    return {
      produits, fornitori, articoliTab, articoliFiltrati, distinta, tutteDistinte,
      ricerca, ricercaArticolo, showDropdown, selectedProduit, selectedProduitObj, tabFornitore,
      countComponenti, newComp, fornitoreLabel,
      risultatiRicerca, riepilogo,
      selectProduit, selectArticolo, loadDistinta, addComponente, updateQta, removeComp
    }
  }
}
</script>
