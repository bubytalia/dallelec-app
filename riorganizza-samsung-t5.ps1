# Script per riorganizzare Samsung T5 con struttura corretta
$driveD = "D:"
$logFile = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app\riorganizza-log.txt"

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content $logFile "[$timestamp] INIZIO RIORGANIZZAZIONE Samsung T5"

try {
    # 1. Crea nuova struttura cartelle
    $archivioDir = "$driveD\ARCHIVIO"
    $gestionaleDir = "$driveD\GESTIONALE"
    $fileGestionaleDir = "$gestionaleDir\file-gestionale"
    $backupDir = "$gestionaleDir\backup"
    
    New-Item -ItemType Directory -Path $archivioDir -Force
    New-Item -ItemType Directory -Path $gestionaleDir -Force  
    New-Item -ItemType Directory -Path $fileGestionaleDir -Force
    New-Item -ItemType Directory -Path $backupDir -Force
    
    Add-Content $logFile "[$timestamp] Cartelle create: ARCHIVIO, GESTIONALE\file-gestionale, GESTIONALE\backup"
    
    # 2. Sposta cartelle non-gestionale in ARCHIVIO
    if (Test-Path "$driveD\gestionale\google drivi") {
        Move-Item "$driveD\gestionale\google drivi" "$archivioDir\google drivi" -Force
        Add-Content $logFile "[$timestamp] Spostato: google drivi -> ARCHIVIO"
    }
    
    if (Test-Path "$driveD\gestionale\vecchi") {
        Move-Item "$driveD\gestionale\vecchi" "$archivioDir\vecchi" -Force
        Add-Content $logFile "[$timestamp] Spostato: vecchi -> ARCHIVIO"
    }
    
    # 3. Sposta backup-dati in GESTIONALE\backup
    Get-ChildItem "$driveD\gestionale" -Directory | Where-Object { $_.Name -like "backup-dati-*" } | ForEach-Object {
        Move-Item $_.FullName "$backupDir\$($_.Name)" -Force
        Add-Content $logFile "[$timestamp] Spostato backup: $($_.Name) -> GESTIONALE\backup"
    }
    
    # 4. Sposta file gestionale in GESTIONALE\file-gestionale
    $filesToMove = @("*.md", "*.txt", "*.sql", "*.js", "*.ps1", "*.bat", "*.json")
    foreach ($pattern in $filesToMove) {
        Get-ChildItem "$driveD\gestionale" -File -Filter $pattern | ForEach-Object {
            Move-Item $_.FullName "$fileGestionaleDir\$($_.Name)" -Force
        }
    }
    
    # Sposta cartelle progetto
    $foldersToMove = @("src", "public", ".vscode", ".firebase", ".netlify", "scripts")
    foreach ($folder in $foldersToMove) {
        if (Test-Path "$driveD\gestionale\$folder") {
            Move-Item "$driveD\gestionale\$folder" "$fileGestionaleDir\$folder" -Force
        }
    }
    
    Add-Content $logFile "[$timestamp] File e cartelle gestionale spostati in GESTIONALE\file-gestionale"
    
    Add-Content $logFile "[$timestamp] RIORGANIZZAZIONE COMPLETATA"
    
} catch {
    Add-Content $logFile "[$timestamp] ERRORE: $($_.Exception.Message)"
}

# Mostra nuova struttura
Add-Content $logFile "[$timestamp] NUOVA STRUTTURA:"
Add-Content $logFile "D:\ARCHIVIO\ (google drivi, vecchi)"
Add-Content $logFile "D:\GESTIONALE\file-gestionale\ (codice e file progetto)"
Add-Content $logFile "D:\GESTIONALE\backup\ (backup-dati-xxx)"