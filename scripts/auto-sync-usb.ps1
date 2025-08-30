# ========================================
# MONITORAGGIO USB E SINCRONIZZAZIONE AUTOMATICA
# ========================================

Write-Host "🔍 Avvio monitoraggio USB per Dallelec..." -ForegroundColor Green

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
            
            # Esegui sincronizzazione
            Start-Process -FilePath "C:\Projects\Dallelec_app\scripts\sync-to-external.bat" -WindowStyle Normal
            break
        }
    }
}

Write-Host "👂 Monitoraggio attivo. Premi Ctrl+C per fermare." -ForegroundColor Cyan
Write-Host "🔌 Collega l'HD esterno per avviare la sincronizzazione automatica." -ForegroundColor White

# Mantieni lo script in esecuzione
try {
    while ($true) {
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "🛑 Monitoraggio fermato." -ForegroundColor Red
}