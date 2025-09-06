# PULIZIA PROGETTO DALLELEC - Rimozione file intrusi
$projectDir = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"
$logFile = "$projectDir\pulizia-log.txt"

Write-Host "=== PULIZIA PROGETTO DALLELEC ===" -ForegroundColor Green
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content $logFile "[$timestamp] INIZIO PULIZIA PROGETTO"

# Lista file da eliminare
$filesToDelete = @(
    # Script di test/debug
    "check-*.js",
    "test-*.js", 
    "debug-*.js",
    "import-*.js",
    "fix-*.js",
    "create-*.js",
    "restore-*.js",
    "populate-*.js",
    "setup-*.js",
    "update-*.js",
    "migrate-*.js",
    "manual-*.js",
    "web-*.js",
    
    # File SQL temporanei
    "*.sql",
    
    # Backup JSON temporanei
    "dallelec-backup-*.json",
    "clients-details.json",
    
    # File di log temporanei
    "*-log.txt",
    "usb-monitor-log.txt",
    
    # File temporanei vari
    "tall jspdf",
    "ersbubytDesktopdallelec ultimoDallelec.app"
)

$deletedCount = 0
$totalSize = 0

foreach ($pattern in $filesToDelete) {
    $files = Get-ChildItem -Path $projectDir -Name $pattern -ErrorAction SilentlyContinue
    
    foreach ($file in $files) {
        $fullPath = Join-Path $projectDir $file
        if (Test-Path $fullPath) {
            try {
                $fileSize = (Get-Item $fullPath).Length
                $totalSize += $fileSize
                Remove-Item $fullPath -Force
                Write-Host "✅ Eliminato: $file" -ForegroundColor Yellow
                Add-Content $logFile "[$timestamp] ELIMINATO: $file ($fileSize bytes)"
                $deletedCount++
            } catch {
                Write-Host "❌ Errore eliminando: $file" -ForegroundColor Red
                Add-Content $logFile "[$timestamp] ERRORE: $file - $($_.Exception.Message)"
            }
        }
    }
}

# Pulizia cartelle backup dati vecchie (mantiene solo le ultime 3)
$backupDirs = Get-ChildItem -Path $projectDir -Directory | Where-Object { $_.Name -like "backup-dati-*" } | Sort-Object CreationTime -Descending
if ($backupDirs.Count -gt 3) {
    $dirsToDelete = $backupDirs | Select-Object -Skip 3
    foreach ($dir in $dirsToDelete) {
        try {
            $dirSize = (Get-ChildItem -Path $dir.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
            $totalSize += $dirSize
            Remove-Item $dir.FullName -Recurse -Force
            Write-Host "✅ Eliminata cartella: $($dir.Name)" -ForegroundColor Yellow
            Add-Content $logFile "[$timestamp] ELIMINATA CARTELLA: $($dir.Name) ($dirSize bytes)"
            $deletedCount++
        } catch {
            Write-Host "❌ Errore eliminando cartella: $($dir.Name)" -ForegroundColor Red
        }
    }
}

$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Host "`n=== PULIZIA COMPLETATA ===" -ForegroundColor Green
Write-Host "File eliminati: $deletedCount" -ForegroundColor Cyan
Write-Host "Spazio liberato: $totalSizeMB MB" -ForegroundColor Cyan

Add-Content $logFile "[$timestamp] PULIZIA COMPLETATA - $deletedCount file eliminati, $totalSizeMB MB liberati"

Write-Host "`nProgetto pulito! ✨" -ForegroundColor Green