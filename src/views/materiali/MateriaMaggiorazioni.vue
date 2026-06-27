<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>📊 Majorations</h2>
      <router-link to="/admin/materiali" class="btn btn-outline-secondary">← Retour</router-link>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <h5>Majorations globales (appliquées à tous les articles)</h5>
        <p class="text-muted small">Ces pourcentages sont appliqués au sous-total matériaux pour calculer le prix final.</p>

        <!-- Form -->
        <div class="row g-2 mb-3">
          <div class="col-md-4">
            <input v-model="form.nome" class="form-control" placeholder="Nom (ex: Déchet, Gestion chantier, Bénéfice) *" />
          </div>
          <div class="col-md-2">
            <div class="input-group">
              <input v-model.number="form.percentuale" type="number" step="0.5" class="form-control" placeholder="%" />
              <span class="input-group-text">%</span>
            </div>
          </div>
          <div class="col-md-2">
            <input v-model.number="form.ordine" type="number" class="form-control" placeholder="Ordre" />
          </div>
          <div class="col-md-2">
            <button @click="save" class="btn btn-primary w-100" :disabled="!form.nome">
              {{ editingId ? 'Modifier' : 'Ajouter' }}
            </button>
          </div>
          <div class="col-md-2" v-if="editingId">
            <button @click="cancelEdit" class="btn btn-outline-secondary w-100">Annuler</button>
          </div>
        </div>

        <!-- Lista -->
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Ordre</th>
              <th>Nom</th>
              <th>Pourcentage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in maggiorazioni" :key="m.id">
              <td>{{ m.ordine }}</td>
              <td>{{ m.nome }}</td>
              <td><strong>{{ m.percentuale }}%</strong></td>
              <td>
                <button @click="edit(m)" class="btn btn-sm btn-outline-warning me-1">✏️</button>
                <button @click="remove(m.id)" class="btn btn-sm btn-outline-danger">🗑️</button>
              </td>
            </tr>
            <tr v-if="maggiorazioni.length === 0">
              <td colspan="4" class="text-center text-muted">Aucune majoration définie</td>
            </tr>
          </tbody>
          <tfoot v-if="maggiorazioni.length > 0">
            <tr class="table-info">
              <td colspan="2"><strong>Total majorations</strong></td>
              <td><strong>{{ totaleMagg }}%</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/supabase'

export default {
  name: 'MateriaMaggiorazioni',
  setup() {
    const maggiorazioni = ref([])
    const editingId = ref(null)
    const form = ref({ nome: '', percentuale: 0, ordine: 0 })

    const totaleMagg = computed(() =>
      maggiorazioni.value.reduce((s, m) => s + Number(m.percentuale), 0).toFixed(1)
    )

    const load = async () => {
      const { data } = await supabase.from('mat_maggiorazioni')
        .select('*').eq('applicazione', 'globale').eq('attivo', true).order('ordine')
      maggiorazioni.value = data || []
    }

    const save = async () => {
      if (!form.value.nome) return
      const payload = { ...form.value, applicazione: 'globale', attivo: true }
      if (editingId.value) {
        await supabase.from('mat_maggiorazioni').update(payload).eq('id', editingId.value)
      } else {
        await supabase.from('mat_maggiorazioni').insert(payload)
      }
      cancelEdit()
      load()
    }

    const edit = (m) => {
      editingId.value = m.id
      form.value = { nome: m.nome, percentuale: m.percentuale, ordine: m.ordine }
    }

    const cancelEdit = () => {
      editingId.value = null
      form.value = { nome: '', percentuale: 0, ordine: 0 }
    }

    const remove = async (id) => {
      if (!confirm('Supprimer ?')) return
      await supabase.from('mat_maggiorazioni').update({ attivo: false }).eq('id', id)
      load()
    }

    onMounted(load)
    return { maggiorazioni, form, editingId, totaleMagg, save, edit, cancelEdit, remove }
  }
}
</script>
