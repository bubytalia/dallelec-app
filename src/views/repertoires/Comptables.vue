<template>
  <div class="container py-5">
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Comptables</h2>
    
    <div v-if="!tableExists" class="alert alert-warning text-center">
      <h5>⚠️ Tabella 'comptables' non trovata</h5>
      <p>Esegui il file SQL: <code>create-comptables-clientsvip-tables.sql</code></p>
    </div>
    
    <div v-if="tableExists">
      <div class="row mb-3">
        <div class="col">
          <input v-model="newItem.nom" placeholder="Nom" class="form-control" />
        </div>
        <div class="col">
          <input v-model="newItem.prenom" placeholder="Prénom" class="form-control" />
        </div>
        <div class="col">
          <input v-model="newItem.email" placeholder="Email" class="form-control" type="email" />
        </div>
      </div>
      <div class="text-center mb-4">
        <button @click="addItem" class="btn btn-primary">Ajouter</button>
      </div>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Prénom</th>
          <th>Email</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <template v-if="editId === item.id">
            <td><input v-model="editItem.nom" class="form-control" /></td>
            <td><input v-model="editItem.prenom" class="form-control" /></td>
            <td><input v-model="editItem.email" class="form-control" type="email" /></td>
            <td>
              <button @click="updateItem(item.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ item.nom }}</td>
            <td>{{ item.prenom }}</td>
            <td>{{ item.email }}</td>
            <td>
              <button @click="startEdit(item)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteItem(item.id)" class="btn btn-danger btn-sm">🗑</button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import RetourButton from '@/components/RetourButton.vue';

export default {
  name: 'Comptables',
  components: { RetourButton },
  setup() {
    const items = ref([]);
    const newItem = ref({ nom: '', prenom: '', email: '' });
    const editId = ref(null);
    const editItem = ref({});
    const tableExists = ref(true);

    const fetchItems = async () => {
      const { data, error } = await supabase.from('comptables').select('*').order('nom');
      if (!error) {
        items.value = (data || []).filter(i => i.nom);
      } else if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        tableExists.value = false;
      }
    };

    const addItem = async () => {
      if (!newItem.value.nom || !newItem.value.email) return alert('Nom et email requis');
      const { error } = await supabase.from('comptables').insert([newItem.value]);
      if (!error) {
        newItem.value = { nom: '', prenom: '', email: '' };
        fetchItems();
      } else {
        alert('Erreur: ' + error.message);
      }
    };

    const startEdit = (item) => { editId.value = item.id; editItem.value = { ...item }; };
    const cancelEdit = () => { editId.value = null; editItem.value = {}; };

    const updateItem = async (id) => {
      const { error } = await supabase.from('comptables').update(editItem.value).eq('id', id);
      if (!error) { cancelEdit(); fetchItems(); }
    };

    const deleteItem = async (id) => {
      if (!confirm('Confirmer la suppression ?')) return;
      const { error } = await supabase.from('comptables').delete().eq('id', id);
      if (!error) fetchItems();
    };

    onMounted(fetchItems);

    return { items, newItem, addItem, editId, editItem, startEdit, cancelEdit, updateItem, deleteItem, tableExists };
  }
};
</script>
