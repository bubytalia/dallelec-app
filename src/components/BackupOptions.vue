<template>
  <div class="backup-options">
    <div class="dropdown">
      <button class="btn btn-outline-info dropdown-toggle w-100" type="button" data-bs-toggle="dropdown">
        ☁️ Backup Supabase
      </button>
      <ul class="dropdown-menu">
        <li>
          <BackupSupabase class="dropdown-item-text" />
        </li>
        <li><hr class="dropdown-divider"></li>
        <li>
          <button @click="showInstructions" class="dropdown-item">
            📂 Backup su OneDrive
          </button>
        </li>
      </ul>
    </div>
    
    <div v-if="showInfo" class="alert alert-info mt-2 small">
      <strong>Per salvare su OneDrive:</strong><br>
      Usa il file <code>BACKUP_IMMEDIATO_ONEDRIVE.bat</code> sul desktop
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import BackupSupabase from './BackupSupabase.vue'

export default {
  name: 'BackupOptions',
  components: {
    BackupSupabase
  },
  setup() {
    const showInfo = ref(false)
    
    const showInstructions = () => {
      showInfo.value = !showInfo.value
    }
    
    return {
      showInfo,
      showInstructions
    }
  }
}
</script>