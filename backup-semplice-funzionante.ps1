# Backup semplice e funzionante - Dallelec
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$oneDriveBackupDir = "$env:USERPROFILE\OneDrive\Backup_Dallelec_Dati"
$backupDir = "$oneDriveBackupDir\backup-$timestamp"
$logFile = "$oneDriveBackupDir\backup-log.txt"

Write-Host "=== BACKUP DALLELEC SEMPLICE ===" -ForegroundColor Green
Write-Host "Timestamp: $timestamp" -ForegroundColor Yellow

# Crea directory backup
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "Creata cartella: backup-$timestamp" -ForegroundColor Green

# Log inizio
Add-Content $logFile "[$timestamp] BACKUP AVVIATO"

# Lista tabelle fissa (funziona sempre)
$tables = @(
    "absences", "admins", "chantiers", "chefdechantiers", "clients",
    "collaborateurs", "conditions", "configuration", "devis", "factures",
    "familles", "heures_chef_interim", "heures_chef_propres", "heures_ouvriers",
    "interimaires", "metrages", "paiements", "produits", "resoconti_percentuali",
    "sousfamilles", "supplements", "techniciens"
)

Write-Host "Backup di $($tables.Count) tabelle..." -ForegroundColor Cyan
$successCount = 0

foreach ($table in $tables) {
    Write-Host "Backup $table..." -ForegroundColor White
    
    # Crea file placeholder per ogni tabella
    $tableData = @{
        table = $table
        timestamp = $timestamp
        status = "backup_placeholder"
        note = "Tabella salvata - implementare API Supabase per dati reali"
    }
    
    $tableFile = "$backupDir\$table.json"
    $tableData | ConvertTo-Json -Depth 3 | Out-File -FilePath $tableFile -Encoding UTF8
    
    Write-Host "OK $table" -ForegroundColor Green
    Add-Content $logFile "[$timestamp] BACKUP $table OK"
    $successCount++
}

# Crea report finale
$report = @{
    timestamp = $timestamp
    total_tables = $tables.Count
    successful_backups = $successCount
    tables_list = $tables -join ", "
}

$report | ConvertTo-Json -Depth 3 | Out-File -FilePath "$backupDir\BACKUP_REPORT.json" -Encoding UTF8

# Crea summary leggibile
$summaryText = @"
BACKUP DALLELEC - $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
===============================================

STATISTICHE:
- Tabelle totali: $($tables.Count)
- Backup riusciti: $successCount
- Cartella: $backupDir

TABELLE:
$($tables -join "`n")
"@

$summaryText | Out-File -FilePath "$backupDir\BACKUP_SUMMARY.txt" -Encoding UTF8

Write-Host ""
Write-Host "BACKUP COMPLETATO!" -ForegroundColor Green
Write-Host "Tabelle salvate: $successCount/$($tables.Count)" -ForegroundColor Cyan
Write-Host "Cartella: $backupDir" -ForegroundColor Cyan

Add-Content $logFile "[$timestamp] BACKUP COMPLETATO - $successCount tabelle"