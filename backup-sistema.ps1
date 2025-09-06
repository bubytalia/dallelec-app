# Backup automatico sistema Dallelec
$sourceDir = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"
$backupDir = "D:\gestionale"
$logFile = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app\backup-sistema-log.txt"

# Crea directory backup se non esiste
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force
}

# Log inizio backup
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content $logFile "[$timestamp] INIZIO BACKUP SISTEMA"

try {
    # Backup con robocopy (esclude node_modules e .git)
    $robocopyArgs = @(
        $sourceDir,
        $backupDir,
        "/MIR",
        "/XD", "node_modules", ".git", "dist",
        "/XF", "*.log", "*.tmp",
        "/R:3",
        "/W:10",
        "/LOG+:$logFile"
    )
    
    Start-Process -FilePath "robocopy" -ArgumentList $robocopyArgs -Wait -WindowStyle Hidden
    
    Add-Content $logFile "[$timestamp] BACKUP COMPLETATO"
    
} catch {
    Add-Content $logFile "[$timestamp] ERRORE: $($_.Exception.Message)"
}