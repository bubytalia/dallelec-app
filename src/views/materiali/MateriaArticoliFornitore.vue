<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>📋 Articles - {{ fornitoreNome }}</h2>
      <router-link to="/admin/materiali/fornitori" class="btn btn-outline-secondary">← Retour</router-link>
    </div>

    <!-- Form aggiunta -->
    <div class="card mb-4">
      <div class="card-body">
        <h5>{{ editingId ? 'Modifier' : 'Ajouter' }} Article</h5>
        <div class="row g-2">
          <div class="col-md-2">
            <input v-model="form.codice" class="form-control" placeholder="Code *" />
          </div>
          <div class="col-md-4">
            <input v-model="form.descrizione" class="form-control" placeholder="Description *" />
          </div>
          <div class="col-md-1">
            <input v-model="form.taille" class="form-control" placeholder="Taille" />
          </div>
          <div class="col-md-1">
            <select v-model="form.unita" class="form-select">
              <option value="pce">pce</option>
              <option value="ml">ml</option>
              <option value="m²">m²</option>
              <option value="kit">kit</option>
              <option value="lot">lot</option>
              <option value="m">m</option>
              <option value="kg">kg</option>
            </select>
          </div>
          <div class="col-md-2">
            <div class="input-group">
              <select v-model="form.categoria" class="form-select" v-if="!nuovaCategoria">
                <option value="">-- Catégorie --</option>
                <option v-for="c in categorieEsistenti" :key="c" :value="c">{{ c }}</option>
              </select>
              <input v-model="form.categoria" class="form-control" placeholder="Nouvelle catégorie" v-if="nuovaCategoria" />
              <button class="btn btn-outline-secondary" type="button" @click="nuovaCategoria = !nuovaCategoria" :title="nuovaCategoria ? 'Liste' : 'Nouvelle'">
                {{ nuovaCategoria ? '📋' : '✏️' }}
              </button>
            </div>
          </div>
          <div class="col-md-2">
            <button @click="save" class="btn btn-primary w-100" :disabled="!form.codice || !form.descrizione">
              {{ editingId ? 'Modifier' : 'Ajouter' }}
            </button>
          </div>
        </div>
        <div class="row g-2 mt-2" v-if="editingId">
          <div class="col-md-10">
            <input v-model="form.note" class="form-control" placeholder="Notes" />
          </div>
          <div class="col-md-2">
            <button @click="cancelEdit" class="btn btn-outline-secondary w-100">Annuler</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtro -->
    <div class="mb-3">
      <input v-model="filtro" class="form-control" placeholder="🔍 Filtrer par code ou description..." />
    </div>

    <!-- Lista articoli -->
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover table-sm">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Taille</th>
                <th>Unité</th>
                <th>Catégorie</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in articoliFiltrati" :key="a.id">
                <td>{{ a.codice }}</td>
                <td>{{ a.descrizione }}</td>
                <td>{{ a.taille }}</td>
                <td>{{ a.unita }}</td>
                <td>{{ a.categoria }}</td>
                <td>
                  <button @click="edit(a)" class="btn btn-sm btn-outline-warning me-1">✏️</button>
                  <button @click="remove(a.id)" class="btn btn-sm btn-outline-danger">🗑️</button>
                </td>
              </tr>
              <tr v-if="articoliFiltrati.length === 0">
                <td colspan="6" class="text-center text-muted">Aucun article</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="text-muted small">{{ articoli.length }} articles au total</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'MateriaArticoliFornitore',
  setup() {
    const route = useRoute()
    const fornitoreId = route.params.fornitoreId
    const fornitoreNome = ref('')
    const articoli = ref([])
    const filtro = ref('')
    const editingId = ref(null)
    const form = ref({ codice: '', descrizione: '', taille: '', unita: 'pz', categoria: '', note: '' })
    const nuovaCategoria = ref(false)

    const categorieEsistenti = computed(() => {
      const cats = articoli.value.map(a => a.categoria).filter(Boolean)
      return [...new Set(cats)].sort()
    })

    const articoliFiltrati = computed(() => {
      if (!filtro.value) return articoli.value
      const f = filtro.value.toLowerCase()
      return articoli.value.filter(a =>
        a.codice.toLowerCase().includes(f) || a.descrizione.toLowerCase().includes(f)
      )
    })

    const loadFornitore = async () => {
      const { data } = await supabase.from('mat_fornitori').select('nome').eq('id', fornitoreId).single()
      fornitoreNome.value = data?.nome || ''
    }

    const load = async () => {
      const { data } = await supabase.from('mat_articoli_fornitore')
        .select('*').eq('fornitore_id', fornitoreId).order('codice')
      articoli.value = data || []
    }

    const save = async () => {
      if (!form.value.codice || !form.value.descrizione) return
      const payload = { ...form.value, fornitore_id: fornitoreId }
      if (editingId.value) {
        await supabase.from('mat_articoli_fornitore').update(payload).eq('id', editingId.value)
      } else {
        await supabase.from('mat_articoli_fornitore').insert(payload)
      }
      cancelEdit()
      load()
    }

    const edit = (a) => {
      editingId.value = a.id
      form.value = { codice: a.codice, descrizione: a.descrizione, taille: a.taille || '', unita: a.unita, categoria: a.categoria, note: a.note }
    }

    const cancelEdit = () => {
      editingId.value = null
      form.value = { codice: '', descrizione: '', taille: '', unita: 'pz', categoria: '', note: '' }
    }

    const remove = async (id) => {
      if (!confirm('Supprimer cet article ?')) return
      await supabase.from('mat_articoli_fornitore').delete().eq('id', id)
      load()
    }

    onMounted(() => { loadFornitore(); load() })
    return { fornitoreNome, articoli, articoliFiltrati, categorieEsistenti, filtro, form, editingId, nuovaCategoria, save, edit, cancelEdit, remove }
  }
}
</script>
