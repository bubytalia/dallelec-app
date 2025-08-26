<template>
  <div class="container py-5">
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Administrateurs</h2>
    
    <div class="row mb-3">
      <div class="col">
        <input v-model="newAdmin.nom" placeholder="Nom" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newAdmin.prenom" placeholder="Prénom" class="form-control" />
      </div>
      <div class="col">
        <input v-model="newAdmin.email" placeholder="Email" class="form-control" type="email" />
      </div>
    </div>
    <div class="text-center mb-4">
      <button @click="addAdmin" class="btn btn-primary">Ajouter</button>
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
        <tr v-for="admin in admins" :key="admin.id">
          <template v-if="editId === admin.id">
            <td><input v-model="editAdmin.nom" class="form-control" /></td>
            <td><input v-model="editAdmin.prenom" class="form-control" /></td>
            <td><input v-model="editAdmin.email" class="form-control" type="email" /></td>
            <td>
              <button @click="updateAdmin(admin.id)" class="btn btn-success btn-sm">✔</button>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ admin.nom }}</td>
            <td>{{ admin.prenom }}</td>
            <td>{{ admin.email }}</td>
            <td>
              <button @click="startEdit(admin)" class="btn btn-warning btn-sm">✎</button>
              <button @click="deleteAdmin(admin.id)" class="btn btn-danger btn-sm">🗑</button>
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
  name: 'Admins',
  components: {
    RetourButton
  },
  setup() {
    const admins = ref([]);
    const newAdmin = ref({
      nom: '',
      prenom: '',
      email: ''
    });

    const editId = ref(null);
    const editAdmin = ref({});

    const fetchAdmins = async () => {
      const { data, error } = await supabase.from('admins').select('*').order('nom');
      if (!error) {
        admins.value = (data || []).filter(admin => admin.nom); // Filtra admin senza nome
      }
    };

    const addAdmin = async () => {
      const { error } = await supabase.from('admins').insert([newAdmin.value]);
      if (!error) {
        newAdmin.value = { nom: '', prenom: '', email: '' };
        fetchAdmins();
      }
    };

    const startEdit = (admin) => {
      editId.value = admin.id;
      editAdmin.value = { ...admin };
    };

    const cancelEdit = () => {
      editId.value = null;
      editAdmin.value = {};
    };

    const updateAdmin = async (id) => {
      const { error } = await supabase.from('admins').update(editAdmin.value).eq('id', id);
      if (!error) {
        cancelEdit();
        fetchAdmins();
      }
    };

    const deleteAdmin = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        const { error } = await supabase.from('admins').delete().eq('id', id);
        if (!error) fetchAdmins();
      }
    };

    onMounted(fetchAdmins);

    return {
      admins,
      newAdmin,
      addAdmin,
      editId,
      editAdmin,
      startEdit,
      cancelEdit,
      updateAdmin,
      deleteAdmin
    };
  }
};
</script>