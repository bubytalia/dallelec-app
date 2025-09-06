# Monitor USB per backup automatico Samsung T5
$sourceDir = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"
$targetLabel = "Samsung_T5"
$logFile = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app\usb-monitor-log.txt"
$backupScript = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app\backup-su-collegamento-hd.ps1"

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Add-Content -Path $logFile -Value $LogEntry
}

function Test-SamsungT5Connected {
    try {
        $drives = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.VolumeName -eq $targetLabel }
        return $drives -ne $null
    } catch {
        return $false
    }
}

Write-Log "=== AVVIO MONITOR USB SAMSUNG T5 ==="

$wasConnected = Test-SamsungT5Connected
Write-Log "Stato iniziale Samsung T5: $(if($wasConnected){'Collegato'}else{'Non collegato'})"

# Loop infinito per monitorare
while ($true) {
    Start-Sleep -Seconds 5  # Controlla ogni 5 secondi
    
    $isConnected = Test-SamsungT5Connected
    
    # Se è appena stato collegato (da disconnesso a connesso)
    if ($isConnected -and -not $wasConnected) {
        Write-Log "🔌 SAMSUNG T5 COLLEGATO! Avvio backup..."
        
        try {
            # Esegue il backup
            & powershell.exe -ExecutionPolicy Bypass -File $backupScript
            Write-Log "✅ Backup completato"
        } catch {
            Write-Log "❌ Errore backup: $($_.Exception.Message)"
        }
    }
    
    # Se è appena stato disconnesso
    if (-not $isConnected -and $wasConnected) {
        Write-Log "🔌 Samsung T5 disconnesso"
    }
    
    $wasConnected = $isConnected
}