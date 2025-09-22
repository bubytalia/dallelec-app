<template>
  <div class="backup-completo">
    <button 
      @click="startCompleteBackup" 
      :disabled="isBackingUp"
      class="btn btn-primary w-100"
      :class="{ 'btn-success': backupSuccess, 'btn-danger': backupError }"
    >
      <i class="bi bi-shield-check" v-if="!isBackingUp"></i>
      <i class="bi bi-arrow-repeat spin" v-if="isBackingUp"></i>
      {{ buttonText }}
    </button>
    
    <div v-if="backupStatus" class="mt-2">
      <div class="alert" :class="alertClass">
        {{ backupStatus }}
      </div>
    </div>
    
    <div v-if="isBackingUp" class="mt-2">
      <div class="progress mb-2">
        <div class="progress-bar" :style="`width: ${progressPercent}%`"></div>
      </div>
      <small class="text-muted">{{ currentOperation }}</small>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { supabase } from '@/supabase.js'

export default {
  name: 'BackupCompleto',
  setup() {
    const isBackingUp = ref(false)
    const backupSuccess = ref(false)
    const backupError = ref(false)
    const backupStatus = ref('')
    const currentOperation = ref('')
    const progressPercent = ref(0)

    const buttonText = computed(() => {
      if (isBackingUp.value) return 'Backup in corso...'
      if (backupSuccess.value) return 'Backup completato!'
      if (backupError.value) return 'Errore backup'
      return '🛡️ Backup Completo (Dati + Sistema)'
    })

    const alertClass = computed(() => {
      if (backupSuccess.value) return 'alert-success'
      if (backupError.value) return 'alert-danger'
      return 'alert-info'
    })

    // Rileva automaticamente tutte le tabelle del database
    const getAllTables = async () => {
      const possibleTables = [
        'clients', 'chantiers', 'devis', 'produits', 'supplements', 
        'familles', 'sousfamilles', 'techniciens', 'admins', 
        'collaborateurs', 'interimaires', 'chefdechantiers',
        'conditions', 'paiements', 'factures', 'metrages',
        'heures', 'heures_chef', 'absences', 'regies', 'configuration',
        'resoconti_percentuali', 'zone_convertite', 'audit_log'
      ]
      
      const existingTables = []
      
      for (const table of possibleTables) {
        try {
          // Usa select count per testare esistenza (funziona anche con tabelle vuote)
          const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
          if (!error) {
            existingTables.push(table)
            console.log(`✅ Tabella trovata: ${table}`)
          } else {
            console.log(`❌ Tabella non trovata: ${table} - ${error.message}`)
          }
        } catch (err) {
          console.log(`❌ Errore tabella ${table}: ${err.message}`)
        }
      }
      
      return existingTables
    }

    const startCompleteBackup = async () => {
      isBackingUp.value = true
      backupSuccess.value = false
      backupError.value = false
      progressPercent.value = 0
      
      try {
        // 1. Backup Database
        currentOperation.value = 'Rilevamento tabelle database...'
        progressPercent.value = 10
        
        const tables = await getAllTables()
        backupStatus.value = `Trovate ${tables.length} tabelle nel database`
        
        currentOperation.value = 'Backup dati Supabase...'
        progressPercent.value = 20
        
        const backupData = {
          timestamp: new Date().toISOString(),
          version: '2.0',
          source: 'Supabase DALLELEC',
          database_url: import.meta.env.VITE_SUPABASE_URL,
          total_tables: tables.length,
          tables: {}
        }

        let totalRecords = 0
        let completedTables = 0

        for (const table of tables) {
          currentOperation.value = `Backup tabella: ${table}`
          
          try {
            const { data, error } = await supabase.from(table).select('*')
            
            if (error) {
              // Se errore 404 o permessi, salta la tabella
              if (error.message.includes('404') || error.message.includes('permission')) {
                console.log(`⚠️ Tabella ${table} saltata: ${error.message}`)
                backupData.tables[table] = {
                  count: 0,
                  data: [],
                  backup_time: new Date().toISOString(),
                  status: 'skipped',
                  reason: error.message
                }
              } else {
                throw error
              }
            } else {
              const recordCount = data ? data.length : 0
              backupData.tables[table] = {
                count: recordCount,
                data: data || [],
                backup_time: new Date().toISOString(),
                status: 'success'
              }
              totalRecords += recordCount
              console.log(`✅ ${table}: ${recordCount} record`)
            }
            
            completedTables++
            progressPercent.value = 20 + (completedTables / tables.length) * 40
            
          } catch (error) {
            console.log(`❌ Errore ${table}: ${error.message}`)
            backupData.tables[table] = {
              error: error.message,
              status: 'failed'
            }
            completedTables++
          }
        }

        // 2. Salva backup dati
        currentOperation.value = 'Salvataggio backup database...'
        progressPercent.value = 70
        
        await saveDataBackup(backupData, totalRecords)
        
        // 3. Backup sistema
        currentOperation.value = 'Backup sistema (codice)...'
        progressPercent.value = 80
        
        await saveSystemBackup()
        
        progressPercent.value = 100
        backupSuccess.value = true
        backupStatus.value = `✅ File scaricati! ${totalRecords} record da ${tables.length} tabelle. Esegui lo script ESEGUI-BACKUP-*.ps1 per completare il salvataggio su D:\\backup`

      } catch (error) {
        console.error('Errore backup:', error)
        backupError.value = true
        backupStatus.value = `❌ Errore: ${error.message}`
      } finally {
        isBackingUp.value = false
        currentOperation.value = ''
        
        setTimeout(() => {
          backupSuccess.value = false
          backupError.value = false
          backupStatus.value = ''
          progressPercent.value = 0
        }, 8000)
      }
    }

    const saveDataBackup = async (backupData, totalRecords) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `dallelec-database-${timestamp}.json`
      
      // Salva il JSON temporaneamente
      const jsonData = JSON.stringify(backupData, null, 2)
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
      
      // Crea script per eseguire backup automatico
      const psScript = `
# Esegui backup completo automatico
$dataFile = "$env:USERPROFILE\\Downloads\\${filename}"
& "C:\\Users\\bubyt\\Desktop\\gestionalequater\\Dallelec_app_new\\scripts\\backup-completo-auto.ps1" -DataFile $dataFile
`
      
      const scriptBlob = new Blob([psScript], { type: 'text/plain' })
      const scriptUrl = URL.createObjectURL(scriptBlob)
      const scriptLink = document.createElement('a')
      scriptLink.href = scriptUrl
      scriptLink.download = `ESEGUI-BACKUP-${timestamp}.ps1`
      scriptLink.style.display = 'none'
      document.body.appendChild(scriptLink)
      scriptLink.click()
      document.body.removeChild(scriptLink)
      URL.revokeObjectURL(scriptUrl)
    }

    const saveSystemBackup = async () => {
      // Il backup sistema è gestito dallo script PowerShell principale
      return Promise.resolve()
    }

    return {
      isBackingUp,
      backupSuccess,
      backupError,
      backupStatus,
      currentOperation,
      progressPercent,
      buttonText,
      alertClass,
      startCompleteBackup
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
  height: 10px;
}
</style>