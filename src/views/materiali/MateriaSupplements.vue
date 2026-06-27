<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>🔧 Matériel Suppléments</h2>
      <router-link to="/admin/materiali" class="btn btn-outline-secondary">← Retour</router-link>
    </div>

    <!-- Selezione supplement + taille + fornitore -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-4">
            <label class="form-label small">Supplément</label>
            <select v-model="selectedSupplement" class="form-select" @change="loadDistinta">
              <option value="">-- Supplément --</option>
              <option v-for="s in supplements" :key="s.id" :value="s.id">{{ s.nom }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small">Taille</label>
            <div class="input-group">
              <select v-model="selectedTaille" class="form-select" v-if="!nouvelleTaille" @change="loadDistinta">
                <option value="">-- Taille --</option>
                <option v-for="t in taillesExistantes" :key="t" :value="t">{{ t }}</option>
              </select>
              <input v-model="selectedTaille" class="form-control" placeholder="Nouvelle taille" v-if="nouvelleTaille" @change="loadDistinta" />
              <button class="btn btn-outline-secondary" @click="nouvelleTaille = !nouvelleTaille">
                {{ nouvelleTaille ? '📋' : '✏️' }}
              </button>
            </div>
          </div>
          <div class="col-md-4">
            <label class="form-label small">Fournisseur</label>
            <select v-model="selectedFornitore" class="form-select" @change="loadDistinta">
              <option value="">-- Fournisseur --</option>
              <option v-for="f in fornitori" :key="f.id" :value="f.id">{{ f.nome }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Composants du supplement sélectionné -->
    <div v-if="selectedSupplement && selectedTaille && selectedFornitore" class="card">
      <div class="card-header bg-light">
        <h5 class="mb-0">
          <strong>{{ selectedSupplementLabel }}</strong>
          <span class="badge bg-secondary ms-2">{{ selectedTaille }}</span>
          <span class="badge bg-primary ms-2">{{ selectedFornitoreLabel }}</span>
        </h5>
      </div>
      <div class="card-body">
        <!-- Form aggiunta -->
        <div class="row g-2 mb-3 border-bottom pb-3">
          <div class="col-md-5">
            <div class="position-relative">
              <input v-model="ricercaArticolo" class="form-control form-control-sm"
                :placeholder="'🔍 Rechercher article ' + selectedFornitoreLabel + '...'"
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
            <input v-model.number="newComp.quantita" type="number" step="0.01"
              class="form-control form-control-sm" placeholder="Qté par occurrence" />
          </div>
          <div class="col-md-2">
            <input v-model="newComp.note" class="form-control form-control-sm" placeholder="Note" />
          </div>
          <div class="col-md-2">
            <button @click="addComponente" class="btn btn-sm btn-success w-100"
              :disabled="!newComp.articolo_fornitore_id || !newComp.quantita">
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
              <th>Qté / occurrence</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in distinta" :key="d.id">
              <td>{{ d.mat_articoli_fornitore?.codice }}</td>
              <td>{{ d.mat_articoli_fornitore?.descrizione }}</td>
              <td>{{ d.mat_articoli_fornitore?.unita }}</td>
              <td>
                <input v-model.number="d.quantita_per_occorrenza" type="number" step="0.01"
                  class="form-control form-control-sm" style="width:100px" @change="updateQta(d)" />
              </td>
              <td class="small text-muted">{{ d.note }}</td>
              <td>
                <button @click="removeComp(d.id)" class="btn btn-sm btn-outline-danger">🗑️</button>
              </td>
            </tr>
            <tr v-if="distinta.length === 0">
              <td colspan="6" class="text-center text-muted">Aucun composant défini</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/supabase'

export default {
  name: 'MateriaSupplements',
  setup() {
    const supplements = ref([])
    const fornitori = ref([])
    const articoliFornitore = ref([])
    const distinta = ref([])
    const selectedSupplement = ref('')
    const selectedTaille = ref('')
    const selectedFornitore = ref('')
    const nouvelleTaille = ref(false)
    const ricercaArticolo = ref('')
    const showDropdown = ref(false)
    const newComp = ref({ articolo_fornitore_id: '', quantita: 1, note: '' })

    const taillesExistantes = computed(() => {
      const tailles = ['60', '100', '150', '200', '300', '400', '500', '600']
      return tailles
    })

    const selectedSupplementLabel = computed(() => {
      const s = supplements.value.find(x => x.id === selectedSupplement.value)
      return s ? s.nom : ''
    })

    const selectedFornitoreLabel = computed(() => {
      const f = fornitori.value.find(x => x.id === selectedFornitore.value)
      return f ? f.nome : ''
    })

    const articoliFiltrati = computed(() => {
      if (!ricercaArticolo.value) return articoliFornitore.value.slice(0, 20)
      const q = ricercaArticolo.value.toLowerCase()
      return articoliFornitore.value.filter(a =>
        (a.codice && a.codice.toLowerCase().includes(q)) ||
        (a.descrizione && a.descrizione.toLowerCase().includes(q))
      ).slice(0, 20)
    })

    const selectArticolo = (a) => {
      newComp.value.articolo_fornitore_id = a.id
      ricercaArticolo.value = `${a.codice} - ${a.descrizione}`
      showDropdown.value = false
    }

    const loadSupplements = async () => {
      const { data } = await supabase.from('supplements').select('*').order('ordre')
      supplements.value = data || []
    }

    const loadFornitori = async () => {
      const { data } = await supabase.from('mat_fornitori').select('*').eq('attivo', true).order('nome')
      fornitori.value = data || []
    }

    const loadDistinta = async () => {
      if (!selectedSupplement.value || !selectedTaille.value || !selectedFornitore.value) {
        distinta.value = []
        return
      }
      // Carica articoli del fornitore
      const { data: arts } = await supabase.from('mat_articoli_fornitore')
        .select('*').eq('fornitore_id', selectedFornitore.value).order('codice')
      articoliFornitore.value = arts || []
      // Carica distinta
      const { data } = await supabase.from('mat_distinte_supplements')
        .select('*, mat_articoli_fornitore(codice, descrizione, unita)')
        .eq('supplement_id', selectedSupplement.value)
        .eq('taille', selectedTaille.value)
        .eq('fornitore_id', selectedFornitore.value)
      distinta.value = data || []
    }

    const addComponente = async () => {
      await supabase.from('mat_distinte_supplements').insert({
        supplement_id: selectedSupplement.value,
        taille: selectedTaille.value,
        fornitore_id: selectedFornitore.value,
        articolo_fornitore_id: newComp.value.articolo_fornitore_id,
        quantita_per_occorrenza: newComp.value.quantita,
        note: newComp.value.note || null
      })
      newComp.value = { articolo_fornitore_id: '', quantita: 1, note: '' }
      ricercaArticolo.value = ''
      loadDistinta()
    }

    const updateQta = async (d) => {
      await supabase.from('mat_distinte_supplements')
        .update({ quantita_per_occorrenza: d.quantita_per_occorrenza }).eq('id', d.id)
    }

    const removeComp = async (id) => {
      if (!confirm('Supprimer ce composant ?')) return
      await supabase.from('mat_distinte_supplements').delete().eq('id', id)
      loadDistinta()
    }

    onMounted(() => { loadSupplements(); loadFornitori() })
    return {
      supplements, fornitori, articoliFornitore, articoliFiltrati, distinta,
      selectedSupplement, selectedTaille, selectedFornitore,
      selectedSupplementLabel, selectedFornitoreLabel, taillesExistantes,
      nouvelleTaille, ricercaArticolo, showDropdown, newComp,
      selectArticolo, loadDistinta, addComponente, updateQta, removeComp
    }
  }
}
</script>
