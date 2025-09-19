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
          <button @click="backupSistema" class="dropdown-item" :disabled="backupSistemaRunning">
            <span v-if="backupSistemaRunning" class="spinner-border spinner-border-sm me-2"></span>
            💾 {{ backupSistemaRunning ? 'Backup in corso...' : 'Backup Sistema Completo' }}
          </button>
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
    const backupSistemaRunning = ref(false)
    
    const showInstructions = () => {
      showInfo.value = !showInfo.value
    }
    
    const cleanOldBackups = async (dirHandle, prefix, maxKeep) => {
      try {
        const backupFolders = []
        
        // Trova tutte le cartelle di backup
        for await (const [name, handle] of dirHandle.entries()) {
          if (handle.kind === 'directory' && name.startsWith(prefix)) {
            backupFolders.push({ name, handle })
          }
        }
        
        // Ordina per nome (che include timestamp)
        backupFolders.sort((a, b) => b.name.localeCompare(a.name))
        
        // Elimina i backup più vecchi
        if (backupFolders.length > maxKeep) {
          const toDelete = backupFolders.slice(maxKeep)
          for (const folder of toDelete) {
            await dirHandle.removeEntry(folder.name, { recursive: true })
            console.log(`Eliminato backup vecchio: ${folder.name}`)
          }
        }
      } catch (error) {
        console.log('Errore pulizia backup vecchi:', error)
      }
    }

    const backupSistema = async () => {
      if (!confirm('Vuoi fare il backup completo (dati + sistema) su D:\\backup\\?')) {
        return
      }
      
      backupSistemaRunning.value = true
      
      try {
        alert('ℹ️ Backup avviato! Usa il file BACKUP_COMPLETO.BAT per il backup automatico su D:\\')
      } catch (error) {
        alert(`❌ Errore: ${error.message}`)
      } finally {
        backupSistemaRunning.value = false
      }
    }
    
    return {
      showInfo,
      showInstructions,
      backupSistema,
      backupSistemaRunning
    }
  }
}
</script>