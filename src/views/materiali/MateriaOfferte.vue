<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>💰 Offres Fournisseurs</h2>
      <router-link to="/admin/materiali" class="btn btn-outline-secondary">← Retour</router-link>
    </div>

    <!-- Crea nuova offerta -->
    <div class="card mb-4">
      <div class="card-body">
        <h5>{{ editingId ? 'Modifier' : 'Nouvelle' }} Offre</h5>
        <div class="row g-2">
          <div class="col-md-3">
            <select v-model="form.fornitore_id" class="form-select">
              <option value="">-- Fournisseur --</option>
              <option v-for="f in fornitori" :key="f.id" :value="f.id">{{ f.nome }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="form.chantier_id" class="form-select">
              <option value="">-- Chantier --</option>
              <option v-for="c in chantiers" :key="c.id" :value="c.id">{{ c.nom }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <input v-model="form.riferimento" class="form-control" placeholder="Réf. offre" />
          </div>
          <div class="col-md-2">
            <input v-model="form.data_offerta" type="date" class="form-control" />
          </div>
          <div class="col-md-2">
            <button @click="saveOfferta" class="btn btn-primary w-100" :disabled="!form.fornitore_id">
              {{ editingId ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista offerte -->
    <div class="card mb-4">
      <div class="card-body">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Fournisseur</th>
              <th>Chantier</th>
              <th>Référence</th>
              <th>Date</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in offerte" :key="o.id" :class="{'table-success': o.id === selectedOfferta}">
              <td><strong>{{ o.mat_fornitori?.nome }}</strong></td>
              <td>{{ o.chantierNom }}</td>
              <td>{{ o.riferimento }}</td>
              <td>{{ o.data_offerta }}</td>
              <td><span class="badge" :class="badgeClass(o.stato)">{{ o.stato }}</span></td>
              <td>
                <button @click="selectOfferta(o)" class="btn btn-sm btn-outline-primary me-1">📝 Prix</button>
                <button @click="exportExcel(o)" class="btn btn-sm btn-outline-success me-1">📤 Excel</button>
                <button @click="removeOfferta(o.id)" class="btn btn-sm btn-outline-danger">🗑️</button>
              </td>
            </tr>
            <tr v-if="offerte.length === 0">
              <td colspan="6" class="text-center text-muted">Aucune offre</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dettaglio prezzi offerta selezionata -->
    <div v-if="selectedOfferta" class="card">
      <div class="card-body">
        <h5>Prix - {{ selectedOffertaLabel }}</h5>

        <!-- Import Excel -->
        <div class="mb-3">
          <label class="form-label">Importer prix depuis Excel (CSV):</label>
          <input type="file" @change="importExcel" accept=".csv,.xlsx" class="form-control form-control-sm" />
        </div>

        <!-- Aggiungi prezzo manuale -->
        <div class="row g-2 mb-3 border-bottom pb-3">
          <div class="col-md-5">
            <select v-model="newPrezzo.articolo_fornitore_id" class="form-select form-select-sm">
              <option value="">-- Article --</option>
              <option v-for="a in articoliOfferta" :key="a.id" :value="a.id">
                {{ a.codice }} - {{ a.descrizione }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <input v-model.number="newPrezzo.prezzo_unitario" type="number" step="0.01" class="form-control form-control-sm" placeholder="Prix unitaire CHF" />
          </div>
          <div class="col-md-2">
            <input v-model.number="newPrezzo.quantita_minima" type="number" class="form-control form-control-sm" placeholder="Qté min" />
          </div>
          <div class="col-md-2">
            <button @click="addPrezzo" class="btn btn-sm btn-success w-100" :disabled="!newPrezzo.articolo_fornitore_id || !newPrezzo.prezzo_unitario">
              + Ajouter
            </button>
          </div>
        </div>

        <!-- Lista prezzi -->
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Code</th>
              <th>Article</th>
              <th>Prix CHF</th>
              <th>Qté min</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in prezziOfferta" :key="p.id">
              <td><code>{{ p.mat_articoli_fornitore?.codice }}</code></td>
              <td>{{ p.mat_articoli_fornitore?.descrizione }}</td>
              <td><strong>{{ Number(p.prezzo_unitario).toFixed(2) }}</strong></td>
              <td>{{ p.quantita_minima }}</td>
              <td>
                <button @click="removePrezzo(p.id)" class="btn btn-sm btn-outline-danger">🗑️</button>
              </td>
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
  name: 'MateriaOfferte',
  setup() {
    const fornitori = ref([])
    const chantiers = ref([])
    const offerte = ref([])
    const articoliOfferta = ref([])
    const prezziOfferta = ref([])
    const selectedOfferta = ref(null)
    const selectedOffertaLabel = ref('')
    const editingId = ref(null)
    const form = ref({ fornitore_id: '', chantier_id: '', riferimento: '', data_offerta: new Date().toISOString().slice(0, 10) })
    const newPrezzo = ref({ articolo_fornitore_id: '', prezzo_unitario: null, quantita_minima: 1 })

    const badgeClass = (stato) => ({
      'bg-success': stato === 'attiva',
      'bg-warning': stato === 'scaduta',
      'bg-info': stato === 'utilizzata'
    })

    const load = async () => {
      const { data: f } = await supabase.from('mat_fornitori').select('*').eq('attivo', true).order('nome')
      fornitori.value = f || []
      const { data: c } = await supabase.from('chantiers').select('id, nom').order('nom')
      chantiers.value = c || []
      const { data: o } = await supabase.from('mat_offerte').select('*, mat_fornitori(nome)').order('created_at', { ascending: false })
      offerte.value = (o || []).map(off => ({
        ...off,
        chantierNom: chantiers.value.find(ch => ch.id === off.chantier_id)?.nom || '-'
      }))
    }

    const saveOfferta = async () => {
      if (!form.value.fornitore_id) return
      const payload = { ...form.value }
      if (!payload.chantier_id) payload.chantier_id = null
      if (editingId.value) {
        await supabase.from('mat_offerte').update(payload).eq('id', editingId.value)
      } else {
        await supabase.from('mat_offerte').insert(payload)
      }
      form.value = { fornitore_id: '', chantier_id: '', riferimento: '', data_offerta: new Date().toISOString().slice(0, 10) }
      editingId.value = null
      load()
    }

    const selectOfferta = async (o) => {
      selectedOfferta.value = o.id
      selectedOffertaLabel.value = `${o.mat_fornitori?.nome} - ${o.riferimento || o.data_offerta}`
      // Carica articoli del fornitore
      const { data: art } = await supabase.from('mat_articoli_fornitore')
        .select('*').eq('fornitore_id', o.fornitore_id).order('codice')
      articoliOfferta.value = art || []
      // Carica prezzi esistenti
      const { data: pr } = await supabase.from('mat_offerte_prezzi')
        .select('*, mat_articoli_fornitore(codice, descrizione)').eq('offerta_id', o.id).order('created_at')
      prezziOfferta.value = pr || []
    }

    const addPrezzo = async () => {
      await supabase.from('mat_offerte_prezzi').insert({
        offerta_id: selectedOfferta.value,
        articolo_fornitore_id: newPrezzo.value.articolo_fornitore_id,
        prezzo_unitario: newPrezzo.value.prezzo_unitario,
        quantita_minima: newPrezzo.value.quantita_minima || 1
      })
      newPrezzo.value = { articolo_fornitore_id: '', prezzo_unitario: null, quantita_minima: 1 }
      selectOfferta(offerte.value.find(o => o.id === selectedOfferta.value))
    }

    const removePrezzo = async (id) => {
      await supabase.from('mat_offerte_prezzi').delete().eq('id', id)
      selectOfferta(offerte.value.find(o => o.id === selectedOfferta.value))
    }

    const removeOfferta = async (id) => {
      if (!confirm('Supprimer cette offre et tous ses prix ?')) return
      await supabase.from('mat_offerte').delete().eq('id', id)
      selectedOfferta.value = null
      load()
    }

    const exportExcel = (o) => {
      const fornitore = fornitori.value.find(f => f.id === o.fornitore_id)
      // Genera CSV con gli articoli del fornitore
      const arts = articoliOfferta.value.length > 0 ? articoliOfferta.value : []
      let csv = 'Code;Description;Unité;Prix Unitaire CHF;Quantité Min\n'
      arts.forEach(a => { csv += `${a.codice};${a.descrizione};${a.unita};;\n` })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `demande_prix_${fornitore?.nome || 'fournisseur'}_${o.data_offerta}.csv`
      link.click()
    }

    const importExcel = async (event) => {
      const file = event.target.files[0]
      if (!file) return
      const text = await file.text()
      const lines = text.split('\n').slice(1).filter(l => l.trim())
      for (const line of lines) {
        const parts = line.split(';')
        if (parts.length >= 4 && parts[3]?.trim()) {
          const codice = parts[0].trim()
          const prezzo = parseFloat(parts[3].trim())
          const qtaMin = parts[4] ? parseInt(parts[4].trim()) : 1
          if (isNaN(prezzo)) continue
          const art = articoliOfferta.value.find(a => a.codice === codice)
          if (art) {
            await supabase.from('mat_offerte_prezzi').insert({
              offerta_id: selectedOfferta.value,
              articolo_fornitore_id: art.id,
              prezzo_unitario: prezzo,
              quantita_minima: qtaMin || 1
            })
          }
        }
      }
      selectOfferta(offerte.value.find(o => o.id === selectedOfferta.value))
    }

    onMounted(load)
    return {
      fornitori, chantiers, offerte, articoliOfferta, prezziOfferta,
      selectedOfferta, selectedOffertaLabel, editingId, form, newPrezzo,
      badgeClass, saveOfferta, selectOfferta, addPrezzo, removePrezzo,
      removeOfferta, exportExcel, importExcel
    }
  }
}
</script>
