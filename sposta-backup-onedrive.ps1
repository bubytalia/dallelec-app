# Sposta backup da Download a OneDrive automaticamente

$DownloadPath = "$env:USERPROFILE\Downloads"
$OneDrivePath = "$env:USERPROFILE\OneDrive\Backup_Dallelec_Dati"

function Move-BackupFiles {
    Write-Host "🔄 Ricerca file backup in Downloads..." -ForegroundColor Yellow
    
    # Crea cartella OneDrive se non esiste
    if (-not (Test-Path $OneDrivePath)) {
        New-Item -Path $OneDrivePath -ItemType Directory -Force | Out-Null
        Write-Host "✓ Creata cartella: $OneDrivePath" -ForegroundColor Green
    }
    
    # Cerca file backup Dallelec
    $BackupFiles = Get-ChildItem -Path $DownloadPath -Filter "dallelec-backup-*.json" -ErrorAction SilentlyContinue
    
    if ($BackupFiles.Count -eq 0) {
        Write-Host "❌ Nessun file backup trovato in Downloads" -ForegroundColor Red
        return
    }
    
    Write-Host "📁 Trovati $($BackupFiles.Count) file backup:" -ForegroundColor Cyan
    
    foreach ($File in $BackupFiles) {
        $DestinationPath = Join-Path $OneDrivePath $File.Name
        
        try {
            Move-Item -Path $File.FullName -Destination $DestinationPath -Force
            Write-Host "  ✓ Spostato: $($File.Name)" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ Errore spostando $($File.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    }
    
    Write-Host "🎉 Operazione completata!" -ForegroundColor Green
    Write-Host "📂 File salvati in: $OneDrivePath" -ForegroundColor Cyan
}

Clear-Host
Write-Host "📦 SPOSTA BACKUP SU ONEDRIVE - DALLELEC" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Move-BackupFiles

Write-Host "`nPremi un tasto per continuare..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")