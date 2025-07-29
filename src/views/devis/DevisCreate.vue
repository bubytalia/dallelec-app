<template>
  <div class="container py-5">
    <h2 class="text-center mb-4">Nouveau Devis</h2>

    <!-- Informations du chantier -->
    <div class="card p-4 mb-4">
      <h5>Informations du chantier</h5>

      <div class="row mb-3">
        <div class="col">
          <input v-model="form.nom" class="form-control" placeholder="Nom du chantier" />
        </div>
        <div class="col">
          <input v-model="form.adresse" class="form-control" placeholder="Adresse du chantier" />
        </div>
      </div>

      <div class="row mb-3">
        <div class="col">
          <select v-model="form.client" class="form-select">
            <option disabled value="">Sélectionner un client</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.nom }}
            </option>
          </select>
        </div>
        <div class="col">
          <select v-model="form.technicien" class="form-select">
            <option disabled value="">Technicien du client</option>
            <option v-for="tech in filteredTechniciens" :key="tech.id" :value="tech.nom">
              {{ tech.nom }}
            </option>
          </select>
        </div>
      </div>

      <div>
        <label>Zones de chantier</label>
        <input
          v-model="newZone"
          @keyup.enter="addZone"
          class="form-control mb-2"
          placeholder="Ajouter une zone et appuyez sur Entrée"
        />
        <div>
          <span v-for="(zone, index) in zones" :key="index" class="badge bg-primary me-2">
            {{ zone }} <span class="ms-1 cursor-pointer" @click="removeZone(index)">&times;</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Remise par famille -->
    <div class="card p-4 mb-4">
      <h5>Remise par famille</h5>
      <table class="table">
        <thead>
          <tr>
            <th>Famille</th>
            <th>Sous-famille</th>
            <th>Remise (%)</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fam in familles" :key="fam.id">
            <td>{{ fam.nom }}</td>
            <td>
              <select v-model="remiseSelection[fam.id]" class="form-select">
                <option disabled value="">Sélectionnez une sous-famille</option>
                <option
                  v-for="sous in sousfamilles.filter(s => s.familleId === fam.id)"
                  :key="sous.id"
                  :value="sous.id"
                >
                  {{ sous.nom }}
                </option>
              </select>
            </td>
            <td>{{ getRemisePourcentage(fam.id) }} %</td>
            <td class="text-center">
              <input type="checkbox" class="form-check-input" :checked="!!remiseSelection[fam.id]" disabled />
            </td>
          </tr>
        </tbody>
      </table>

      <div class="text-end">
        <strong>Remise totale: {{ remiseTotale }}%</strong>
      </div>
    </div>

    <!-- Continuer -->
    <div class="text-end">
      <button class="btn btn-success" :disabled="!formReady" @click="continuerVersDevis">
        Continuer vers le devis
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '@/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const router = useRouter();

const form = ref({
  nom: '',
  adresse: '',
  client: '',
  technicien: ''
});

const newZone = ref('');
const zones = ref([]);
const clients = ref([]);
const techniciens = ref([]);
const familles = ref([]);
const sousfamilles = ref([]);
const remiseSelection = ref({});

const addZone = () => {
  if (newZone.value.trim()) {
    zones.value.push(newZone.value.trim());
    newZone.value = '';
  }
};

const removeZone = (index) => {
  zones.value.splice(index, 1);
};

const filteredTechniciens = computed(() =>
  techniciens.value.filter(t => t.clientId === form.value.client)
);

const getRemisePourcentage = (familleId) => {
  const id = remiseSelection.value[familleId];
  const sous = sousfamilles.value.find(s => s.id === id);
  return sous ? Number(sous.pourcentage) || 0 : 0;
};

const remiseTotale = computed(() => {
  return Object.values(remiseSelection.value)
    .map(id => {
      const sous = sousfamilles.value.find(s => s.id === id);
      return sous ? Number(sous.pourcentage) || 0 : 0;
    })
    .reduce((acc, val) => acc + val, 0);
});

const formReady = computed(() => {
  return (
    form.value.nom &&
    form.value.adresse &&
    form.value.client &&
    form.value.technicien &&
    zones.value.length > 0 &&
    Object.keys(remiseSelection.value).length === familles.value.length
  );
});

const continuerVersDevis = async () => {
  try {
    // 🔢 Generazione numero devis progressivo
    const counterRef = doc(db, 'counters', 'devis');
    let numeroDevis = 'DEV-0001';

    const counterSnap = await getDoc(counterRef);
    if (counterSnap.exists()) {
      const last = counterSnap.data().lastNumber || 0;
      const next = last + 1;
      numeroDevis = `DEV-${next.toString().padStart(4, '0')}`;
      await updateDoc(counterRef, { lastNumber: next });
    } else {
      await setDoc(counterRef, { lastNumber: 1 });
    }

    const newDevis = {
      numero: numeroDevis,
      nom: form.value.nom,
      adresse: form.value.adresse,
      clientId: form.value.client,
      technicien: form.value.technicien,
      zones: zones.value,
      remises: remiseSelection.value,
      createdAt: new Date(),
      produits: [],
      total: 0
    };

    const docRef = await addDoc(collection(db, 'devis'), newDevis);
    router.push(`/devis/produits/${docRef.id}`);
  } catch (error) {
    console.error("Errore durante la creazione del devis:", error);
    alert("C'è stato un errore durante il salvataggio.");
  }
};


onMounted(async () => {
  const [clientSnap, techSnap, famSnap, sousSnap] = await Promise.all([
    getDocs(collection(db, 'clients')),
    getDocs(collection(db, 'techniciens')),
    getDocs(collection(db, 'familles')),
    getDocs(collection(db, 'sousfamilles'))
  ]);

  clients.value = clientSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  techniciens.value = techSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  familles.value = famSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  sousfamilles.value = sousSnap.docs.map(d => ({ id: d.id, ...d.data() }));
});


// Salva automaticamente le zone cantiere ogni volta che cambiano
watch(() => form.zones, (newZones) => {
  const zones = newZones?.filter(z => z?.trim?.() !== '') || [];
  localStorage.setItem('zonesCantiere', JSON.stringify(zones));
}, { deep: true });
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
