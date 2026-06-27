<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>🚚 Fournisseurs Matériaux</h2>
      <router-link to="/admin/materiali" class="btn btn-outline-secondary">← Retour</router-link>
    </div>

    <!-- Form aggiunta/modifica -->
    <div class="card mb-4">
      <div class="card-body">
        <h5>{{ editingId ? 'Modifier' : 'Ajouter' }} Fournisseur</h5>
        <div class="row g-2">
          <div class="col-md-3">
            <input v-model="form.nome" class="form-control" placeholder="Nom *" />
          </div>
          <div class="col-md-2">
            <input v-model="form.referente" class="form-control" placeholder="Référent" />
          </div>
          <div class="col-md-2">
            <input v-model="form.telefono" class="form-control" placeholder="Téléphone" />
          </div>
          <div class="col-md-3">
            <input v-model="form.email" class="form-control" placeholder="Email" />
          </div>
          <div class="col-md-2">
            <button @click="save" class="btn btn-primary w-100" :disabled="!form.nome">
              {{ editingId ? 'Modifier' : 'Ajouter' }}
            </button>
          </div>
        </div>
        <div class="row g-2 mt-2">
          <div class="col-md-10">
            <input v-model="form.note" class="form-control" placeholder="Notes" />
          </div>
          <div class="col-md-2" v-if="editingId">
            <button @click="cancelEdit" class="btn btn-outline-secondary w-100">Annuler</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista fornitori -->
    <div class="card">
      <div class="card-body">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Référent</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Articles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in fornitori" :key="f.id">
              <td><strong>{{ f.nome }}</strong></td>
              <td>{{ f.referente }}</td>
              <td>{{ f.telefono }}</td>
              <td>{{ f.email }}</td>
              <td>
                <router-link :to="'/admin/materiali/fornitori/' + f.id + '/articoli'" class="btn btn-sm btn-outline-primary">
                  📋 Articles
                </router-link>
              </td>
              <td>
                <button @click="edit(f)" class="btn btn-sm btn-outline-warning me-1">✏️</button>
                <button @click="remove(f.id)" class="btn btn-sm btn-outline-danger">🗑️</button>
              </td>
            </tr>
            <tr v-if="fornitori.length === 0">
              <td colspan="6" class="text-center text-muted">Aucun fournisseur enregistré</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase'

export default {
  name: 'MateriaFornitori',
  setup() {
    const fornitori = ref([])
    const editingId = ref(null)
    const form = ref({ nome: '', referente: '', telefono: '', email: '', note: '' })

    const load = async () => {
      const { data } = await supabase.from('mat_fornitori').select('*').eq('attivo', true).order('nome')
      fornitori.value = data || []
    }

    const save = async () => {
      if (!form.value.nome) return
      if (editingId.value) {
        await supabase.from('mat_fornitori').update(form.value).eq('id', editingId.value)
      } else {
        await supabase.from('mat_fornitori').insert(form.value)
      }
      cancelEdit()
      load()
    }

    const edit = (f) => {
      editingId.value = f.id
      form.value = { nome: f.nome, referente: f.referente, telefono: f.telefono, email: f.email, note: f.note }
    }

    const cancelEdit = () => {
      editingId.value = null
      form.value = { nome: '', referente: '', telefono: '', email: '', note: '' }
    }

    const remove = async (id) => {
      if (!confirm('Supprimer ce fournisseur ?')) return
      await supabase.from('mat_fornitori').update({ attivo: false }).eq('id', id)
      load()
    }

    onMounted(load)
    return { fornitori, form, editingId, save, edit, cancelEdit, remove }
  }
}
</script>
