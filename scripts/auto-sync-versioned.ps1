# ========================================
# MONITORAGGIO USB CON BACKUP VERSIONED
# ========================================

Write-Host "🔍 Avvio monitoraggio USB per backup versioned..." -ForegroundColor Green

# Registra evento per rilevamento inserimento USB
Register-WmiEvent -Query "SELECT * FROM Win32_VolumeChangeEvent WHERE EventType = 2" -Action {
    Start-Sleep -Seconds 3  # Attendi che il drive sia pronto
    
    Write-Host "📱 USB rilevato, controllo cartella gestionale..." -ForegroundColor Yellow
    
    # Controlla se esiste cartella gestionale
    $drives = Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DriveType -eq 2}
    
    foreach ($drive in $drives) {
        $gestionaleFolder = "$($drive.DeviceID)\gestionale"
        if (Test-Path $gestionaleFolder) {
            Write-Host "✅ Trovata cartella gestionale su $($drive.DeviceID)" -ForegroundColor Green
            Write-Host "📅 Creazione backup versioned..." -ForegroundColor Cyan
            
            # Esegui backup versioned
            Start-Process -FilePath "C:\Projects\Dallelec_app\scripts\sync-versioned-backup.bat" -WindowStyle Normal
            break
        }
    }
}

Write-Host "👂 Monitoraggio versioned attivo. Premi Ctrl+C per fermare." -ForegroundColor Cyan
Write-Host "🔌 Collega l'HD esterno per creare backup con timestamp." -ForegroundColor White
Write-Host "📁 I backup saranno salvati come: Dallelec_YYYY-MM-DD_HH-MM" -ForegroundColor Yellow

# Mantieni lo script in esecuzione
try {
    while ($true) {
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "🛑 Monitoraggio fermato." -ForegroundColor Red
}