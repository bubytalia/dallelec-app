# Test Samsung T5 - Verifica struttura e crea cartelle
$logFile = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app\backup-hd-log.txt"

Write-Host "=== TEST SAMSUNG T5 ===" -ForegroundColor Green

# Mostra tutte le unità disponibili
Write-Host "`nUnità disponibili:" -ForegroundColor Yellow
Get-WmiObject -Class Win32_LogicalDisk | ForEach-Object {
    $size = if ($_.Size) { [math]::Round($_.Size / 1GB, 2) } else { "N/A" }
    $free = if ($_.FreeSpace) { [math]::Round($_.FreeSpace / 1GB, 2) } else { "N/A" }
    Write-Host "  $($_.DeviceID) - $($_.VolumeName) - Tipo: $($_.DriveType) - Dimensione: ${size}GB - Libero: ${free}GB"
}

# Funzione per trovare Samsung T5
function Find-SamsungT5 {
    $drives = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { 
        $_.DriveType -eq 2 -or  # Removable disk
        ($_.DriveType -eq 3 -and $_.Size -gt 0 -and $_.Size -lt 2TB)  # Fixed disk ma piccolo
    }
    
    foreach ($drive in $drives) {
        $driveLetter = $drive.DeviceID
        Write-Host "`nControllo drive $driveLetter..." -ForegroundColor Cyan
        
        # Controlla contenuto
        if (Test-Path $driveLetter) {
            $items = Get-ChildItem -Path $driveLetter -ErrorAction SilentlyContinue
            Write-Host "  Contenuto: $($items.Count) elementi"
            
            # Se ha già backup_sistema o sembra un drive esterno
            if (Test-Path "$driveLetter\backup_sistema" -or $drive.DriveType -eq 2) {
                Write-Host "  ✅ Possibile Samsung T5 trovato!" -ForegroundColor Green
                return $driveLetter
            }
        }
    }
    return $null
}

# Cerca Samsung T5
$targetDrive = Find-SamsungT5

if ($targetDrive) {
    Write-Host "`n✅ Samsung T5 trovato su: $targetDrive" -ForegroundColor Green
    
    # Verifica/crea struttura backup_sistema
    $backupDir = "$targetDrive\backup_sistema"
    if (!(Test-Path $backupDir)) {
        Write-Host "Creando cartella backup_sistema..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Write-Host "✅ Cartella backup_sistema creata" -ForegroundColor Green
    } else {
        Write-Host "✅ Cartella backup_sistema già esistente" -ForegroundColor Green
    }
    
    # Mostra backup esistenti
    $existingBackups = Get-ChildItem -Path $backupDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "backup_*" }
    if ($existingBackups) {
        Write-Host "`nBackup esistenti:" -ForegroundColor Yellow
        $existingBackups | Sort-Object CreationTime -Descending | ForEach-Object {
            Write-Host "  - $($_.Name) ($(Get-Date $_.CreationTime -Format 'dd/MM/yyyy HH:mm'))"
        }
    } else {
        Write-Host "`nNessun backup esistente trovato" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "`n❌ Samsung T5 non trovato" -ForegroundColor Red
    Write-Host "Collega il Samsung T5 e riprova" -ForegroundColor Yellow
}

Write-Host "`n=== FINE TEST ===" -ForegroundColor Green