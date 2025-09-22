# BACKUP COMPLETO AUTOMATICO DALLELEC
# Questo script gestisce automaticamente i backup su D:\backup

param(
    [string]$DataFile = "",
    [string]$SystemBackup = $false
)

$ErrorActionPreference = "Continue"

# Configurazione
$BackupRootDir = "D:\backup"
$DataBackupDir = "$BackupRootDir\backup_dati"
$SystemBackupDir = "$BackupRootDir\backup_sistema"
$SourceSystemDir = "C:\Users\bubyt\Desktop\gestionalequater\Dallelec_app_new"
$MaxBackups = 5

Write-Host "🛡️ BACKUP COMPLETO DALLELEC - $(Get-Date)" -ForegroundColor Green
Write-Host "=" * 60

# Crea directory se non esistono
@($BackupRootDir, $DataBackupDir, $SystemBackupDir) | ForEach-Object {
    if (!(Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-Host "📁 Creata directory: $_" -ForegroundColor Yellow
    }
}

# Funzione per pulire backup vecchi
function Clean-OldBackups {
    param($Directory, $Pattern, $MaxKeep)
    
    $backups = Get-ChildItem $Directory -Filter $Pattern | Sort-Object CreationTime -Descending
    if ($backups.Count -gt $MaxKeep) {
        $toDelete = $backups | Select-Object -Skip $MaxKeep
        foreach ($backup in $toDelete) {
            Remove-Item $backup.FullName -Recurse -Force
            Write-Host "🗑️ Rimosso backup vecchio: $($backup.Name)" -ForegroundColor Gray
        }
    }
}

# 1. BACKUP DATI (se fornito file JSON)
if ($DataFile -and (Test-Path $DataFile)) {
    Write-Host "📊 BACKUP DATI SUPABASE" -ForegroundColor Cyan
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $dataBackupFile = "$DataBackupDir\dallelec-database-$timestamp.json"
    
    Copy-Item $DataFile $dataBackupFile
    Write-Host "✅ Dati salvati: $dataBackupFile"
    
    # Pulisci backup dati vecchi
    Clean-OldBackups $DataBackupDir "dallelec-database-*.json" $MaxBackups
    
    # Info sul backup
    $jsonContent = Get-Content $DataFile | ConvertFrom-Json
    $totalTables = $jsonContent.total_tables
    $totalRecords = ($jsonContent.tables.PSObject.Properties | ForEach-Object { $_.Value.count } | Measure-Object -Sum).Sum
    
    Write-Host "📈 Statistiche backup dati:"
    Write-Host "   - Tabelle: $totalTables"
    Write-Host "   - Record totali: $totalRecords"
    Write-Host "   - Timestamp: $($jsonContent.timestamp)"
}

# 2. BACKUP SISTEMA
Write-Host "`n💾 BACKUP SISTEMA" -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$systemBackupPath = "$SystemBackupDir\dallelec-sistema-$timestamp"

# Directory da escludere
$excludeDirs = @("node_modules", ".git", "dist", ".netlify", "build", ".firebase")
$excludeFiles = @("*.log", "*.tmp", "package-lock.json")

Write-Host "🔄 Copiando sistema da: $SourceSystemDir"
Write-Host "📁 Destinazione: $systemBackupPath"

# Usa robocopy per copia efficiente
$robocopyArgs = @(
    $SourceSystemDir,
    $systemBackupPath,
    "/E",  # Copia subdirectory incluse quelle vuote
    "/XD", ($excludeDirs -join " "),  # Escludi directory
    "/XF", ($excludeFiles -join " "), # Escludi file
    "/R:1", # 1 retry
    "/W:1", # 1 secondo di attesa
    "/NP",  # No progress
    "/NFL", # No file list
    "/NDL"  # No directory list
)

$result = & robocopy @robocopyArgs

# Robocopy exit codes: 0-7 sono successo, >7 sono errori
if ($LASTEXITCODE -le 7) {
    Write-Host "✅ Sistema copiato con successo"
    
    # Pulisci backup sistema vecchi
    Clean-OldBackups $SystemBackupDir "dallelec-sistema-*" $MaxBackups
    
    # Info sul backup sistema
    $systemSize = (Get-ChildItem $systemBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    $fileCount = (Get-ChildItem $systemBackupPath -Recurse -File).Count
    
    Write-Host "📈 Statistiche backup sistema:"
    Write-Host "   - Dimensione: $([math]::Round($systemSize, 2)) MB"
    Write-Host "   - File copiati: $fileCount"
    Write-Host "   - Directory escluse: $($excludeDirs -join ', ')"
    
} else {
    Write-Host "❌ Errore durante copia sistema (exit code: $LASTEXITCODE)" -ForegroundColor Red
}

# 3. RIEPILOGO FINALE
Write-Host "`n📋 RIEPILOGO BACKUP" -ForegroundColor Green
Write-Host "=" * 40

$dataBackups = Get-ChildItem $DataBackupDir -Filter "dallelec-database-*.json" | Sort-Object CreationTime -Descending
$systemBackups = Get-ChildItem $SystemBackupDir -Filter "dallelec-sistema-*" | Sort-Object CreationTime -Descending

Write-Host "📊 Backup dati disponibili: $($dataBackups.Count)"
foreach ($backup in $dataBackups) {
    $size = [math]::Round($backup.Length / 1MB, 2)
    Write-Host "   - $($backup.Name) ($size MB) - $($backup.CreationTime)"
}

Write-Host "`n💾 Backup sistema disponibili: $($systemBackups.Count)"
foreach ($backup in $systemBackups) {
    $size = (Get-ChildItem $backup.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   - $($backup.Name) ($([math]::Round($size, 2)) MB) - $($backup.CreationTime)"
}

Write-Host "`n🎯 BACKUP COMPLETATO CON SUCCESSO!" -ForegroundColor Green
Write-Host "📁 Percorso backup: $BackupRootDir"
Write-Host "🕐 Completato: $(Get-Date)"

# Pausa per vedere i risultati
Read-Host "`nPremi INVIO per chiudere"