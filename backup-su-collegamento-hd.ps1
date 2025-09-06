# Backup automatico quando si collega Samsung T5
$sourceDir = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"
$logFile = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app\backup-hd-log.txt"

# Funzione per trovare Samsung T5 automaticamente
function Find-SamsungT5 {
    try {
        # Cerca tra tutte le unità USB/removibili
        $drives = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { 
            $_.DriveType -eq 2 -or  # Removable disk
            ($_.DriveType -eq 3 -and $_.Size -gt 0 -and $_.Size -lt 2TB)  # Fixed disk ma piccolo (USB)
        }
        
        foreach ($drive in $drives) {
            $driveLetter = $drive.DeviceID
            # Controlla se esiste già una cartella backup_sistema o se è un drive esterno
            if (Test-Path "$driveLetter\backup_sistema" -or $drive.DriveType -eq 2) {
                return $driveLetter
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Funzione per eseguire backup
function Start-Backup {
    param($targetDrive)
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $backupTimestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $timestampedBackupDir = "$targetDrive\backup_sistema\backup_$backupTimestamp"
    
    Add-Content $logFile "[$timestamp] INIZIO BACKUP - Drive $targetDrive collegato"
    
    try {
        # Crea directory base backup_sistema se non esiste
        $backupBaseDir = "$targetDrive\backup_sistema"
        if (!(Test-Path $backupBaseDir)) {
            New-Item -ItemType Directory -Path $backupBaseDir -Force | Out-Null
            Add-Content $logFile "[$timestamp] Creata cartella: $backupBaseDir"
        }
        
        # Crea directory backup con timestamp
        New-Item -ItemType Directory -Path $timestampedBackupDir -Force | Out-Null
        Add-Content $logFile "[$timestamp] Creata cartella backup: $timestampedBackupDir"
        
        # Backup con robocopy (senza /MIR per non sovrascrivere)
        $robocopyArgs = @(
            $sourceDir,
            $timestampedBackupDir,
            "/E",
            "/XD", "node_modules", ".git", "dist", "backup-dati-*",
            "/XF", "*.log", "*.tmp",
            "/R:3",
            "/W:10",
            "/LOG+:$logFile"
        )
        
        Start-Process -FilePath "robocopy" -ArgumentList $robocopyArgs -Wait -WindowStyle Hidden
        
        # Pulizia backup vecchi (mantiene solo ultimi 5)
        $allBackups = Get-ChildItem -Path $backupBaseDir -Directory | Where-Object { $_.Name -like "backup_*" } | Sort-Object CreationTime -Descending
        if ($allBackups.Count -gt 5) {
            $backupsToDelete = $allBackups | Select-Object -Skip 5
            foreach ($backup in $backupsToDelete) {
                Remove-Item -Path $backup.FullName -Recurse -Force
                Add-Content $logFile "[$timestamp] Eliminato backup vecchio: $($backup.Name)"
            }
        }
        
        Add-Content $logFile "[$timestamp] BACKUP COMPLETATO: $timestampedBackupDir"
        
    } catch {
        Add-Content $logFile "[$timestamp] ERRORE: $($_.Exception.Message)"
    }
}

# Controlla se Samsung T5 è già collegato e fa backup
$targetDrive = Find-SamsungT5
if ($targetDrive) {
    Start-Backup -targetDrive $targetDrive
} else {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content $logFile "[$timestamp] Samsung T5 non trovato - backup saltato"
    Write-Host "Samsung T5 non trovato. Collega il drive e riprova."
}