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

    // Testa quali tabelle esistono davvero
    const getAvailableTables = async () => {
      const possibleTables = [
        'clients', 'chantiers', 'devis', 'produits', 'supplements', 
        'familles', 'sousfamilles', 'admins', 'chefdechantiers', 
        'collaborateurs', 'techniciens', 'interimaires'
      ]
      
      const existingTables = []
      
      for (const table of possibleTables) {
        try {
          const { error } = await supabase.from(table).select('*').limit(1)
          if (!error) {
            existingTables.push(table)
          }
        } catch {
          // Tabella non esiste, salta
        }
      }
      
      return existingTables
    }

    const startBackup = async () => {
      isBackingUp.value = true
      backupSuccess.value = false
      backupError.value = false
      backupStatus.value = 'Scoprendo tabelle disponibili...'
      backupProgress.value = []
      
      // Scopre le tabelle esistenti
      const tables = await getAvailableTables()
      completedTables.value = 0
      totalTables.value = tables.length
      
      backupStatus.value = `Trovate ${tables.length} tabelle. Inizio backup...`

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
        backupStatus.value = `✅ Backup completato! ${totalRecords} record scaricati. Spostare il file su D:\\backup\\backup_dati\\`

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
      
      // Scarica il file (poi spostare manualmente su D:\)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      console.log(`✅ File scaricato: ${filename} - Spostare su D:\\backup\\backup_dati\\`)
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