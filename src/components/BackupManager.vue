<template>
  <div class="card">
    <div class="card-header">
      <h5>🛡️ Gestione Backup Database</h5>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-md-6">
          <h6>Backup Manuale</h6>
          <button 
            @click="createBackup" 
            :disabled="isCreatingBackup"
            class="btn btn-primary"
          >
            <i class="bi bi-download"></i>
            {{ isCreatingBackup ? 'Creazione...' : 'Crea Backup Ora' }}
          </button>
          <small class="text-muted d-block mt-2">
            Scarica tutti i dati del database in formato JSON (backup locale)
          </small>
        </div>
        
        <div class="col-md-6">
          <h6>Ultimo Backup</h6>
          <p class="text-muted">
            {{ lastBackup || 'Nessun backup trovato' }}
          </p>
          <div class="form-check">
            <input 
              class="form-check-input" 
              type="checkbox" 
              v-model="autoBackupEnabled"
              @change="toggleAutoBackup"
              id="autoBackup"
            >
            <label class="form-check-label" for="autoBackup">
              Backup automatico settimanale
            </label>
          </div>
        </div>
      </div>
      
      <div v-if="backupStatus" class="alert mt-3" :class="backupStatus.success ? 'alert-success' : 'alert-danger'">
        {{ backupStatus.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { SimpleBackup } from '@/utils/simpleBackup'

const isCreatingBackup = ref(false)
const autoBackupEnabled = ref(false)
const lastBackup = ref('')
const backupStatus = ref(null)

const createBackup = async () => {
  isCreatingBackup.value = true
  backupStatus.value = null
  
  try {
    const result = await SimpleBackup.createBackup()
    if (result.success) {
      backupStatus.value = {
        success: true,
        message: `✅ Backup locale creato: ${result.filename} (${result.dataCount} records)`
      }
      lastBackup.value = new Date().toLocaleString()
      localStorage.setItem('lastBackup', lastBackup.value)
    } else {
      backupStatus.value = {
        success: false,
        message: `❌ Errore: ${result.error}`
      }
    }
  } catch (error) {
    backupStatus.value = {
      success: false,
      message: `❌ Errore: ${error.message}`
    }
  } finally {
    isCreatingBackup.value = false
  }
}

const toggleAutoBackup = () => {
  localStorage.setItem('autoBackupEnabled', autoBackupEnabled.value ? 'true' : 'false')
  backupStatus.value = {
    success: true,
    message: autoBackupEnabled.value ? '✅ Backup automatico attivato' : '⏸️ Backup automatico disattivato'
  }
}

onMounted(() => {
  lastBackup.value = localStorage.getItem('lastBackup') || 'Nessun backup trovato'
  autoBackupEnabled.value = localStorage.getItem('autoBackupEnabled') === 'true'
})
</script>