# Sistema Backup Automatico HD Esterno - Dallelec
# Rileva HD collegato e crea backup Supabase

param(
    [string]$HDLetter = "",
    [int]$MaxBackups = 10
)

# Configurazione
$ProjectPath = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"
$LogFile = "$ProjectPath\backup-log.txt"

# CONFIGURAZIONE HD SPECIFICO - Samsung T5
$HDLabel = "Samsung_T5"  # Nome esatto del Samsung T5
$MarkerFile = "dallelec-backup-hd.marker"  # File identificativo

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

function Find-DallelecBackupDrive {
    Write-Log "Ricerca HD backup Dallelec..."
    
    $ExternalDrives = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DriveType -eq 2 -or $_.DriveType -eq 3 }
    
    foreach ($Drive in $ExternalDrives) {
        $DriveLetter = $Drive.DeviceID
        $VolumeLabel = $Drive.VolumeName
        
        Write-Log "Controllo drive $DriveLetter (Label: $VolumeLabel)"
        
        # Controlla etichetta HD
        if ($VolumeLabel -eq $HDLabel) {
            Write-Log "HD riconosciuto tramite etichetta: $HDLabel"
            return $DriveLetter
        }
        
        # Controlla file marker
        $MarkerPath = "$DriveLetter\$MarkerFile"
        if (Test-Path $MarkerPath) {
            Write-Log "HD riconosciuto tramite file marker: $MarkerFile"
            return $DriveLetter
        }
    }
    
    Write-Log "HD backup Dallelec non trovato"
    return $null
}

function Create-SystemBackup {
    param([string]$BackupPath)
    
    Write-Log "Creazione backup sistema Dallelec..."
    
    $SourcePath = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"
    $Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $BackupFolder = "$BackupPath\Dallelec_app_backup_$Timestamp"
    
    # Crea cartella backup
    New-Item -Path $BackupFolder -ItemType Directory -Force | Out-Null
    
    # Copia tutto il progetto escludendo node_modules e .git
    $ExcludeDirs = @("node_modules", ".git", "dist")
    
    Write-Log "Copiando files da $SourcePath..."
    
    robocopy $SourcePath $BackupFolder /E /XD $ExcludeDirs /XF "*.log" "backup-log.txt" /R:1 /W:1 /NP /NDL /NC
    
    # Crea file info backup
    $BackupInfo = @{
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        source = $SourcePath
        backup_folder = $BackupFolder
        excluded = $ExcludeDirs
    }
    
    $BackupInfo | ConvertTo-Json -Depth 10 | Out-File -FilePath "$BackupFolder\backup-info.json" -Encoding UTF8
    
    Write-Log "Backup sistema creato: $BackupFolder"
    return $BackupFolder
}

function Clean-OldBackups {
    param([string]$BackupPath, [int]$MaxBackups)
    
    $BackupFolders = Get-ChildItem -Path $BackupPath -Filter "Dallelec_app_backup_*" -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer } | Sort-Object CreationTime -Descending
    
    if ($BackupFolders.Count -gt $MaxBackups) {
        $FoldersToDelete = $BackupFolders | Select-Object -Skip $MaxBackups
        foreach ($Folder in $FoldersToDelete) {
            Remove-Item -Path $Folder.FullName -Recurse -Force
            Write-Log "Eliminato backup vecchio: $($Folder.Name)"
        }
    }
}

# Main Script
Write-Log "=== AVVIO BACKUP AUTOMATICO DALLELEC ==="

# Trova HD backup Dallelec
if ($HDLetter -eq "") {
    $HDLetter = Find-DallelecBackupDrive
}

if (-not $HDLetter) {
    Write-Log "ERRORE: HD backup Dallelec non trovato"
    Write-Log "Assicurati che l'HD abbia etichetta '$HDLabel' o file '$MarkerFile'"
    exit 1
}

Write-Log "HD backup Dallelec trovato: $HDLetter"

# Usa cartella gestionale esistente
$BackupFolder = "$HDLetter\gestionale"
if (-not (Test-Path $BackupFolder)) {
    Write-Log "ERRORE: Cartella gestionale non trovata su $HDLetter"
    exit 1
}
Write-Log "Usando cartella esistente: $BackupFolder"

# Crea file marker se non esiste
$MarkerPath = "$HDLetter\$MarkerFile"
if (-not (Test-Path $MarkerPath)) {
    "Dallelec Backup HD - $(Get-Date)" | Out-File -FilePath $MarkerPath -Encoding UTF8
    Write-Log "Creato file marker: $MarkerPath"
}

# Crea backup sistema
$BackupFolder = Create-SystemBackup -BackupPath $BackupFolder

# Pulisci backup vecchi
Clean-OldBackups -BackupPath $BackupFolder -MaxBackups $MaxBackups

Write-Log "=== BACKUP COMPLETATO ==="
Write-Log "Cartella: $BackupFolder"
Write-Log "Backup mantenuti: $MaxBackups"