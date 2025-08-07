<template>
  <div class="container py-5">
    <!-- Pulsante Retour standardizzato -->
    <RetourButton to="/admin/repertoires" />

    <h2 class="text-center mb-4">Conditions de Vente</h2>

    <!-- Formulaire d'ajout d'une nouvelle condition -->
    <div class="row mb-3 justify-content-center">
      <div class="col-md-4">
        <input
          v-model="newCondition.texte"
          placeholder="Texte de la condition"
          class="form-control mb-2"
        />
      </div>
      <div class="col-md-2">
        <select v-model="newCondition.type" class="form-select mb-2">
          <option disabled value="">Type</option>
          <option value="comprend">Comprend</option>
          <option value="ne_comprend_pas">Ne comprend pas</option>
        </select>
      </div>
      <div class="col-md-2 d-flex align-items-center">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            v-model="newCondition.default"
            id="newDefault"
          />
          <label class="form-check-label" for="newDefault">Par défaut</label>
        </div>
      </div>
    </div>

    <div class="text-center mb-4">
      <button @click="addCondition" class="btn btn-primary">Ajouter</button>
    </div>

    <!-- Tableau des conditions existantes -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Texte</th>
          <th>Type</th>
          <th>Par défaut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cond in conditions" :key="cond.id">
          <template v-if="editId === cond.id">
            <td><input v-model="editCondition.texte" class="form-control" /></td>
            <td>
              <select v-model="editCondition.type" class="form-select">
                <option value="comprend">Comprend</option>
                <option value="ne_comprend_pas">Ne comprend pas</option>
              </select>
            </td>
            <td class="text-center">
              <input type="checkbox" class="form-check-input" v-model="editCondition.default" />
            </td>
            <td>
              <button class="btn btn-success btn-sm me-1" @click="updateCondition(cond.id)">✔</button>
              <button class="btn btn-secondary btn-sm" @click="cancelEdit">✖</button>
            </td>
          </template>
          <template v-else>
            <td>{{ cond.texte }}</td>
            <td>{{ cond.type === 'comprend' ? 'Comprend' : 'Ne comprend pas' }}</td>
            <td class="text-center">
              <span v-if="cond.default">✔</span>
            </td>
            <td>
              <button class="btn btn-warning btn-sm me-1" @click="startEdit(cond)">✎</button>
              <button class="btn btn-danger btn-sm" @click="deleteCondition(cond.id)">🗑</button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

export default {
  name: 'Conditions',
  components: {
    RetourButton
  },
  setup() {
    const conditions = ref([]);
    const newCondition = ref({ texte: '', type: '', default: false });

    const editId = ref(null);
    const editCondition = ref({ texte: '', type: '', default: false });

    const fetchConditions = async () => {
      const snapshot = await getDocs(collection(db, 'conditions'));
      conditions.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const addCondition = async () => {
      if (newCondition.value.texte.trim() && newCondition.value.type) {
        await addDoc(collection(db, 'conditions'), newCondition.value);
        newCondition.value = { texte: '', type: '', default: false };
        fetchConditions();
      }
    };

    const startEdit = (cond) => {
      editId.value = cond.id;
      editCondition.value = {
        texte: cond.texte,
        type: cond.type,
        default: cond.default || false
      };
    };

    const cancelEdit = () => {
      editId.value = null;
      editCondition.value = { texte: '', type: '', default: false };
    };

    const updateCondition = async (id) => {
      await updateDoc(doc(db, 'conditions', id), editCondition.value);
      cancelEdit();
      fetchConditions();
    };

    const deleteCondition = async (id) => {
      if (confirm('Confirmer la suppression ?')) {
        await deleteDoc(doc(db, 'conditions', id));
        fetchConditions();
      }
    };

    onMounted(fetchConditions);

    return {
      conditions,
      newCondition,
      addCondition,
      editId,
      editCondition,
      startEdit,
      cancelEdit,
      updateCondition,
      deleteCondition
    };
  }
};
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: auto;
}
.table {
  margin-top: 30px;
}
</style>