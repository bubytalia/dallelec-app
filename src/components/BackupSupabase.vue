<template>
  <div class="backup-supabase">
    <button 
      @click="startBackup" 
      :disabled="isBackingUp"
      class="btn btn-outline-info w-100"
      :class="{ 'btn-success': backupSuccess, 'btn-danger': backupError }"
    >
      <i class="bi bi-cloud-download" v-if="!isBackingUp"></i>
      <i class="bi bi-arrow-repeat spin" v-if="isBackingUp"></i>
      {{ buttonText }}
    </button>
    
    <div v-if="backupStatus" class="mt-2">
      <div class="alert" :class="alertClass">
        {{ backupStatus }}
      </div>
    </div>
    
    <div v-if="backupProgress.length > 0" class="mt-2">
      <div class="progress mb-2">
        <div class="progress-bar" :style="`width: ${progressPercent}%`"></div>
      </div>
      <small class="text-muted">{{ currentTable }} ({{ completedTables }}/{{ totalTables }})</small>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { supabase } from '@/supabase.js'

export default {
  name: 'BackupSupabase',
  setup() {
    const isBackingUp = ref(false)
    const backupSuccess = ref(false)
    const backupError = ref(false)
    const backupStatus = ref('')
    const backupProgress = ref([])
    const currentTable = ref('')
    const completedTables = ref(0)
    const totalTables = ref(0)

    const buttonText = computed(() => {
      if (isBackingUp.value) return 'Backup in corso...'
      if (backupSuccess.value) return 'Backup completato!'
      if (backupError.value) return 'Errore backup'
      return '🛡️ Backup Database'
    })

    const alertClass = computed(() => {
      if (backupSuccess.value) return 'alert-success'
      if (backupError.value) return 'alert-danger'
      return 'alert-info'
    })

    const progressPercent = computed(() => {
      if (totalTables.value === 0) return 0
      return Math.round((completedTables.value / totalTables.value) * 100)
    })

    const tables = [
      'absences', 'admins', 'chantiers', 'chefdechantiers', 'clients',
      'collaborateurs', 'conditions', 'configuration', 'devis', 'factures',
      'familles', 'heures_chef_interim', 'heures_chef_propres', 'heures_ouvriers',
      'interimaires', 'metrages', 'paiements', 'produits', 'resoconti_percentuali',
      'sousfamilles', 'supplements', 'techniciens'
    ]

    const startBackup = async () => {
      isBackingUp.value = true
      backupSuccess.value = false
      backupError.value = false
      backupStatus.value = 'Avvio backup...'
      backupProgress.value = []
      completedTables.value = 0
      totalTables.value = tables.length

      try {
        const backupData = {
          timestamp: new Date().toISOString(),
          version: '1.0',
          source: 'Supabase',
          database_url: import.meta.env.VITE_SUPABASE_URL,
          tables: {}
        }

        let totalRecords = 0

        for (const table of tables) {
          currentTable.value = table
          backupStatus.value = `Backup tabella: ${table}`

          try {
            const { data, error, count } = await supabase
              .from(table)
              .select('*', { count: 'exact' })

            if (error) {
              console.error(`Errore tabella ${table}:`, error)
              throw error
            }

            const recordCount = data ? data.length : 0
            
            backupData.tables[table] = {
              count: recordCount,
              data: data || [],
              last_backup: new Date().toISOString(),
              status: 'success',
              table_info: {
                has_data: recordCount > 0,
                first_record: recordCount > 0 ? data[0] : null
              }
            }

            totalRecords += recordCount
            completedTables.value++

          } catch (error) {
            console.error(`Errore backup tabella ${table}:`, error)
            backupData.tables[table] = {
              error: error.message,
              status: 'failed'
            }
            completedTables.value++
          }
        }

        // Salva backup chiamando script PowerShell
        await saveBackupToOneDrive(backupData, totalRecords)

        backupSuccess.value = true
        backupStatus.value = `Backup completato! ${totalRecords} record scaricati in Download. Per OneDrive usa il file .bat`

      } catch (error) {
        console.error('Errore backup:', error)
        backupError.value = true
        backupStatus.value = `Errore: ${error.message}`
      } finally {
        isBackingUp.value = false
        currentTable.value = ''
        
        // Reset dopo 5 secondi
        setTimeout(() => {
          backupSuccess.value = false
          backupError.value = false
          backupStatus.value = ''
          backupProgress.value = []
        }, 5000)
      }
    }

    const saveBackupToOneDrive = async (backupData, totalRecords) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `dallelec-backup-${timestamp}.json`
      
      // Crea il file JSON
      const jsonData = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      
      // Scarica il file automaticamente
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Prova a salvare anche sul Samsung T5
      try {
        await saveToSamsungT5(jsonData, filename)
      } catch (error) {
        console.log('Backup salvato in Download. Samsung T5 non disponibile.')
      }
      
      console.log(`File scaricato: ${filename}`)
    }

    const saveToSamsungT5 = async (jsonData, filename) => {
      // Usa File System Access API se disponibile
      if ('showDirectoryPicker' in window) {
        try {
          const dirHandle = await window.showDirectoryPicker()
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
          const writable = await fileHandle.createWritable()
          await writable.write(jsonData)
          await writable.close()
          console.log('✅ Backup salvato anche sul drive esterno!')
        } catch (error) {
          throw error
        }
      } else {
        throw new Error('File System Access API non supportata')
      }
    }

    return {
      isBackingUp,
      backupSuccess,
      backupError,
      backupStatus,
      backupProgress,
      currentTable,
      completedTables,
      totalTables,
      buttonText,
      alertClass,
      progressPercent,
      startBackup
    }
  }
}
</script>

<style scoped>
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress {
  height: 8px;
}
</style>