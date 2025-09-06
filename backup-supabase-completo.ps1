# Sistema Backup Completo Supabase - Dallelec
# Backup immediato con salvataggio su OneDrive

param(
    [string]$BackupName = "",
    [switch]$OpenFolder = $false
)

# Configurazione
$ProjectPath = "c:\Users\TestQ\Desktop\gestionale\Dallelec_app"
$LogFile = "$ProjectPath\backup-supabase-log.txt"
$OneDriveBackupPath = "c:\Users\TestQ\OneDrive\Backup_Dallelec_Dati"
$LocalBackupPath = "c:\Users\TestQ\Desktop\DallelecBackups"

# Credenziali Supabase
$SupabaseUrl = "https://aumhdoiwtichjlvbrnrl.supabase.co"
$SupabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA"

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry -ForegroundColor Green
    Add-Content -Path $LogFile -Value $LogEntry
}

function Write-Error-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] ERRORE: $Message"
    Write-Host $LogEntry -ForegroundColor Red
    Add-Content -Path $LogFile -Value $LogEntry
}

function Create-BackupFolders {
    if (-not (Test-Path $LocalBackupPath)) {
        New-Item -Path $LocalBackupPath -ItemType Directory -Force | Out-Null
        Write-Log "Creata cartella backup locale: $LocalBackupPath"
    }
    
    if (-not (Test-Path $OneDriveBackupPath)) {
        New-Item -Path $OneDriveBackupPath -ItemType Directory -Force | Out-Null
        Write-Log "Creata cartella backup OneDrive: $OneDriveBackupPath"
    }
}

function Get-SupabaseTable {
    param([string]$TableName)
    
    try {
        $Headers = @{
            "apikey" = $SupabaseKey
            "Authorization" = "Bearer $SupabaseKey"
            "Content-Type" = "application/json"
        }
        
        $Url = "$SupabaseUrl/rest/v1/$TableName"
        
        Write-Host "  Scaricando dati da: $TableName..." -ForegroundColor Yellow
        
        $Response = Invoke-RestMethod -Uri $Url -Method GET -Headers $Headers -ErrorAction Stop
        
        # Se la risposta è un array, conta gli elementi
        $Count = if ($Response -is [array]) { $Response.Count } else { if ($Response) { 1 } else { 0 } }
        
        return @{
            success = $true
            data = $Response
            count = $Count
        }
        
    } catch {
        Write-Error-Log "Errore scaricamento tabella $TableName : $($_.Exception.Message)"
        return @{
            success = $false
            error = $_.Exception.Message
            count = 0
        }
    }
}

function Backup-AllTables {
    Write-Log "Avvio backup completo Supabase..."
    
    # Tabelle da includere nel backup
    $Tables = @(
        "absences", "admins", "chantiers", "chefdechantiers", "clients",
        "collaborateurs", "conditions", "configuration", "devis", "factures",
        "familles", "heures_chef_interim", "heures_chef_propres", "heures_ouvriers",
        "interimaires", "metrages", "paiements", "produits", "resoconti_percentuali",
        "sousfamilles", "supplements", "techniciens"
    )
    
    $BackupData = @{
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        version = "1.0"
        source = "Supabase"
        database_url = $SupabaseUrl
        backup_type = "complete"
        backup_name = if ($BackupName) { $BackupName } else { "Backup automatico" }
        tables = @{}
        summary = @{
            total_tables = $Tables.Count
            successful_tables = 0
            failed_tables = 0
            total_records = 0
        }
    }
    
    Write-Log "Tabelle da processare: $($Tables.Count)"
    
    $TableIndex = 0
    foreach ($Table in $Tables) {
        $TableIndex++
        Write-Log "[$TableIndex/$($Tables.Count)] Backup tabella: $Table"
        
        $TableResult = Get-SupabaseTable -TableName $Table
        
        if ($TableResult.success) {
            $BackupData.tables[$Table] = @{
                count = $TableResult.count
                data = $TableResult.data
                last_backup = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                status = "success"
            }
            $BackupData.summary.successful_tables++
            $BackupData.summary.total_records += $TableResult.count
            Write-Log "  ✓ $Table: $($TableResult.count) record"
        } else {
            $BackupData.tables[$Table] = @{
                error = $TableResult.error
                status = "failed"
                count = 0
            }
            $BackupData.summary.failed_tables++
            Write-Error-Log "  ✗ $Table: FALLITO"
        }
    }
    
    return $BackupData
}

function Save-BackupFile {
    param([hashtable]$BackupData)
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $BackupFileName = if ($BackupName) {
        "dallelec-backup-$BackupName-$Timestamp.json"
    } else {
        "dallelec-backup-completo-$Timestamp.json"
    }
    
    # Salva locale
    $LocalFile = "$LocalBackupPath\$BackupFileName"
    $BackupData | ConvertTo-Json -Depth 10 | Out-File -FilePath $LocalFile -Encoding UTF8
    Write-Log "Backup salvato localmente: $LocalFile"
    
    # Copia su OneDrive
    $OneDriveFile = "$OneDriveBackupPath\$BackupFileName"
    Copy-Item -Path $LocalFile -Destination $OneDriveFile -Force
    Write-Log "Backup copiato su OneDrive: $OneDriveFile"
    
    return @{
        local = $LocalFile
        onedrive = $OneDriveFile
        filename = $BackupFileName
    }
}

function Show-BackupSummary {
    param([hashtable]$BackupData, [hashtable]$Files)
    
    Write-Host "`n" -NoNewline
    Write-Host "=== RIEPILOGO BACKUP COMPLETO ===" -ForegroundColor Cyan
    Write-Host "Data: $($BackupData.timestamp)" -ForegroundColor White
    Write-Host "Nome: $($BackupData.backup_name)" -ForegroundColor White
    Write-Host "Tabelle totali: $($BackupData.summary.total_tables)" -ForegroundColor White
    Write-Host "Tabelle riuscite: $($BackupData.summary.successful_tables)" -ForegroundColor Green
    Write-Host "Tabelle fallite: $($BackupData.summary.failed_tables)" -ForegroundColor Red
    Write-Host "Record totali: $($BackupData.summary.total_records)" -ForegroundColor Yellow
    Write-Host "`nFile salvati:" -ForegroundColor White
    Write-Host "  Locale: $($Files.local)" -ForegroundColor Gray
    Write-Host "  OneDrive: $($Files.onedrive)" -ForegroundColor Gray
    Write-Host "=================================" -ForegroundColor Cyan
}

# Main Script
Clear-Host
Write-Host "🔄 BACKUP COMPLETO SUPABASE - DALLELEC" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Write-Log "=== AVVIO BACKUP COMPLETO SUPABASE ==="

# Crea cartelle backup
Create-BackupFolders

# Esegui backup
$BackupData = Backup-AllTables

if ($BackupData.summary.successful_tables -gt 0) {
    # Salva file
    $Files = Save-BackupFile -BackupData $BackupData
    
    # Mostra riepilogo
    Show-BackupSummary -BackupData $BackupData -Files $Files
    
    Write-Log "=== BACKUP COMPLETATO CON SUCCESSO ==="
    
    # Apri cartella se richiesto
    if ($OpenFolder) {
        Start-Process -FilePath "explorer.exe" -ArgumentList $OneDriveBackupPath
    }
    
    # Pausa per vedere i risultati
    Write-Host "`nPremi un tasto per continuare..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
} else {
    Write-Error-Log "=== BACKUP FALLITO COMPLETAMENTE ==="
    Write-Host "Nessuna tabella è stata salvata con successo!" -ForegroundColor Red
    exit 1
}