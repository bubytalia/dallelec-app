// BACKUP MANAGER - Gestisce backup su disco D:\
import fs from 'fs'
import path from 'path'

class BackupManager {
  constructor() {
    this.backupDataPath = 'D:\\backup\\backup_dati'
    this.backupSistemaPath = 'D:\\backup\\backup_sistema'
    this.maxBackups = 5
  }

  // Verifica che le cartelle esistano
  ensureDirectories() {
    if (!fs.existsSync(this.backupDataPath)) {
      throw new Error(`Cartella non trovata: ${this.backupDataPath}`)
    }
    if (!fs.existsSync(this.backupSistemaPath)) {
      throw new Error(`Cartella non trovata: ${this.backupSistemaPath}`)
    }
  }

  // Pulisce i vecchi backup (mantiene solo gli ultimi 5)
  cleanOldBackups(directory, prefix) {
    try {
      const files = fs.readdirSync(directory)
        .filter(file => file.startsWith(prefix))
        .map(file => ({
          name: file,
          path: path.join(directory, file),
          time: fs.statSync(path.join(directory, file)).mtime
        }))
        .sort((a, b) => b.time - a.time)

      // Elimina i backup più vecchi
      if (files.length > this.maxBackups) {
        const toDelete = files.slice(this.maxBackups)
        toDelete.forEach(file => {
          if (fs.statSync(file.path).isDirectory()) {
            fs.rmSync(file.path, { recursive: true, force: true })
          } else {
            fs.unlinkSync(file.path)
          }
          console.log(`Eliminato: ${file.name}`)
        })
      }
    } catch (error) {
      console.error('Errore pulizia backup:', error.message)
    }
  }

  // Salva backup dati Supabase
  saveBackupData(jsonData, filename) {
    this.ensureDirectories()
    
    const filePath = path.join(this.backupDataPath, filename)
    fs.writeFileSync(filePath, jsonData, 'utf8')
    
    // Pulisci vecchi backup
    this.cleanOldBackups(this.backupDataPath, 'dallelec-backup-')
    
    console.log(`✅ Backup dati salvato: ${filePath}`)
    return filePath
  }

  // Backup completo sistema
  backupSistema() {
    console.log('🔍 Verificando cartelle...')
    this.ensureDirectories()
    console.log('✅ Cartelle verificate')
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 16)
    const backupFolder = `dallelec-sistema-${timestamp}`
    const backupPath = path.join(this.backupSistemaPath, backupFolder)
    
    // Crea cartella backup
    console.log(`📁 Creando cartella: ${backupPath}`)
    fs.mkdirSync(backupPath, { recursive: true })
    console.log('✅ Cartella creata')
    
    // File e cartelle da copiare (esclusi node_modules, .git, dist)
    const itemsToCopy = [
      'src', 'public', 'scripts',
      'package.json', 'package-lock.json', 'vite.config.js',
      '.env.example', 'index.html', 'README.md', 'netlify.toml',
      '*.md', '*.js', '*.json'
    ]
    
    const sourceDir = process.cwd()
    
    // Copia ricorsiva
    console.log(`📋 Copiando da: ${sourceDir}`)
    console.log(`📋 Copiando in: ${backupPath}`)
    this.copyRecursive(sourceDir, backupPath, itemsToCopy)
    console.log('✅ Copia completata')
    
    // Pulisci vecchi backup
    this.cleanOldBackups(this.backupSistemaPath, 'dallelec-sistema-')
    
    console.log(`✅ Backup sistema salvato: ${backupPath}`)
    return backupPath
  }

  // Copia ricorsiva con esclusioni
  copyRecursive(src, dest, allowedItems) {
    const items = fs.readdirSync(src)
    
    items.forEach(item => {
      // Salta cartelle e file da escludere
      const excludeItems = [
        'node_modules', '.git', 'dist', '.netlify', '.firebase',
        // File Firebase residui
        '.firebaserc', 'firebase.json', 'firestore.rules', 'firestore-temp.rules',
        // File temporanei e di test
        'temp_facture_fix.js', 'pulizia-log.txt', 'firebase-residui-report.txt',
        // Script di migrazione/test
        'analisi-firebase-residui.js', 'correggi-firebase-residui.js', 'verifica-firebase-residui.js',
        'test-supabase-connection.js', 'test-supabase-node.js', 'init-firestore.js',
        // File di backup temporanei
        'backup-supabase-simple.js'
      ]
      
      if (excludeItems.includes(item)) {
        return
      }
      
      const srcPath = path.join(src, item)
      const destPath = path.join(dest, item)
      const stat = fs.statSync(srcPath)
      
      if (stat.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true })
        this.copyRecursive(srcPath, destPath, allowedItems)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    })
  }
}

// Per uso diretto da Node.js
const manager = new BackupManager()

const command = process.argv[2]

if (command === 'sistema') {
  manager.backupSistema()
} else {
  console.log('Uso: node backup-manager.js sistema')
}