<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <h3>🛡️ Security Dashboard</h3>
      </div>
    </div>

    <!-- Security Metrics -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <h5>{{ securityMetrics.successfulLogins }}</h5>
            <small>Login Riusciti (24h)</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-white">
          <div class="card-body">
            <h5>{{ securityMetrics.failedLogins }}</h5>
            <small>Login Falliti (24h)</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <h5>{{ securityMetrics.activeUsers }}</h5>
            <small>Utenti Attivi</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <h5>{{ securityMetrics.lastBackup }}</h5>
            <small>Ultimo Backup</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Backup Manager -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h5>💾 Backup Manager</h5>
            <p class="text-muted">Componente backup temporaneamente disabilitato</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Security Alerts -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5>🚨 Security Alerts</h5>
          </div>
          <div class="card-body">
            <div v-if="securityAlerts.length === 0" class="text-success">
              ✅ Nessun alert di sicurezza
            </div>
            <div v-else>
              <div v-for="alert in securityAlerts" :key="alert.id" 
                   :class="`alert alert-${alert.severity}`">
                <strong>{{ alert.title }}</strong><br>
                {{ alert.message }}<br>
                <small class="text-muted">{{ alert.timestamp }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Audit Log -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5>📋 Recent Activity Log</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in recentLogs" :key="log.id">
                    <td>{{ formatDate(log.timestamp) }}</td>
                    <td>{{ log.userEmail }}</td>
                    <td>{{ log.action }}</td>
                    <td>{{ log.resource }}</td>
                    <td>
                      <span :class="`badge bg-${log.details.status === 'success' ? 'success' : 'danger'}`">
                        {{ log.details.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase'
// import BackupManager from './BackupManager.vue' // Temporaneamente disabilitato

const securityMetrics = ref({
  successfulLogins: 0,
  failedLogins: 0,
  activeUsers: 0,
  lastBackup: 'N/A'
})

const securityAlerts = ref([])
const recentLogs = ref([])

const loadSecurityMetrics = async () => {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Login metrics from audit log (se esiste la tabella)
    try {
      const { data: loginData, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('action', 'login')
        .gte('timestamp', yesterday.toISOString())
      
      if (!error && loginData) {
        let successful = 0
        let failed = 0
        
        loginData.forEach(log => {
          if (log.details?.status === 'success') {
            successful++
          } else {
            failed++
          }
        })
        
        securityMetrics.value.successfulLogins = successful
        securityMetrics.value.failedLogins = failed
        
        // Check for security alerts
        if (failed > 10) {
          securityAlerts.value.push({
            id: 'high-failed-logins',
            severity: 'danger',
            title: 'High Failed Login Attempts',
            message: `${failed} tentativi di login falliti nelle ultime 24 ore`,
            timestamp: new Date().toLocaleString()
          })
        }
      }
    } catch (auditError) {
      console.log('Audit log non disponibile:', auditError)
      // Valori di default se non c'è audit log
      securityMetrics.value.successfulLogins = 0
      securityMetrics.value.failedLogins = 0
    }

    
    // Last backup info
    const lastBackup = localStorage.getItem('lastBackup')
    securityMetrics.value.lastBackup = lastBackup || 'Mai'
    
    if (!lastBackup) {
      securityAlerts.value.push({
        id: 'no-backup',
        severity: 'warning',
        title: 'Nessun Backup Trovato',
        message: 'Non è stato trovato alcun backup recente. Crea un backup immediatamente.',
        timestamp: new Date().toLocaleString()
      })
    }
    
  } catch (error) {
    console.error('Error loading security metrics:', error)
  }
}

const loadRecentLogs = async () => {
  try {
    const { data: logs, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20)
    
    if (!error && logs) {
      recentLogs.value = logs
    } else {
      console.log('Audit log non disponibile')
      recentLogs.value = []
    }
  } catch (error) {
    console.error('Error loading recent logs:', error)
    recentLogs.value = []
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleString()
}

onMounted(() => {
  loadSecurityMetrics()
  loadRecentLogs()
  
  // Refresh every 5 minutes
  setInterval(() => {
    loadSecurityMetrics()
    loadRecentLogs()
  }, 5 * 60 * 1000)
})
</script>