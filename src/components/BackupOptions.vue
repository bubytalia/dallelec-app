<template>
  <div class="backup-options">
    <BackupSupabase />
    
    <div class="mt-2">
      <small class="text-muted">
        💡 Dopo il download, sposta i file su D:\backup\backup_dati\\ manualmente
      </small>
    </div>
  </div>
</template>

<script>
import BackupSupabase from './BackupSupabase.vue'

export default {
  name: 'BackupOptions',
  components: {
    BackupSupabase
  },
  setup() {
    return {}
  }
}
</script>