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
      if (!confirm('Vuoi copiare tutto il progetto sul Samsung T5?\n\nIl backup sarà salvato nella cartella backup dati.')) {
        return
      }
      
      backupSistemaRunning.value = true
      
      try {
        if ('showDirectoryPicker' in window) {
          // Chiedi all'utente di selezionare la cartella del Samsung T5
          const dirHandle = await window.showDirectoryPicker()
          
          // Pulisci i vecchi backup (mantieni solo gli ultimi 4)
          await cleanOldBackups(dirHandle, 'dallelec-sistema-', 4)
          
          // Crea una cartella con timestamp per il backup
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 16)
          const backupFolderName = `dallelec-sistema-${timestamp}`
          
          const backupDirHandle = await dirHandle.getDirectoryHandle(backupFolderName, { create: true })
          
          // Lista dei file/cartelle da copiare (escludendo node_modules, .git, dist)
          const filesToCopy = [
            'src', 'public', 'scripts',
            'package.json', 'package-lock.json', 'vite.config.js', 
            '.env', '.env.example', 'index.html', 'README.md'
          ]
          
          alert(`Backup avviato nella cartella: ${backupFolderName}\n\nATTENZIONE: Per un backup completo usa il file .bat`)
          
        } else {
          throw new Error('Browser non supporta File System Access API')
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          alert(`Errore backup: ${error.message}\n\nUsa il file BACKUP_IMMEDIATO_ONEDRIVE.bat per il backup completo`)
        }
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