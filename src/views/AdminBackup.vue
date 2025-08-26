<template>
  <div class="container py-5">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">🛡️ Gestione Backup Database</h2>
    
    <BackupManager />
  </div>
</template>

<script setup>
import BackupManager from '@/components/BackupManager.vue'
import RetourButton from '@/components/RetourButton.vue'
</script>