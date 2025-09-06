# Sposta backup fuori dalla cartella progetto
$projectDir = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"
$newBackupDir = "c:\Users\TestQ\Desktop\gestionale\Backup_Dallelec"

Write-Host "=== SPOSTA BACKUP ===" -ForegroundColor Green

# Crea nuova cartella backup
if (!(Test-Path $newBackupDir)) {
    New-Item -ItemType Directory -Path $newBackupDir -Force | Out-Null
    Write-Host "✅ Creata cartella: $newBackupDir" -ForegroundColor Green
}

# Trova e sposta tutti i backup
$backups = Get-ChildItem -Path $projectDir -Directory | Where-Object { $_.Name -like "backup-dati-*" }

foreach ($backup in $backups) {
    $destPath = "$newBackupDir\$($backup.Name)"
    Move-Item -Path $backup.FullName -Destination $destPath -Force
    Write-Host "✅ Spostato: $($backup.Name)" -ForegroundColor Cyan
}

Write-Host "`n✅ BACKUP SPOSTATI!" -ForegroundColor Green
Write-Host "Nuova posizione: $newBackupDir" -ForegroundColor Yellow
Write-Host "Backup spostati: $($backups.Count)" -ForegroundColor Cyan