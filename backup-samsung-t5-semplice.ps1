# Backup semplice Samsung T5
$sourceDir = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"
$targetDrive = "D:"
$backupTimestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "$targetDrive\backup_sistema\backup_$backupTimestamp"
$logFile = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app\backup-hd-log.txt"

Write-Host "=== BACKUP SAMSUNG T5 ===" -ForegroundColor Green
Write-Host "Sorgente: $sourceDir" -ForegroundColor Yellow
Write-Host "Destinazione: $backupDir" -ForegroundColor Yellow

# Crea cartella backup_sistema se non esiste
$backupBaseDir = "$targetDrive\backup_sistema"
if (!(Test-Path $backupBaseDir)) {
    New-Item -ItemType Directory -Path $backupBaseDir -Force | Out-Null
    Write-Host "✅ Creata cartella backup_sistema" -ForegroundColor Green
}

# Crea cartella backup con timestamp
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "✅ Creata cartella: backup_$backupTimestamp" -ForegroundColor Green

# Esegui backup con robocopy
Write-Host "🔄 Avvio backup..." -ForegroundColor Cyan
$robocopyArgs = @(
    $sourceDir,
    $backupDir,
    "/E",
    "/XD", "node_modules", ".git", "dist", "backup-dati-*",
    "/XF", "*.log", "*.tmp",
    "/R:3",
    "/W:10"
)

Start-Process -FilePath "robocopy" -ArgumentList $robocopyArgs -Wait -NoNewWindow

# Pulizia backup vecchi (mantiene solo ultimi 5)
$allBackups = Get-ChildItem -Path $backupBaseDir -Directory | Where-Object { $_.Name -like "backup_*" } | Sort-Object CreationTime -Descending
if ($allBackups.Count -gt 5) {
    $backupsToDelete = $allBackups | Select-Object -Skip 5
    foreach ($backup in $backupsToDelete) {
        Remove-Item -Path $backup.FullName -Recurse -Force
        Write-Host "🗑️ Eliminato backup vecchio: $($backup.Name)" -ForegroundColor Red
    }
}

Write-Host "✅ BACKUP COMPLETATO!" -ForegroundColor Green
Write-Host "Cartella: $backupDir" -ForegroundColor Yellow

# Log
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content $logFile "[$timestamp] BACKUP COMPLETATO: $backupDir"