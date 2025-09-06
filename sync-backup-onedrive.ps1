# Sincronizza backup su OneDrive
$sourceDir = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"
$oneDriveDir = "$env:USERPROFILE\OneDrive\Backup_Dallelec_Dati"

Write-Host "=== SYNC BACKUP SU ONEDRIVE ===" -ForegroundColor Green

# Crea cartella OneDrive se non esiste
if (!(Test-Path $oneDriveDir)) {
    New-Item -ItemType Directory -Path $oneDriveDir -Force | Out-Null
    Write-Host "✅ Creata cartella OneDrive: Backup_Dallelec_Dati" -ForegroundColor Green
}

# Trova tutti i backup locali
$backups = Get-ChildItem -Path $sourceDir -Directory | Where-Object { $_.Name -like "backup-dati-*" }

Write-Host "Backup trovati: $($backups.Count)" -ForegroundColor Yellow

foreach ($backup in $backups) {
    $destPath = "$oneDriveDir\$($backup.Name)"
    
    if (!(Test-Path $destPath)) {
        # Copia cartella backup
        Copy-Item -Path $backup.FullName -Destination $destPath -Recurse -Force
        Write-Host "✅ Copiato: $($backup.Name)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ Già esistente: $($backup.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ SINCRONIZZAZIONE COMPLETATA!" -ForegroundColor Green
Write-Host "Cartella OneDrive: $oneDriveDir" -ForegroundColor Cyan